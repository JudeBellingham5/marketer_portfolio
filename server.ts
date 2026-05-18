import express from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "portfolio.json");
const ADMIN_PASSWORD = "0925";
const AUTH_TOKEN = "token-admin-authorized-0925";

// Multer configuration for memory storage (though we mostly use Base64 now)
const upload = multer({ storage: multer.memoryStorage() });

async function startServer() {
  app.use(express.json({ limit: "50mb" })); // Increase limit for Base64 images
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Expose local uploads directory (for legacy support if needed)
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadDir));

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Login route
  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
      return res.json({ success: true, token: AUTH_TOKEN });
    }
    return res.status(401).json({ success: false, message: "Invalid password" });
  });

  // Get portfolio data
  app.get("/api/portfolio", (req, res) => {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
        return res.json(data);
      }
      return res.status(404).json({ error: "Data file not found" });
    } catch (error) {
      console.error("Read error:", error);
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  // Update portfolio data
  app.post("/api/portfolio", (req, res) => {
    const authToken = req.headers.authorization;
    if (authToken !== AUTH_TOKEN) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
      res.json({ success: true });
    } catch (error) {
      console.error("Save error:", error);
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  // Legacy upload route (optional now since we use Base64)
  app.post("/api/upload", upload.single("file"), (req, res) => {
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
      const filePath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filePath, req.file.buffer);
      res.json({ success: true, url: `/uploads/${filename}` });
    } catch (error) {
      res.status(500).json({ error: "Upload failed" });
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
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
