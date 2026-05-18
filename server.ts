import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

// Initialize Firebase Admin correctly
if (getApps().length === 0) {
  initializeApp({
    projectId: firebaseConfig.projectId,
    storageBucket: firebaseConfig.storageBucket,
  });
}

// Specify the databaseId to avoid PERMISSION_DENIED on the default instance
const db = getFirestore(firebaseConfig.firestoreDatabaseId);
const bucket = getStorage().bucket();

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "portfolio.json");
const ADMIN_PASSWORD = "0925";
const AUTH_TOKEN = "fake-jwt-token-0925";

// Multer configuration for memory storage (since we upload to Firebase)
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  const app = express();
  app.use(express.json());

  // Serve static files from local uploads (if they exist)
  const UPLOADS_DIR = path.join(process.cwd(), "public/uploads");
  if (fs.existsSync(UPLOADS_DIR)) {
    app.use("/uploads", express.static(UPLOADS_DIR));
  }

  // API Routes
  app.get("/api/portfolio", async (req, res) => {
    try {
      const docRef = db.collection("configs").doc("portfolio");
      const docSnap = await docRef.get();
      if (docSnap.exists) {
        return res.json(docSnap.data());
      }
      
      // Seed if doc doesn't exist
      const localData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
      try {
        await docRef.set(localData);
      } catch (writeError) {
        console.error("Failed to seed firestore:", writeError);
      }
      return res.json(localData);
    } catch (error) {
      console.error("Firestore read error, falling back to local file:", error);
      try {
        const localData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        return res.json(localData);
      } catch (fileError) {
        return res.status(500).json({ error: "Failed to read data from any source" });
      }
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    console.log("Login attempt with password:", password);
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true, token: AUTH_TOKEN });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  app.post("/api/portfolio", async (req, res) => {
    const authToken = req.headers.authorization;
    if (authToken !== AUTH_TOKEN) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      // Primary: Firestore
      const docRef = db.collection("configs").doc("portfolio");
      await docRef.set(req.body);
      
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
        res.status(500).json({ error: "Failed to save data to any source" });
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
      const filename = `uploads/${uniqueSuffix}${path.extname(req.file.originalname)}`;
      const file = bucket.file(filename);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      // Make the file public (simplier for portfolio images)
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
      res.json({ success: true, url: publicUrl });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Failed to upload file to storage" });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
