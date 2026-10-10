import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  const photosDir = path.join(process.cwd(), "public", "assets", "venue", "photos");
  const manifestPath = path.join(photosDir, "manifest.json");

  // Ensure photos directory exists
  try {
    const fs = await import("fs");
    if (!fs.existsSync(photosDir)) {
      fs.mkdirSync(photosDir, { recursive: true });
    }
  } catch (err) {
    console.error("Error creating photos directory:", err);
  }

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      venue: "H H Events & Conventions",
      timestamp: new Date().toISOString(),
    });
  });

  // Get uploaded photos manifest
  app.get("/api/photos", async (req, res) => {
    try {
      const fs = await import("fs/promises");
      const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
      if (exists) {
        const raw = await fs.readFile(manifestPath, "utf-8");
        return res.json(JSON.parse(raw));
      }
      res.json({ photos: {}, lastUpdated: new Date().toISOString() });
    } catch (err) {
      console.error("Failed to read photo manifest:", err);
      res.json({ photos: {}, lastUpdated: new Date().toISOString() });
    }
  });

  // Upload real photo endpoint (accepts base64 encoded real image)
  app.post("/api/photos/upload", async (req, res) => {
    try {
      const { slotId, filename, dataUrl } = req.body;
      if (!slotId || !dataUrl) {
        return res.status(400).json({ error: "Missing slotId or dataUrl" });
      }

      const fs = await import("fs/promises");
      if (!fs.stat(photosDir).then(() => true).catch(() => false)) {
        await fs.mkdir(photosDir, { recursive: true });
      }

      // Parse base64 data
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid image data format. Expected base64 data URL." });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Generate clean filename
      const ext = mimeType.includes("png") ? "png" : mimeType.includes("webp") ? "webp" : "jpg";
      const safeFilename = `${slotId}-${Date.now()}.${ext}`;
      const filePath = path.join(photosDir, safeFilename);

      await fs.writeFile(filePath, buffer);
      const publicUrl = `/assets/venue/photos/${safeFilename}`;

      // Update manifest
      let manifest: { photos: Record<string, { url: string; filename: string; mimeType: string; uploadedAt: string }>; lastUpdated: string } = {
        photos: {},
        lastUpdated: new Date().toISOString(),
      };

      try {
        const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
        if (exists) {
          manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
        }
      } catch (e) {
        // use default
      }

      manifest.photos[slotId] = {
        url: publicUrl,
        filename: safeFilename,
        mimeType,
        uploadedAt: new Date().toISOString(),
      };
      manifest.lastUpdated = new Date().toISOString();

      await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");

      res.json({
        success: true,
        slotId,
        url: publicUrl,
        filename: safeFilename,
      });
    } catch (err: any) {
      console.error("Failed to upload photo:", err);
      res.status(500).json({ error: err.message || "Failed to save photo" });
    }
  });

  // Delete/reset photo
  app.delete("/api/photos/:slotId", async (req, res) => {
    try {
      const { slotId } = req.params;
      const fs = await import("fs/promises");
      const exists = await fs.stat(manifestPath).then(() => true).catch(() => false);
      if (exists) {
        const manifest = JSON.parse(await fs.readFile(manifestPath, "utf-8"));
        if (manifest.photos && manifest.photos[slotId]) {
          const fileToRemove = path.join(photosDir, manifest.photos[slotId].filename);
          await fs.unlink(fileToRemove).catch(() => {});
          delete manifest.photos[slotId];
          manifest.lastUpdated = new Date().toISOString();
          await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf-8");
        }
      }
      res.json({ success: true, slotId });
    } catch (err: any) {
      res.status(500).json({ error: err.message || "Failed to remove photo" });
    }
  });

  // Vite middleware for development or static serving for production
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
    console.log(`H H Events & Conventions app running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
