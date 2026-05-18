import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, collection } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

// Initialize Firebase Client SDK (preferred for robustness in AI Studio environment)
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);
const storage = getStorage(firebaseApp);

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "portfolio.json");
const ADMIN_PASSWORD = "0925";
const AUTH_TOKEN = "token-admin-authorized-0925";

// Multer configuration for memory storage
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  
  // Body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Diagnostic logging for ALL requests
  app.use((req, res, next) => {
    console.log(`[REQUEST] ${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Expose local uploads directory
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadDir));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      env: process.env.NODE_ENV || "development",
      time: new Date().toISOString()
    });
  });

  // Simplified login route to debug 404
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    console.log("Login attempt...");
    
    if (password === ADMIN_PASSWORD) {
      console.log("Login success");
      return res.json({ success: true, token: AUTH_TOKEN });
    } else {
      console.log("Login failed");
      return res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  // Get portfolio data
  app.get("/api/portfolio", async (req, res) => {
    try {
      const docRef = doc(db, "configs", "portfolio");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return res.json(docSnap.data());
      }
      
      // Seed if doc doesn't exist
      if (fs.existsSync(DATA_FILE)) {
        const localData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        try {
          await setDoc(docRef, localData);
        } catch (writeError) {
          console.error("Failed to seed firestore:", writeError);
        }
        return res.json(localData);
      }
      
      return res.status(404).json({ error: "Portfolio data not found" });
    } catch (error) {
      console.error("Firestore read error:", error);
      if (fs.existsSync(DATA_FILE)) {
        try {
          return res.json(JSON.parse(fs.readFileSync(DATA_FILE, "utf-8")));
        } catch (fileError) {
          console.error("Local file read error:", fileError);
        }
      }
      return res.status(500).json({ error: "Failed to read data from any source" });
    }
  });

  // Update portfolio data
  app.post("/api/portfolio", async (req, res) => {
    const authToken = req.headers.authorization;
    if (authToken !== AUTH_TOKEN) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      // Primary: Firestore
      const docRef = doc(db, "configs", "portfolio");
      await setDoc(docRef, req.body);
      
      // Secondary: Local file backup
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
      } catch (fileError) {
        console.error("Local backup failed:", fileError);
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Save portfolio error:", error);
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
        return res.json({ success: true, message: "Saved to local backup only" });
      } catch (fileError) {
        res.status(500).json({ error: "Failed to save data." });
      }
    }
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    const authToken = req.headers.authorization;
    if (authToken !== AUTH_TOKEN) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname);
      const filename = `${uniqueSuffix}${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, req.file.buffer);

      const publicUrl = `/uploads/${filename}`;
      res.json({ success: true, url: publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file locally." });
    }
  });

  // Vite / Static files
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      
      // Handle all other API requests with 404
      app.all("/api/*", (req, res) => {
        res.status(404).json({ error: `API route not found: ${req.method} ${req.url}` });
      });

      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    } else {
      console.warn("Dist path not found, API only mode active.");
      app.get("*", (req, res) => {
        res.status(500).send("Application not built correctly. Dist folder missing.");
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
