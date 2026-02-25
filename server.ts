import express from "express";
import { createServer as createViteServer } from "vite";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import fs from "fs";

const app = express();
const PORT = 3000;

// Ensure uploads directory exists
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// --- Production Feature: Auto-cleanup old files ---
// Runs every 15 minutes, deletes files older than 1 hour
const CLEANUP_INTERVAL = 15 * 60 * 1000; 
const MAX_AGE = 60 * 60 * 1000; 

setInterval(() => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("Cleanup read error:", err);
      return;
    }
    const now = Date.now();
    files.forEach(file => {
      const filePath = path.join(uploadDir, file);
      fs.stat(filePath, (err, stats) => {
        if (err) return;
        if (now - stats.mtimeMs > MAX_AGE) {
          fs.unlink(filePath, (err) => {
            if (!err) console.log(`[Cleanup] Deleted expired file: ${file}`);
          });
        }
      });
    });
  });
}, CLEANUP_INTERVAL);
// --------------------------------------------------

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, uuidv4() + ext);
  },
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit
});

// Serve uploaded files
app.use("/uploads", express.static(uploadDir));

// Video player route (Mobile Optimized & Branded)
app.get("/v/:id", (req, res) => {
  const id = req.params.id;
  const filePath = path.join(uploadDir, id);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Video Expired - Beam</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; background: #09090b; color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 20px; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          p { color: #a1a1aa; line-height: 1.5; max-width: 400px; }
        </style>
      </head>
      <body>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 16px;"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>
        <h1>Video Expired or Not Found</h1>
        <p>This video may have been deleted automatically after 1 hour for security and storage reasons.</p>
      </body>
      </html>
    `);
  }

  const videoUrl = `/uploads/${id}`;

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Beam - Shared Video</title>
      <style>
        :root { --bg: #09090b; --fg: #fafafa; --accent: #4f46e5; --accent-hover: #4338ca; }
        body {
          margin: 0; padding: 0; background-color: var(--bg); color: var(--fg);
          display: flex; flex-direction: column; height: 100vh;
          font-family: system-ui, -apple-system, sans-serif;
        }
        header {
          padding: 20px; display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .logo-icon {
          width: 28px; height: 28px; background: var(--accent); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text { font-weight: 700; font-size: 20px; letter-spacing: -0.5px; }
        main {
          flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 20px;
        }
        .video-container {
          width: 100%; max-width: 600px; border-radius: 16px; overflow: hidden;
          background: #000; box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          border: 1px solid rgba(255,255,255,0.1);
        }
        video { width: 100%; max-height: 70vh; display: block; }
        .actions { margin-top: 32px; width: 100%; max-width: 600px; }
        a.btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          background-color: var(--accent); color: white; padding: 16px 24px;
          border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px;
          transition: background 0.2s;
        }
        a.btn:hover { background-color: var(--accent-hover); }
        .footer-text { margin-top: 24px; font-size: 13px; color: #71717a; text-align: center; }
      </style>
    </head>
    <body>
      <header>
        <div class="logo-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
        </div>
        <div class="logo-text">Beam</div>
      </header>
      <main>
        <div class="video-container">
          <video src="${videoUrl}" controls autoplay playsinline></video>
        </div>
        <div class="actions">
          <a href="${videoUrl}" download class="btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Save to Device
          </a>
          <p class="footer-text">This video will be automatically deleted in 1 hour.</p>
        </div>
      </main>
    </body>
    </html>
  `);
});

// API routes
app.post("/api/upload", (req, res, next) => {
  upload.single("video")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: "File is too large. Maximum size is 500MB." });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(500).json({ error: "An unknown error occurred during upload." });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No video file provided" });
  }
  
  // Return the path to the uploaded file
  res.json({ 
    url: `/v/${req.file.filename}`,
    filename: req.file.filename
  });
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
