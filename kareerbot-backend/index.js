import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";
import multer from "multer";
import fs from "fs";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// ---------- Review Resume (text input) ----------
app.post("/api/review-resume", async (req, res) => {
  console.log("Received POST /api/review-resume");
  try {
    const { resumeText } = req.body;

    const prompt = `
      You are an experienced HR recruiter and career coach.
      Review the following resume text and provide feedback.

      Instructions:
      - Identify exactly 3 key strengths (skills, experiences, or achievements).
      - Identify exactly 3 areas for improvement (clarity, formatting, missing skills, etc).
      - Be concise and use simple language that a fresher can understand.

      Output format (strict JSON only, no extra text):
      {
        "strengths": ["point 1", "point 2", "point 3"],
        "improvements": ["point 1", "point 2", "point 3"]
      }

      Resume:
      ${resumeText}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    let textResponse = result.response.text();
    // 🧹 Remove code fences if AI adds them
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    let feedback;
    try {
      feedback = JSON.parse(textResponse);
    } catch (e) {
      console.error("AI did not return valid JSON. Raw response:", textResponse);
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    res.json({ feedback });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// ---------- Upload Resume (file upload) ----------
app.post("/api/upload-resume", upload.single("file"), async (req, res) => {
  try {
    let resumeText = "";

    if (req.file.mimetype === "application/pdf") {
      const PDFParser = (await import("pdf2json")).default;
      const pdfParser = new PDFParser();

      resumeText = await new Promise((resolve, reject) => {
        pdfParser.on("pdfParser_dataError", (err) => reject(err.parserError));
        pdfParser.on("pdfParser_dataReady", (pdfData) => {
          const text = pdfData.Pages.map((page) =>
            page.Texts.map((t) =>
              decodeURIComponent(t.R[0].T)
            ).join(" ")
          ).join("\n");
          resolve(text);
        });
        pdfParser.loadPDF(req.file.path);
      });
    } else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth"); // ✅ lazy import
      const result = await mammoth.extractRawText({
        path: req.file.path,
      });
      resumeText = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type" });
    }

    const prompt = `
      You are an experienced HR recruiter and career coach.
      Review the following resume text and provide feedback.

      Instructions:
      - Identify exactly 3 key strengths (skills, experiences, or achievements).
      - Identify exactly 3 areas for improvement (clarity, formatting, missing skills, etc).
      - Be concise and use simple language that a fresher can understand.

      Output format (strict JSON only, no extra text):
      {
        "strengths": ["point 1", "point 2", "point 3"],
        "improvements": ["point 1", "point 2", "point 3"]
      }

      Resume:
      ${resumeText}
    `;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    let textResponse = result.response.text();
    // 🧹 Remove code fences if AI adds them
    textResponse = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    let feedback;
    try {
      feedback = JSON.parse(textResponse);
    } catch (e) {
      console.error("AI did not return valid JSON. Raw response:", textResponse);
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    res.json({ feedback });
  } catch (err) {
    console.error("File upload error:", err);
    res.status(500).json({ error: "Something went wrong while processing file" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));