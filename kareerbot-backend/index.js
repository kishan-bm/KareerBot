// import express from "express"; 
// import cors from "cors"; 
// import dotenv from "dotenv"; 
// import { GoogleGenerativeAI } from "@google/generative-ai"; 
// import multer from "multer"; 
// import fs from "fs"; 
// // These imports are for the new RAG (Retrieval-Augmented Generation) system.
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"; 
// import { Document } from "@langchain/core/documents"; 
// import { createRetrievalChain } from "langchain/chains/retrieval"; 
// import { createStuffDocumentsChain } from "langchain/chains/combine_documents"; 
// import { ChatPromptTemplate } from "@langchain/core/prompts"; 
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; 
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; 
// import { MemoryVectorStore } from "langchain/vectorstores/memory"; 

// dotenv.config(); 
// const app = express(); 
// app.use(cors()); 
// app.use(express.json()); 

// const upload = multer({ dest: "uploads/" }); 
// // These are global variables that persist for the life of the server process.
// // `vectorStore` will hold the processed resume data. It's `null` initially.
// let vectorStore = null; 
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // The standard Gemini client for the initial feedback.
// const chatModel = new ChatGoogleGenerativeAI({
//   model: "gemini-1.5-flash",
//   apiKey: process.env.GEMINI_API_KEY,
// }); 
// const embeddings = new GoogleGenerativeAIEmbeddings(); // This client is used to create numerical vectors from text.

// // ---------- The File Upload and Ingestion Endpoint ----------
// // This endpoint handles both the initial file upload and the first-time setup of the RAG system.
// app.post("/api/upload-resume", upload.single("file"), async (req, res) => {
//   try {
//     let resumeText = ""; 

//     // This is the "document loading" part of the RAG pipeline.
//     if (req.file.mimetype === "application/pdf") {
//       const PDFParser = (await import("pdf2json")).default;
//       const pdfParser = new PDFParser();
//       // ... code to extract text from PDF ...
//     } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
//       const mammoth = await import("mammoth");
//       const result = await mammoth.extractRawText({ path: req.file.path });
//       resumeText = result.value;
//     } else {
//       return res.status(400).json({ error: "Unsupported file type" }); // Returns an error if the file type is not supported.
//     }

//     // This section is the core of the RAG system's **ingestion** process.
//     const resumeDocument = new Document({ pageContent: resumeText }); // Wraps the extracted text in a `Document` object for LangChain.
//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 }); // Initializes the text splitter. A `chunkSize` of 1000 means it aims to create chunks of ~1000 characters. `chunkOverlap` of 200 means each chunk will share 200 characters with the previous one, helping to maintain context.
//     const docs = await textSplitter.splitDocuments([resumeDocument]); // Splits the single resume document into multiple smaller documents (chunks).
    
//     // This is the **vectorization** step.
//     // The `fromDocuments` method sends each text chunk to the `embeddings` model,
//     // which converts it into a numerical vector.
//     // These vectors and their original text are then stored in the `vectorStore`.
//     vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

//     // This section generates the **initial feedback**. It's separate from the RAG chat.
//     const initialPrompt = `...`; // A detailed prompt to get the structured JSON output.
//     const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(initialPrompt);
//     let textResponse = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim(); // Cleans up the AI's response to ensure it's valid JSON.

//     let feedback;
//     try {
//       feedback = JSON.parse(textResponse); // Parses the AI's response into a JSON object.
//     } catch (e) {
//       // ... error handling for invalid JSON ...
//     }

//     res.json({ feedback }); // Sends the structured feedback back to the frontend.

//   } catch (err) {
//     // ... general error handling ...
//   } finally {
//     if (req.file) {
//       fs.unlinkSync(req.file.path); // Deletes the temporary file to prevent server storage from filling up.
//     }
//   }
// });

// // ---------- The Conversational Endpoint ----------
// // This endpoint is where the **querying** part of the RAG system happens.
// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message } = req.body; // Extracts the user's chat message.

//     if (!vectorStore) {
//       return res.status(400).json({ error: "Please upload your resume first." }); // Ensures a resume has been ingested before allowing a chat.
//     }

//     // This is the core of the RAG query chain.
//     const prompt = ChatPromptTemplate.fromTemplate(`
//       ...
//       Context: {context} // This is a placeholder for the retrieved resume chunks.
//       Question: {input} // This is a placeholder for the user's question.
//     `); // Defines the prompt template that the chain will use.

//     // This line creates a chain that will take retrieved documents and "stuff" them into the {context} placeholder of the prompt.
//     const documentChain = await createStuffDocumentsChain({ llm: chatModel, prompt });

//     // The retriever is a LangChain tool that performs the semantic search on the vector store.
//     const retrievalChain = await createRetrievalChain({ combineDocsChain: documentChain, retriever: vectorStore.asRetriever() });

//     // This is the final step. `invoke` runs the entire RAG pipeline:
//     // 1. Takes the user's `message`.
//     // 2. The `retrievalChain`'s `retriever` uses the message to perform a semantic search on `vectorStore`.
//     // 3. The `retrievalChain` takes the retrieved documents and passes them to the `documentChain`.
//     // 4. The `documentChain` creates the final, augmented prompt and sends it to the `chatModel`.
//     // 5. The `chatModel` generates a response based on the prompt.
//     const result = await retrievalChain.invoke({ input: message });

//     res.json({ reply: result.answer }); // Sends the final AI answer back.

//   } catch (err) {
//     // ... error handling ...
//   }
// });

// const PORT = process.env.PORT || 6000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// import express from "express"; 
// import cors from "cors"; 
// import dotenv from "dotenv"; 
// import { GoogleGenerativeAI } from "@google/generative-ai"; 
// import multer from "multer"; 
// import fs from "fs"; 
// // These imports are for the new RAG (Retrieval-Augmented Generation) system.
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"; 
// import { Document } from "@langchain/core/documents"; 
// import { createRetrievalChain } from "langchain/chains/retrieval"; 
// import { createStuffDocumentsChain } from "langchain/chains/combine_documents"; 
// import { ChatPromptTemplate } from "@langchain/core/prompts"; 
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; 
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; 
// import { MemoryVectorStore } from "langchain/vectorstores/memory"; 

// dotenv.config(); 
// const app = express(); 
// app.use(cors()); 
// app.use(express.json()); 

// const upload = multer({ dest: "uploads/" }); 
// // These are global variables that persist for the life of the server process.
// // `vectorStore` will hold the processed resume data. It's `null` initially.
// let vectorStore = null; 
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // The standard Gemini client for the initial feedback.
// const chatModel = new ChatGoogleGenerativeAI({
//   model: "gemini-1.5-flash",
//   apiKey: process.env.GEMINI_API_KEY,
// }); 
// const embeddings = new GoogleGenerativeAIEmbeddings(); // This client is used to create numerical vectors from text.

// // ---------- The File Upload and Ingestion Endpoint ----------
// // This endpoint handles both the initial file upload and the first-time setup of the RAG system.
// app.post("/api/upload-resume", upload.single("file"), async (req, res) => {
//   try {
//     let resumeText = ""; 

//     // This is the "document loading" part of the RAG pipeline.
//     if (req.file.mimetype === "application/pdf") {
//       const PDFParser = (await import("pdf2json")).default;
//       const pdfParser = new PDFParser();
//       // ... code to extract text from PDF ...
//     } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
//       const mammoth = await import("mammoth");
//       const result = await mammoth.extractRawText({ path: req.file.path });
//       resumeText = result.value;
//     } else {
//       return res.status(400).json({ error: "Unsupported file type" }); // Returns an error if the file type is not supported.
//     }

//     // This section is the core of the RAG system's **ingestion** process.
//     const resumeDocument = new Document({ pageContent: resumeText }); // Wraps the extracted text in a `Document` object for LangChain.
//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 }); // Initializes the text splitter. A `chunkSize` of 1000 means it aims to create chunks of ~1000 characters. `chunkOverlap` of 200 means each chunk will share 200 characters with the previous one, helping to maintain context.
//     const docs = await textSplitter.splitDocuments([resumeDocument]); // Splits the single resume document into multiple smaller documents (chunks).
    
//     // This is the **vectorization** step.
//     // The `fromDocuments` method sends each text chunk to the `embeddings` model,
//     // which converts it into a numerical vector.
//     // These vectors and their original text are then stored in the `vectorStore`.
//     vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

//     // This section generates the **initial feedback**. It's separate from the RAG chat.
//     const initialPrompt = `...`; // A detailed prompt to get the structured JSON output.
//     const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(initialPrompt);
//     let textResponse = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim(); // Cleans up the AI's response to ensure it's valid JSON.

//     let feedback;
//     try {
//       feedback = JSON.parse(textResponse); // Parses the AI's response into a JSON object.
//     } catch (e) {
//       // ... error handling for invalid JSON ...
//     }

//     res.json({ feedback }); // Sends the structured feedback back to the frontend.

//   } catch (err) {
//     // ... general error handling ...
//   } finally {
//     if (req.file) {
//       fs.unlinkSync(req.file.path); // Deletes the temporary file to prevent server storage from filling up.
//     }
//   }
// });

// // ---------- The Conversational Endpoint ----------
// // This endpoint is where the **querying** part of the RAG system happens.
// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message } = req.body; // Extracts the user's chat message.

//     if (!vectorStore) {
//       return res.status(400).json({ error: "Please upload your resume first." }); // Ensures a resume has been ingested before allowing a chat.
//     }

//     // This is the core of the RAG query chain.
//     const prompt = ChatPromptTemplate.fromTemplate(`
//       ...
//       Context: {context} // This is a placeholder for the retrieved resume chunks.
//       Question: {input} // This is a placeholder for the user's question.
//     `); // Defines the prompt template that the chain will use.

//     // This line creates a chain that will take retrieved documents and "stuff" them into the {context} placeholder of the prompt.
//     const documentChain = await createStuffDocumentsChain({ llm: chatModel, prompt });

//     // The retriever is a LangChain tool that performs the semantic search on the vector store.
//     const retrievalChain = await createRetrievalChain({ combineDocsChain: documentChain, retriever: vectorStore.asRetriever() });

//     // This is the final step. `invoke` runs the entire RAG pipeline:
//     // 1. Takes the user's `message`.
//     // 2. The `retrievalChain`'s `retriever` uses the message to perform a semantic search on `vectorStore`.
//     // 3. The `retrievalChain` takes the retrieved documents and passes them to the `documentChain`.
//     // 4. The `documentChain` creates the final, augmented prompt and sends it to the `chatModel`.
//     // 5. The `chatModel` generates a response based on the prompt.
//     const result = await retrievalChain.invoke({ input: message });

//     res.json({ reply: result.answer }); // Sends the final AI answer back.

//   } catch (err) {
//     // ... error handling ...
//   }
// });

// const PORT = process.env.PORT || 6000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// import express from "express"; 
// import cors from "cors"; 
// import dotenv from "dotenv"; 
// import { GoogleGenerativeAI } from "@google/generative-ai"; 
// import multer from "multer"; 
// import fs from "fs"; 
// // These imports are for the new RAG (Retrieval-Augmented Generation) system.
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"; 
// import { Document } from "@langchain/core/documents"; 
// import { createRetrievalChain } from "langchain/chains/retrieval"; 
// import { createStuffDocumentsChain } from "langchain/chains/combine_documents"; 
// import { ChatPromptTemplate } from "@langchain/core/prompts"; 
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; 
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; 
// import { MemoryVectorStore } from "langchain/vectorstores/memory"; 

// dotenv.config(); 
// const app = express(); 
// app.use(cors()); 
// app.use(express.json()); 

// const upload = multer({ dest: "uploads/" }); 
// // These are global variables that persist for the life of the server process.
// // `vectorStore` will hold the processed resume data. It's `null` initially.
// let vectorStore = null; 
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // The standard Gemini client for the initial feedback.
// const chatModel = new ChatGoogleGenerativeAI({
//   model: "gemini-1.5-flash",
//   apiKey: process.env.GEMINI_API_KEY,
// }); 
// const embeddings = new GoogleGenerativeAIEmbeddings(); // This client is used to create numerical vectors from text.

// // ---------- The File Upload and Ingestion Endpoint ----------
// // This endpoint handles both the initial file upload and the first-time setup of the RAG system.
// app.post("/api/upload-resume", upload.single("file"), async (req, res) => {
//   try {
//     let resumeText = ""; 

//     // This is the "document loading" part of the RAG pipeline.
//     if (req.file.mimetype === "application/pdf") {
//       const PDFParser = (await import("pdf2json")).default;
//       const pdfParser = new PDFParser();
//       // ... code to extract text from PDF ...
//     } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
//       const mammoth = await import("mammoth");
//       const result = await mammoth.extractRawText({ path: req.file.path });
//       resumeText = result.value;
//     } else {
//       return res.status(400).json({ error: "Unsupported file type" }); // Returns an error if the file type is not supported.
//     }

//     // This section is the core of the RAG system's **ingestion** process.
//     const resumeDocument = new Document({ pageContent: resumeText }); // Wraps the extracted text in a `Document` object for LangChain.
//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 }); // Initializes the text splitter. A `chunkSize` of 1000 means it aims to create chunks of ~1000 characters. `chunkOverlap` of 200 means each chunk will share 200 characters with the previous one, helping to maintain context.
//     const docs = await textSplitter.splitDocuments([resumeDocument]); // Splits the single resume document into multiple smaller documents (chunks).
    
//     // This is the **vectorization** step.
//     // The `fromDocuments` method sends each text chunk to the `embeddings` model,
//     // which converts it into a numerical vector.
//     // These vectors and their original text are then stored in the `vectorStore`.
//     vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

//     // This section generates the **initial feedback**. It's separate from the RAG chat.
//     const initialPrompt = `...`; // A detailed prompt to get the structured JSON output.
//     const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(initialPrompt);
//     let textResponse = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim(); // Cleans up the AI's response to ensure it's valid JSON.

//     let feedback;
//     try {
//       feedback = JSON.parse(textResponse); // Parses the AI's response into a JSON object.
//     } catch (e) {
//       // ... error handling for invalid JSON ...
//     }

//     res.json({ feedback }); // Sends the structured feedback back to the frontend.

//   } catch (err) {
//     // ... general error handling ...
//   } finally {
//     if (req.file) {
//       fs.unlinkSync(req.file.path); // Deletes the temporary file to prevent server storage from filling up.
//     }
//   }
// });

// // ---------- The Conversational Endpoint ----------
// // This endpoint is where the **querying** part of the RAG system happens.
// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message } = req.body; // Extracts the user's chat message.

//     if (!vectorStore) {
//       return res.status(400).json({ error: "Please upload your resume first." }); // Ensures a resume has been ingested before allowing a chat.
//     }

//     // This is the core of the RAG query chain.
//     const prompt = ChatPromptTemplate.fromTemplate(`
//       ...
//       Context: {context} // This is a placeholder for the retrieved resume chunks.
//       Question: {input} // This is a placeholder for the user's question.
//     `); // Defines the prompt template that the chain will use.

//     // This line creates a chain that will take retrieved documents and "stuff" them into the {context} placeholder of the prompt.
//     const documentChain = await createStuffDocumentsChain({ llm: chatModel, prompt });

//     // The retriever is a LangChain tool that performs the semantic search on the vector store.
//     const retrievalChain = await createRetrievalChain({ combineDocsChain: documentChain, retriever: vectorStore.asRetriever() });

//     // This is the final step. `invoke` runs the entire RAG pipeline:
//     // 1. Takes the user's `message`.
//     // 2. The `retrievalChain`'s `retriever` uses the message to perform a semantic search on `vectorStore`.
//     // 3. The `retrievalChain` takes the retrieved documents and passes them to the `documentChain`.
//     // 4. The `documentChain` creates the final, augmented prompt and sends it to the `chatModel`.
//     // 5. The `chatModel` generates a response based on the prompt.
//     const result = await retrievalChain.invoke({ input: message });

//     res.json({ reply: result.answer }); // Sends the final AI answer back.

//   } catch (err) {
//     // ... error handling ...
//   }
// });

// const PORT = process.env.PORT || 6000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

// import express from "express"; 
// import cors from "cors"; 
// import dotenv from "dotenv"; 
// import { GoogleGenerativeAI } from "@google/generative-ai"; 
// import multer from "multer"; 
// import fs from "fs"; 
// // These imports are for the new RAG (Retrieval-Augmented Generation) system.
// import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"; 
// import { Document } from "@langchain/core/documents"; 
// import { createRetrievalChain } from "langchain/chains/retrieval"; 
// import { createStuffDocumentsChain } from "langchain/chains/combine_documents"; 
// import { ChatPromptTemplate } from "@langchain/core/prompts"; 
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai"; 
// import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai"; 
// import { MemoryVectorStore } from "langchain/vectorstores/memory"; 

// dotenv.config(); 
// const app = express(); 
// app.use(cors()); 
// app.use(express.json()); 

// const upload = multer({ dest: "uploads/" }); 
// // These are global variables that persist for the life of the server process.
// // `vectorStore` will hold the processed resume data. It's `null` initially.
// let vectorStore = null; 
// const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); // The standard Gemini client for the initial feedback.
// const chatModel = new ChatGoogleGenerativeAI({
//   model: "gemini-1.5-flash",
//   apiKey: process.env.GEMINI_API_KEY,
// }); 
// const embeddings = new GoogleGenerativeAIEmbeddings(); // This client is used to create numerical vectors from text.

// // ---------- The File Upload and Ingestion Endpoint ----------
// // This endpoint handles both the initial file upload and the first-time setup of the RAG system.
// app.post("/api/upload-resume", upload.single("file"), async (req, res) => {
//   try {
//     let resumeText = ""; 

//     // This is the "document loading" part of the RAG pipeline.
//     if (req.file.mimetype === "application/pdf") {
//       const PDFParser = (await import("pdf2json")).default;
//       const pdfParser = new PDFParser();
//       // ... code to extract text from PDF ...
//     } else if (req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
//       const mammoth = await import("mammoth");
//       const result = await mammoth.extractRawText({ path: req.file.path });
//       resumeText = result.value;
//     } else {
//       return res.status(400).json({ error: "Unsupported file type" }); // Returns an error if the file type is not supported.
//     }

//     // This section is the core of the RAG system's **ingestion** process.
//     const resumeDocument = new Document({ pageContent: resumeText }); // Wraps the extracted text in a `Document` object for LangChain.
//     const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 }); // Initializes the text splitter. A `chunkSize` of 1000 means it aims to create chunks of ~1000 characters. `chunkOverlap` of 200 means each chunk will share 200 characters with the previous one, helping to maintain context.
//     const docs = await textSplitter.splitDocuments([resumeDocument]); // Splits the single resume document into multiple smaller documents (chunks).
    
//     // This is the **vectorization** step.
//     // The `fromDocuments` method sends each text chunk to the `embeddings` model,
//     // which converts it into a numerical vector.
//     // These vectors and their original text are then stored in the `vectorStore`.
//     vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

//     // This section generates the **initial feedback**. It's separate from the RAG chat.
//     const initialPrompt = `...`; // A detailed prompt to get the structured JSON output.
//     const result = await genAI.getGenerativeModel({ model: "gemini-1.5-flash" }).generateContent(initialPrompt);
//     let textResponse = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim(); // Cleans up the AI's response to ensure it's valid JSON.

//     let feedback;
//     try {
//       feedback = JSON.parse(textResponse); // Parses the AI's response into a JSON object.
//     } catch (e) {
//       // ... error handling for invalid JSON ...
//     }

//     res.json({ feedback }); // Sends the structured feedback back to the frontend.

//   } catch (err) {
//     // ... general error handling ...
//   } finally {
//     if (req.file) {
//       fs.unlinkSync(req.file.path); // Deletes the temporary file to prevent server storage from filling up.
//     }
//   }
// });

// // ---------- The Conversational Endpoint ----------
// // This endpoint is where the **querying** part of the RAG system happens.
// app.post("/api/chat", async (req, res) => {
//   try {
//     const { message } = req.body; // Extracts the user's chat message.

//     if (!vectorStore) {
//       return res.status(400).json({ error: "Please upload your resume first." }); // Ensures a resume has been ingested before allowing a chat.
//     }

//     // This is the core of the RAG query chain.
//     const prompt = ChatPromptTemplate.fromTemplate(`
//       ...
//       Context: {context} // This is a placeholder for the retrieved resume chunks.
//       Question: {input} // This is a placeholder for the user's question.
//     `); // Defines the prompt template that the chain will use.

//     // This line creates a chain that will take retrieved documents and "stuff" them into the {context} placeholder of the prompt.
//     const documentChain = await createStuffDocumentsChain({ llm: chatModel, prompt });

//     // The retriever is a LangChain tool that performs the semantic search on the vector store.
//     const retrievalChain = await createRetrievalChain({ combineDocsChain: documentChain, retriever: vectorStore.asRetriever() });

//     // This is the final step. `invoke` runs the entire RAG pipeline:
//     // 1. Takes the user's `message`.
//     // 2. The `retrievalChain`'s `retriever` uses the message to perform a semantic search on `vectorStore`.
//     // 3. The `retrievalChain` takes the retrieved documents and passes them to the `documentChain`.
//     // 4. The `documentChain` creates the final, augmented prompt and sends it to the `chatModel`.
//     // 5. The `chatModel` generates a response based on the prompt.
//     const result = await retrievalChain.invoke({ input: message });

//     res.json({ reply: result.answer }); // Sends the final AI answer back.

//   } catch (err) {
//     // ... error handling ...
//   }
// });

// const PORT = process.env.PORT || 6000;
// app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));