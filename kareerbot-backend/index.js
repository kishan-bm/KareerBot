import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/review-resume", async (req, res) => {
  try {
    const { resumeText } = req.body;

    const prompt = `You are a career expert. Review the following resume and give 3 strengths and 3 improvement suggestions:\n\n${resumeText}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // ✅ use latest
    const result = await model.generateContent(prompt);

    const answer = result.response.text();
    res.json({ feedback: answer });
  } catch (err) {
    console.error("Gemini API error:", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
