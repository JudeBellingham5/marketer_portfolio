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
  // Middleware to log requests for debugging
  app.use((req, res, next) => {
    console.log(`[SERVER] ${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
  });

  // Body parsers
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // API Routes
  app.get("/api/health", (req, res) => {
    console.log("[SERVER] Health check");
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.post("/api/admin/login", (req, res) => {
    const { password } = req.body;
    console.log(`[SERVER] Auth attempt with password: ${password}`);
    if (password === ADMIN_PASSWORD) {
      return res.json({ success: true, token: AUTH_TOKEN });
    }
    return res.status(401).json({ success: false, message: "Invalid password" });
  });

  app.get("/api/portfolio", (req, res) => {
    console.log("[SERVER] GET /api/portfolio");
    try {
      if (fs.existsSync(DATA_FILE)) {
        const data = fs.readFileSync(DATA_FILE, "utf-8");
        return res.json(JSON.parse(data));
      }
      console.warn("[SERVER] portfolio.json not found");
      return res.status(404).json({ error: "Data file not found" });
    } catch (error) {
      console.error("[SERVER] Read error:", error);
      res.status(500).json({ error: "Failed to read data" });
    }
  });

  app.post("/api/save-portfolio", (req, res) => {
    const authToken = req.headers.authorization;
    console.log(`[SERVER] POST /api/save-portfolio - Token: ${authToken}`);
    
    if (authToken !== AUTH_TOKEN) {
      console.warn("[SERVER] Unauthorized save attempt");
      return res.status(403).json({ error: "Unauthorized" });
    }

    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
      console.log("[SERVER] Successfully updated portfolio.json");
      res.json({ success: true });
    } catch (error) {
      console.error("[SERVER] Save error:", error);
      res.status(500).json({ error: "Failed to save data" });
    }
  });

  app.post("/api/upload", upload.single("file"), (req, res) => {
    const authToken = req.headers.authorization;
    if (authToken !== AUTH_TOKEN) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname);
      const filename = `${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, filename);
      
      fs.writeFileSync(filePath, req.file.buffer);
      res.json({ success: true, url: `/uploads/${filename}` });
    } catch (error) {
      console.error("[API] Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Catch-all for API to debug 404s (must be AFTER all other API routes)
  app.all("/api/*", (req, res) => {
    console.warn(`[SERVER] Unhandled API request: ${req.method} ${req.url}`);
    res.status(404).json({ error: "API route not found", path: req.url });
  });

  // Expose local uploads directory
  const publicUploadDir = path.join(process.cwd(), "public", "uploads");
  if (fs.existsSync(publicUploadDir)) {
    app.use("/uploads", express.static(publicUploadDir));
  }

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

  // Catch-all 404 for debugging
  app.use((req, res) => {
    console.warn(`404 - Not Found: ${req.method} ${req.url}`);
    res.status(404).json({ error: "Route not found", method: req.method, url: req.url });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
