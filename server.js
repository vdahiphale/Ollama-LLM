import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs/promises";
import fetch from "node-fetch";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { createCanvas } from "canvas";
import pdfjsLib from "pdfjs-dist/legacy/build/pdf.js";

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

app.post("/api/llm", upload.single("file"), async (req, res) => {
  const model = req.body.model || "granite";
  const query = req.body.query || "";
  const filePath = req.file?.path;
  const originalName = req.file?.originalname || "";
  const ext = path.extname(originalName).toLowerCase();
  const isPDF = ext === ".pdf";
  let result = "";

  try {
    if (!filePath) {
      return res.status(400).json({ error: "No file uploaded." });
    }

    if (model === "llama") {
      if (!isPDF) {
        return res.status(400).json({ error: "Only PDF files are supported with LLaMA 3." });
      }

      const buffer = await fs.readFile(filePath);
      const parsed = await pdfParse(buffer);
      const extractedText = parsed.text?.trim();

      if (!extractedText) {
        return res.status(400).json({ error: "No text could be extracted from the PDF." });
      }

      const prompt = `${query.trim()}\n\n--- Resume Text ---\n${extractedText}`;

      const llamaRes = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "llama3",
          prompt,
          stream: false,
        }),
      });

      const llamaData = await llamaRes.json();
      if (!llamaData.response) {
        return res.status(400).json({ error: "No response from LLaMA 3." });
      }

      result = llamaData.response;
    } else {
      let combinedHtml = "";

      if (!isPDF) {
        const buffer = await fs.readFile(filePath);
        const base64 = buffer.toString("base64");

        const graniteRes = await fetch("http://localhost:11434/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "granite3.2-vision:2b",
            prompt: query,
            images: [base64],
            stream: false,
          }),
        });

        const graniteData = await graniteRes.json();
        if (!graniteData.response) {
          return res.status(400).json({ error: "No response from Granite model." });
        }

        result = graniteData.response;
      } else {
        const buffer = await fs.readFile(filePath);
        const pdfData = new Uint8Array(buffer);
        const pdfDoc = await pdfjsLib.getDocument({ data: pdfData }).promise;
        const totalPages = pdfDoc.numPages;

        for (let i = 1; i <= totalPages; i++) {
          const page = await pdfDoc.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          const canvas = createCanvas(viewport.width, viewport.height);
          const context = canvas.getContext("2d");

          await page.render({ canvasContext: context, viewport }).promise;
          const dataUrl = canvas.toDataURL("image/png");
          const base64 = dataUrl.split(",")[1];

          const chunkPrompt = `
You are processing page ${i} of ${totalPages} of a multi-page resume.
Only extract structured information from this page.

${query}
          `.trim();

          const graniteRes = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "granite3.2-vision:2b",
              prompt: chunkPrompt,
              images: [base64],
              stream: false,
            }),
          });

          const graniteData = await graniteRes.json();
          if (!graniteData.response) {
            throw new Error(`Missing response from Granite on page ${i}`);
          }

          combinedHtml += `<section><h2>Page ${i}</h2>${graniteData.response}</section>\n`;
        }

        result = combinedHtml;
      }
    }

    res.json({ html: result });
  } catch (err) {
    console.error("LLM Error:", err.message);
    res.status(500).json({ error: "Failed to process with model." });
  } finally {
    try {
      if (filePath) await fs.unlink(filePath);
    } catch (e) {
      console.warn("Failed to delete file:", e.message);
    }
  }
});

app.listen(3001, () => {
  console.log("✅ Server running on http://localhost:3001");
});
