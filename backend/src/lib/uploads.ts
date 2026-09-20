import fs from "fs";
import path from "path";
import multer from "multer";
import type { RequestHandler } from "express";

const uploadsDir = path.join(process.cwd(), "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safeExt = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeExt}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Envie apenas arquivos de imagem."));
      return;
    }
    cb(null, true);
  },
}).single("image");

export const uploadsPath = uploadsDir;

export const handleUpload: RequestHandler = (req, res, next) => {
  uploadImage(req, res, (err) => {
    if (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : "Falha no upload.",
      });
      return;
    }
    next();
  });
};

export function isValidImageRef(value: string): boolean {
  return (
    /^https?:\/\//i.test(value) ||
    value.startsWith("/uploads/") ||
    value.startsWith("data:image/")
  );
}
