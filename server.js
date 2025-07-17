import { fromPath } from "pdf2pic";
import express from "express";
import cors from "cors";
import multer from "multer";
import { PDFDocument } from "pdf-lib";
import fs from "fs";
import fetch from "node-fetch";
import { createServer } from "http";
import path from "path";

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.post("/api/granite", upload.single("file"), async (req, res) => {
  const query = req.body.query || "";
  const filePath = req.file?.path;
  const originalName = req.file?.originalname;
  const ext = originalName ? path.extname(originalName).toLowerCase() : null;
  const isPDF = ext === ".pdf";
  let imageBuffers = [];

  try {
    if (filePath) {
      if (isPDF) {
        const fileBuffer = fs.readFileSync(filePath);
        const pdfDoc = await PDFDocument.load(fileBuffer);
        const pageCount = pdfDoc.getPageCount();

        const convert = fromPath(path.resolve(filePath), {
          density: 200,
          format: "png",
          width: 1654,
          height: 2339,
          savePath: "./temp",
        });

        for (let i = 1; i <= pageCount; i++) {
          const page = await convert(i, { responseType: "base64" });
          if (!page?.base64) break;
          imageBuffers.push(page.base64);
        }
      } else {
        const buffer = fs.readFileSync(filePath);
        imageBuffers = [buffer.toString("base64")];
      }
    }

    const graniteRes = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "granite3.2-vision:2b",
        prompt: query || "Describe the input if no query provided.",
        images: imageBuffers.length > 0 ? imageBuffers : undefined,
        stream: false,
      }),
    });

    const graniteData = await graniteRes.json();
    if (!graniteData.response) {
      return res.status(400).json({ error: "No response from Granite model." });
    }

    // Simply return HTML if it's HTML or fall back to raw text
    res.json({ html: graniteData.response });
  } catch (err) {
    console.error("Granite Error:", err.message);
    res.status(500).json({ error: "Failed to process with Granite." });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

const server = createServer(app);
server.listen(3001, () =>
  console.log("Server running on http://localhost:3001")
);
