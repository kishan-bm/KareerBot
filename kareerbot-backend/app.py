import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# LangChain and Gemini Imports
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain.chains import create_retrieval_chain
from langchain.chains.combine_documents.stuff import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_community.vectorstores import Chroma # <-- New ChromaDB import

# File parsing imports
import pypdf
from docx import Document as DocxDocument

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Global state for the session
vector_store = None
genai_api_key = os.getenv("GEMINI_API_KEY")

# Initialize LangChain components
chat_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=genai_api_key)
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=genai_api_key)

# We will use a unique folder for each user's vector store.
# For this example, we will just use a single folder.
# For a real application, you would create a unique folder for each user session.
CHROMA_DB_PATH = "./chroma_db"

# ---------- File Parsing Functions ----------
def get_pdf_text(pdf_file):
    reader = pypdf.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text()
    return text

def get_docx_text(docx_file):
    doc = DocxDocument(docx_file)
    text = ""
    for para in doc.paragraphs:
        text += para.text + "\n"
    return text

# ---------- Ingestion and Initial Feedback Endpoint ----------
@app.route("/api/upload-resume", methods=["POST"])
def upload_resume():
    global vector_store

    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        if file.mimetype == "application/pdf":
            resume_text = get_pdf_text(file)
        elif file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
            resume_text = get_docx_text(file)
        else:
            return jsonify({"error": "Unsupported file type"}), 400

        # Create a document and split it into chunks
        docs = [Document(page_content=resume_text)]
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)

        # Initialize ChromaDB and create a collection
        vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=CHROMA_DB_PATH
        )
        vector_store.persist()

        # Initial feedback generation using LangChain chat model
        initial_prompt = f"""
            You are an experienced HR recruiter and career coach.
            Review the following resume text and provide feedback.
            Instructions:
            - Identify exactly 3 key strengths (skills, experiences, or achievements).
            - Identify exactly 3 areas for improvement (clarity, formatting, missing skills, etc).
            - Be concise and use simple language that a fresher can understand.
            Output format (strict JSON only, no extra text):
            {{
                "strengths": ["point 1", "point 2", "point 3"],
                "improvements": ["point 1", "point 2", "point 3"]
            }}
            Resume:
            {resume_text}
        """
        response = chat_model.invoke(initial_prompt)
        try:
            feedback = json.loads(response.replace('```json', '').replace('```', '').strip())
        except Exception:
            feedback = response
        return jsonify({"feedback": feedback})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------- Conversational Endpoint ----------
@app.route("/api/chat", methods=["POST"])
def chat():
    # If the server restarts, we need to load the persisted DB.
    global vector_store
    if vector_store is None:
        try:
            vector_store = Chroma(
                persist_directory=CHROMA_DB_PATH,
                embedding_function=embeddings
            )
        except Exception:
            return jsonify({"error": "Please upload your resume first."}), 400

    data = request.json
    message = data.get("message")
    if not message:
        return jsonify({"error": "Message is required"}), 400

    try:
        prompt_template = ChatPromptTemplate.from_template("""
            You are a helpful and professional resume assistant. Answer the user's question based only on the provided context. If you can't find the answer, just say that you don't know.
            
            Context:
            {context}
            
            Question: {input}
        """)

        document_chain = create_stuff_documents_chain(llm=chat_model, prompt=prompt_template)
        retrieval_chain = create_retrieval_chain(retriever=vector_store.as_retriever(), combine_docs_chain=document_chain)
        result = retrieval_chain.invoke({"input": message})
        return jsonify({"reply": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Make sure the chroma DB directory exists
    if not os.path.exists(CHROMA_DB_PATH):
        os.makedirs(CHROMA_DB_PATH)
    app.run(port=5000, debug=True)