import express from "express"; 
import cors from "cors"; 
import dotenv from "dotenv"; // Imports 'dotenv' to load environment variables from a `.env` file, like your API key.
import { GoogleGenerativeAI } from "@google/generative-ai"; // Imports the main client for the Gemini API.
import multer from "multer"; // Imports Multer, a middleware specifically for handling file uploads.
import fs from "fs"; // Imports the built-in Node.js File System module to interact with files on the server.

// These imports are for the new RAG (Retrieval-Augmented Generation) system.
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"; // This is a tool to break a large document (your resume) into smaller, manageable chunks.
import { Document } from "@langchain/core/documents"; // A standard format in LangChain to represent a piece of text.
import { createRetrievalChain } from "langchain/chains/retrieval"; // A chain that automates the RAG process: retrieve, augment, generate.
import { createStuffDocumentsChain } from "langchain/chains/combine_documents"; // A sub-chain that formats retrieved documents into a single prompt.
import { ChatPromptTemplate } from "@langchain/core/prompts"; // A template for building dynamic, structured prompts for the AI.
import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; // LangChain's specific wrapper for the Gemini model, which integrates with chains.
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; // The model that converts text into numerical vectors (embeddings).
import { MemoryVectorStore } from "langchain/vectorstores/memory"; // An in-memory vector database to store the resume's text and vectors.

dotenv.config(); // This line loads the variables from your `.env` file into `process.env`.
const app = express(); // Creates the Express application instance.
app.use(cors()); // Applies the CORS middleware, allowing your frontend to make requests.
app.use(express.json()); // Tells Express to parse JSON formatted request bodies.

const upload = multer({ dest: "uploads/" }); // Configures Multer to save uploaded files to a folder named "uploads".

// These are global variables that persist for the life of the server process.
// `vectorStore` will hold the processed resume data. It's `null` initially.
let vectorStore = null; 
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // The standard Gemini client for the initial feedback.
const chatModel = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
}); // This is the LangChain-compatible Gemini model. It's used for the conversational part.
const embeddings = new GoogleGenerativeAIEmbeddings(); // This client is used to create numerical vectors from text.

// ---------- The File Upload and Ingestion Endpoint ----------
// This endpoint handles both the initial file upload and the first-time setup of the RAG system.
app.post("/api/upload-resume", upload.single("file"), async (req, res) => {
  try {
    let resumeText = ""; // Variable to hold the extracted text from the resume.

    // This is the file parsing logic. It checks the file type and uses the appropriate library.
    // This is the "document loading" part of the RAG pipeline.
    if (req.file.mimetype === "application/pdf") {
      const PDFParser = (await import("pdf2json")).default;
      const pdfParser = new PDFParser();
      // ... code to extract text from PDF ...
    } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ path: req.file.path });
      resumeText = result.value;
    } else {
      return res.status(400).json({ error: "Unsupported file type" }); // Returns an error if the file type is not supported.
    }

    // This section is the core of the RAG system's **ingestion** process.
    const resumeDocument = new Document({ pageContent: resumeText }); // Wraps the extracted text in a `Document` object for LangChain.
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 }); // Initializes the text splitter. A `chunkSize` of 1000 means it aims to create chunks of ~1000 characters. `chunkOverlap` of 200 means each chunk will share 200 characters with the previous one, helping to maintain context.
    const docs = await textSplitter.splitDocuments([resumeDocument]); // Splits the single resume document into multiple smaller documents (chunks).
    
    // This is the **vectorization** step.
    // The `fromDocuments` method sends each text chunk to the `embeddings` model,
    // which converts it into a numerical vector.
    // These vectors and their original text are then stored in the `vectorStore`.
    vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

    // This section generates the **initial feedback**. It's separate from the RAG chat.
    const initialPrompt = `...`; // A detailed prompt to get the structured JSON output.
    const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(initialPrompt);
    let textResponse = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim(); // Cleans up the AI's response to ensure it's valid JSON.

    let feedback;
    try {
      feedback = JSON.parse(textResponse); // Parses the AI's response into a JSON object.
    } catch (e) {
      // ... error handling for invalid JSON ...
    }

    res.json({ feedback }); // Sends the structured feedback back to the frontend.

  } catch (err) {
    // ... general error handling ...
  } finally {
    if (req.file) {
      fs.unlinkSync(req.file.path); // Deletes the temporary file to prevent server storage from filling up.
    }
  }
});

// ---------- The Conversational Endpoint ----------
// This endpoint is where the **querying** part of the RAG system happens.
app.post("/api/chat", async (req, res) => {
  try {
    const { message } = req.body; // Extracts the user's chat message.

    if (!vectorStore) {
      return res.status(400).json({ error: "Please upload your resume first." }); // Ensures a resume has been ingested before allowing a chat.
    }

    // This is the core of the RAG query chain.
    const prompt = ChatPromptTemplate.fromTemplate(`
      ...
      Context: {context} // This is a placeholder for the retrieved resume chunks.
      Question: {input} // This is a placeholder for the user's question.
    `); // Defines the prompt template that the chain will use.

    // This line creates a chain that will take retrieved documents and "stuff" them into the {context} placeholder of the prompt.
    const documentChain = await createStuffDocumentsChain({ llm: chatModel, prompt });

    // This line creates the main RAG chain. It connects the document chain to a retriever.
    // The retriever is a LangChain tool that performs the semantic search on the vector store.
    const retrievalChain = await createRetrievalChain({ combineDocsChain: documentChain, retriever: vectorStore.asRetriever() });

    // This is the final step. `invoke` runs the entire RAG pipeline:
    // 1. Takes the user's `message`.
    // 2. The `retrievalChain`'s `retriever` uses the message to perform a semantic search on `vectorStore`.
    // 3. The `retrievalChain` takes the retrieved documents and passes them to the `documentChain`.
    // 4. The `documentChain` creates the final, augmented prompt and sends it to the `chatModel`.
    // 5. The `chatModel` generates a response based on the prompt.
    const result = await retrievalChain.invoke({ input: message });

    res.json({ reply: result.answer }); // Sends the final AI answer back.

  } catch (err) {
    // ... error handling ...
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`)); // Starts the server and listens for requests.