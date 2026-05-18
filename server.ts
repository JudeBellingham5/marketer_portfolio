import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";
import admin from "firebase-admin";
import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };

// Initialize Firebase Admin
admin.initializeApp({
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
});

const db = admin.firestore();
const bucket = admin.storage().bucket();

const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "portfolio.json");
const ADMIN_PASSWORD = "0925";

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
      const doc = await db.collection("configs").doc("portfolio").get();
      if (doc.exists) {
        res.json(doc.data());
      } else {
        // Fallback to local file or empty data, and seed Firestore
        const localData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        await db.collection("configs").doc("portfolio").set(localData);
        res.json(localData);
      }
    } catch (error) {
      console.error("Read portfolio error:", error);
      res.status(500).json({ error: "Failed to read data from database" });
    }
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      res.json({ success: true, token: "fake-jwt-token-0925" });
    } else {
      res.status(401).json({ success: false, message: "Invalid password" });
    }
  });

  app.post("/api/portfolio", async (req, res) => {
    const authToken = req.headers.authorization;
    if (authToken !== "fake-jwt-token-0925") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      await db.collection("configs").doc("portfolio").set(req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Save portfolio error:", error);
      res.status(500).json({ error: "Failed to save data to database" });
    }
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    const authToken = req.headers.authorization;
    if (authToken !== "fake-jwt-token-0925") {
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

      // Make the file public (optional, but easier for simple portfolio)
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
