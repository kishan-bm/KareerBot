import os
import json
import re
import shutil
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
from langchain_community.vectorstores import Chroma
from langchain_core.prompts import MessagesPlaceholder
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import PromptTemplate

# File parsing imports
import pypdf
from docx import Document as DocxDocument


load_dotenv()
app = Flask(__name__)
CORS(app)

vector_store = None
genai_api_key = os.getenv("GEMINI_API_KEY")

# Agent Setup
tavily_api_key = os.getenv("TAVILY_API_KEY")
search = TavilySearchResults(api_key=tavily_api_key)
tools = [search]

chat_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=genai_api_key)
embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=genai_api_key)

# This is the corrected prompt for the tool-calling agent.
# The system message is where you define the persona.
# The `MessagesPlaceholder` for chat history and scratchpad are crucial.
# Dynamic persona-aware system template
system_template = """You are an AI assistant. Your persona is a {persona}.
- If a user asks for real-time, factual, or current information (like stock prices, weather, news, etc.), you MUST use the TavilySearchResults tool.
- Do not say you don’t have access to real-time data.
- Only use your own reasoning for general knowledge or career coaching questions.
"""

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", system_template),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ]
)


# Create a tool-calling agent.
agent = create_tool_calling_agent(chat_model, tools, prompt)

# Create an agent executor to run the agent.
# The verbose=True option helps with debugging by showing the agent's thought process.
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

CHROMA_DB_PATH = "./chroma_db"

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

@app.route("/api/process-resume", methods=["POST"])
def process_resume():
    global vector_store

    # This is the fix for the PermissionError on Windows.
    # We close the existing vector store connection before deleting the folder.
    if vector_store:
        try:
            vector_store.delete_collection()
            vector_store = None
        except Exception as e:
            print(f"Error deleting Chroma collection: {e}")
            pass
    
    if os.path.exists(CHROMA_DB_PATH):
        try:
            shutil.rmtree(CHROMA_DB_PATH)
            print("Old vector store deleted. Creating a new one.")
        except Exception as e:
            print(f"Error deleting old vector store directory: {e}")
            return jsonify({"error": f"Error deleting old vector store directory: {str(e)}"}), 500
    
    resume_text = ""
    
    if 'file' in request.files and request.files['file'].filename != '':
        file = request.files['file']
        try:
            if file.mimetype == "application/pdf":
                resume_text = get_pdf_text(file)
            elif file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                resume_text = get_docx_text(file)
            else:
                return jsonify({"error": "Unsupported file type"}), 400
        except Exception as e:
            return jsonify({"error": f"Error processing file: {str(e)}"}), 500
    
    elif request.json and 'text' in request.json:
        resume_text = request.json.get('text')
    
    if not resume_text:
        return jsonify({"error": "No resume file or text provided."}), 400

    try:
        docs = [Document(page_content=resume_text)]
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(docs)

        vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=CHROMA_DB_PATH
        )
        vector_store.persist()

        initial_prompt = f"""
            You are an experienced HR recruiter and career coach.
            Review the following resume text and provide feedback.
            Instructions:
            - Identify exactly 3 key strengths (skills, experiences, or achievements).
            - Identify exactly 3 areas for improvement (clarity, formatting, missing skills, etc).
            - Be concise and use simple language that a fresher can understand.
            - You MUST ONLY respond with a valid JSON object. Do not include any other text, greetings, or explanations.
            Output format:
            {{
                "strengths": ["point 1", "point 2", "point 3"],
                "improvements": ["point 1", "point 2", "point 3"]
            }}
            Resume:
            {resume_text}
        """
        response = chat_model.invoke(initial_prompt).content
        
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            json_string = json_match.group(0)
            feedback = json.loads(json_string)
        else:
            raise ValueError("Could not find a valid JSON object in the AI's response.")
            
        return jsonify({"feedback": feedback})
        
    except Exception as e:
        print(f"Error in process_resume: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/chat", methods=["POST"])
def chat():
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
            You are a helpful and professional resume assistant and career coach.
            Answer the user's question. If the question is about the provided resume, use the context.
            If the question is a general career or skill question, use your broader knowledge.
            
            Context:
            {context}
            
            Question: {input}
        """)

        document_chain = create_stuff_documents_chain(llm=chat_model, prompt=prompt_template)
        retrieval_chain = create_retrieval_chain(retriever=vector_store.as_retriever(), combine_docs_chain=document_chain)
        result = retrieval_chain.invoke({"input": message})
        return jsonify({"reply": result['answer']})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- ENDPOINT 3: Agent Goal Planning (ENHANCED) ---
@app.route("/api/agent-plan", methods=["POST"])
def agent_plan():
    data = request.json
    goal = data.get("goal")
    
    if not goal:
        return jsonify({"error": "Goal is required"}), 400

    try:
        agent_prompt = f"""
            You are an expert AI agent that helps users create a DETAILED, actionable career plan.
            
            Instructions:
            - Take the user's goal and break it down into exactly 5 clear, sequential steps (Phase 1, Phase 2, etc.).
            - For each step, identify exactly 3 core skills/technologies/knowledge points required for completion.
            - Provide a brief, one-sentence description for each step.
            - You MUST ONLY respond with a valid JSON object. Do not include any other text.
            
            Output format (STRICT JSON):
            {{
                "goal": "{goal}",
                "plan": [
                    {{
                        "step": "Phase 1: Foundation", 
                        "description": "Master core skills and tools.",
                        "skills_required": ["Skill 1", "Skill 2", "Skill 3"]
                    }},
                    {{
                        "step": "Phase 2: Project Building", 
                        "description": "Develop a complex, deployable portfolio project.",
                        "skills_required": ["Skill 4", "Skill 5", "Skill 6"]
                    }},
                    // ... continue for 5 steps ...
                ]
            }}

            User's Goal: {goal}
        """

        response = chat_model.invoke(agent_prompt).content
        
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            plan = json.loads(json_match.group(0))
        else:
            raise ValueError("Could not find a valid JSON object in the AI's response.")
        
        return jsonify({"plan": plan})
    
    except Exception as e:
        print(f"Error in agent_plan: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/api/agent-query", methods=["POST"])
def agent_query():
    data = request.json
    query = data.get("query")
    chat_history = data.get("chat_history", [])
    persona = data.get("persona", "a professional career coach")

    if not query:
        return jsonify({"error": "Query is required"}), 400

    try:
        # 🔹 Convert chat history to LangChain-style messages
        history_messages = []
        for msg in chat_history:
            if msg["sender"] == "user":
                history_messages.append(("human", msg["text"]))
            else:
                history_messages.append(("ai", msg["text"]))

        response = agent_executor.invoke({
            "input": query,
            "chat_history": history_messages,
            "persona": persona
        })
        return jsonify({"reply": response.get("output", "No response generated.")})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

        
if __name__ == '__main__':
    if not os.path.exists(CHROMA_DB_PATH):
        os.makedirs(CHROMA_DB_PATH)
    app.run(port=5000, debug=True)


# import os
# import json
# import re
# import shutil # New import for deleting the folder
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from dotenv import load_dotenv
# from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain.docstore.document import Document
# from langchain.chains import create_retrieval_chain
# from langchain.chains.combine_documents.stuff import create_stuff_documents_chain
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_community.vectorstores import Chroma
# import pypdf
# from docx import Document as DocxDocument
# from langchain_chroma import Chroma



# load_dotenv()
# app = Flask(__name__)
# CORS(app)

# vector_store = None
# genai_api_key = os.getenv("GEMINI_API_KEY")

# chat_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=genai_api_key)
# embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=genai_api_key)

# CHROMA_DB_PATH = "./chroma_db"

# def get_pdf_text(pdf_file):
#     reader = pypdf.PdfReader(pdf_file)
#     text = ""
#     for page in reader.pages:
#         text += page.extract_text()
#     return text

# def get_docx_text(docx_file):
#     doc = DocxDocument(docx_file)
#     text = ""
#     for para in doc.paragraphs:
#         text += para.text + "\n"
#     return text

# @app.route("/api/process-resume", methods=["POST"])
# def process_resume():
#     global vector_store

#     # --- FIX 1: Delete old vector store before creating a new one ---
#     if os.path.exists(CHROMA_DB_PATH):
#         shutil.rmtree(CHROMA_DB_PATH)
#         print("Old vector store deleted. Creating a new one.")
    
#     resume_text = ""
#     if 'file' in request.files and request.files['file'].filename != '':
#         file = request.files['file']
#         try:
#             if file.mimetype == "application/pdf":
#                 resume_text = get_pdf_text(file)
#             elif file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
#                 resume_text = get_docx_text(file)
#             else:
#                 return jsonify({"error": "Unsupported file type"}), 400
#         except Exception as e:
#             return jsonify({"error": f"Error processing file: {str(e)}"}), 500
    
#     elif request.json and 'text' in request.json:
#         resume_text = request.json.get('text')
    
#     if not resume_text:
#         return jsonify({"error": "No resume file or text provided."}), 400

#     try:
#         docs = [Document(page_content=resume_text)]
#         text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
#         chunks = text_splitter.split_documents(docs)

#         vector_store = Chroma.from_documents(
#             documents=chunks,
#             embedding=embeddings,
#             persist_directory=CHROMA_DB_PATH
#         )
#         vector_store.persist()

#         initial_prompt = f"""
#             You are an experienced HR recruiter and career coach.
#             Review the following resume text and provide feedback.
#             Instructions:
#             - Identify exactly 3 key strengths (skills, experiences, or achievements).
#             - Identify exactly 3 areas for improvement (clarity, formatting, missing skills, etc).
#             - Be concise and use simple language that a fresher can understand.
#             - You MUST ONLY respond with a valid JSON object. Do not include any other text, greetings, or explanations.
#             Output format:
#             {{
#                 "strengths": ["point 1", "point 2", "point 3"],
#                 "improvements": ["point 1", "point 2", "point 3"]
#             }}
#             Resume:
#             {resume_text}
#         """
#         response = chat_model.invoke(initial_prompt).content
        
#         json_match = re.search(r'\{.*\}', response, re.DOTALL)
#         if json_match:
#             json_string = json_match.group(0)
#             feedback = json.loads(json_string)
#         else:
#             raise ValueError("Could not find a valid JSON object in the AI's response.")
            
#         return jsonify({"feedback": feedback})
        
#     except Exception as e:
#         print(f"Error in process_resume: {e}")
#         return jsonify({"error": str(e)}), 500

# @app.route("/api/chat", methods=["POST"])
# def chat():
#     global vector_store
#     if vector_store is None:
#         try:
#             vector_store = Chroma(
#                 persist_directory=CHROMA_DB_PATH,
#                 embedding_function=embeddings
#             )
#         except Exception:
#             return jsonify({"error": "Please upload your resume first."}), 400

#     data = request.json
#     message = data.get("message")
#     if not message:
#         return jsonify({"error": "Message is required"}), 400

#     try:
#         # --- FIX 2: Relaxing the prompt for general questions ---
#         prompt_template = ChatPromptTemplate.from_template("""
#             You are a helpful and professional resume assistant and career coach.
#             Answer the user's question. If the question is about the provided resume, use the context.
#             If the question is a general career or skill question, use your broader knowledge.
            
#             Context:
#             {context}
            
#             Question: {input}
#         """)

#         document_chain = create_stuff_documents_chain(llm=chat_model, prompt=prompt_template)
#         retrieval_chain = create_retrieval_chain(retriever=vector_store.as_retriever(), combine_docs_chain=document_chain)
#         result = retrieval_chain.invoke({"input": message})
#         return jsonify({"reply": result['answer']})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

# if __name__ == '__main__':
#     if not os.path.exists(CHROMA_DB_PATH):
#         os.makedirs(CHROMA_DB_PATH)
#     app.run(port=5000, debug=True)

# import os
# import json
# import re
# from flask import Flask, request, jsonify
# from flask_cors import CORS
# from dotenv import load_dotenv

# # LangChain and Gemini Imports
# from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
# from langchain.text_splitter import RecursiveCharacterTextSplitter
# from langchain.docstore.document import Document
# from langchain.chains import create_retrieval_chain
# from langchain.chains.combine_documents.stuff import create_stuff_documents_chain
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_community.vectorstores import Chroma

# from langchain.agents import AgentExecutor, create_tool_calling_agent
# from langchain_core.tools import tool
# from langchain_community.tools.tavily_search import TavilySearchResults
# from langchain_core.prompts import MessagesPlaceholder

# # File parsing imports
# import pypdf
# from docx import Document as DocxDocument

# load_dotenv()
# app = Flask(__name__)
# CORS(app)

# vector_store = None
# genai_api_key = os.getenv("GEMINI_API_KEY")

# chat_model = ChatGoogleGenerativeAI(model="gemini-1.5-flash", google_api_key=genai_api_key)
# embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=genai_api_key)

# # Tavily Search Tool Setup
# tavily_api_key = os.getenv("TAVILY_API_KEY")
# search = TavilySearchResults(api_key=tavily_api_key)
# tools = [search]

# # Prompt for the tool-calling agent
# agent_prompt = ChatPromptTemplate.from_messages(
#     [
#         ("system", "You are a helpful AI assistant that can use tools."),
#         ("human", "{input}"),
#         MessagesPlaceholder(variable_name="agent_scratchpad"),
#     ]
# )

# # Create a tool-calling agent
# agent = create_tool_calling_agent(chat_model, tools, agent_prompt)
# agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# CHROMA_DB_PATH = "./chroma_db"

# def get_pdf_text(pdf_file):
#     reader = pypdf.PdfReader(pdf_file)
#     text = ""
#     for page in reader.pages:
#         text += page.extract_text()
#     return text

# def get_docx_text(docx_file):
#     doc = DocxDocument(docx_file)
#     text = ""
#     for para in doc.paragraphs:
#         text += para.text + "\n"
#     return text

# @app.route("/api/process-resume", methods=["POST"])
# def process_resume():
#     global vector_store

#     resume_text = ""
#     if 'file' in request.files and request.files['file'].filename != '':
#         file = request.files['file']
#         try:
#             if file.mimetype == "application/pdf":
#                 resume_text = get_pdf_text(file)
#             elif file.mimetype == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
#                 resume_text = get_docx_text(file)
#             else:
#                 return jsonify({"error": "Unsupported file type"}), 400
#         except Exception as e:
#             return jsonify({"error": f"Error processing file: {str(e)}"}), 500
    
#     elif request.json and 'text' in request.json:
#         resume_text = request.json.get('text')
    
#     if not resume_text:
#         return jsonify({"error": "No resume file or text provided."}), 400

#     try:
#         docs = [Document(page_content=resume_text)]
#         text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
#         chunks = text_splitter.split_documents(docs)

#         # New: Check if the vector store exists. If so, clear it.
#         if vector_store is not None:
#             vector_store.delete_collection()
#             print("Existing vector store cleared. Adding new data.")
#         else:
#             print("Creating a new vector store.")

#         # Create or update the Chroma vector store
#         vector_store = Chroma.from_documents(
#             documents=chunks,
#             embedding=embeddings,
#             persist_directory=CHROMA_DB_PATH
#         )
#         vector_store.persist()

#         initial_prompt = f"""
#             You are an experienced HR recruiter and career coach.
#             Review the following resume text and provide feedback.
#             Instructions:
#             - Identify exactly 3 key strengths (skills, experiences, or achievements).
#             - Identify exactly 3 areas for improvement (clarity, formatting, missing skills, etc).
#             - Be concise and use simple language that a fresher can understand.
#             - You MUST ONLY respond with a valid JSON object. Do not include any other text, greetings, or explanations.
#             Output format:
#             {{
#                 "strengths": ["point 1", "point 2", "point 3"],
#                 "improvements": ["point 1", "point 2", "point 3"]
#             }}
#             Resume:
#             {resume_text}
#         """
#         response = chat_model.invoke(initial_prompt).content
        
#         json_match = re.search(r'\{.*\}', response, re.DOTALL)
#         if json_match:
#             json_string = json_match.group(0)
#             feedback = json.loads(json_string)
#         else:
#             raise ValueError("Could not find a valid JSON object in the AI's response.")
            
#         return jsonify({"feedback": feedback})
        
#     except Exception as e:
#         print(f"Error in process_resume: {e}")
#         return jsonify({"error": str(e)}), 500

# @app.route("/api/chat", methods=["POST"])
# def chat():
#     global vector_store
#     if vector_store is None:
#         try:
#             vector_store = Chroma(
#                 persist_directory=CHROMA_DB_PATH,
#                 embedding_function=embeddings
#             )
#         except Exception:
#             return jsonify({"error": "Please upload your resume first."}), 400

#     data = request.json
#     message = data.get("message")
#     if not message:
#         return jsonify({"error": "Message is required"}), 400

#     try:
#         prompt_template = ChatPromptTemplate.from_template("""
#             You are a helpful and professional resume assistant and career coach.
#             Answer the user's question. If the question is about the provided resume, use the context.
#             If the question is a general career or skill question, use your broader knowledge.
            
#             Context:
#             {context}
            
#             Question: {input}
#         """)

#         document_chain = create_stuff_documents_chain(llm=chat_model, prompt=prompt_template)
#         retrieval_chain = create_retrieval_chain(retriever=vector_store.as_retriever(), combine_docs_chain=document_chain)
#         result = retrieval_chain.invoke({"input": message})
#         return jsonify({"reply": result['answer']})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

        
        
# #---Agent Planning Endpoint---
 
# @app.route("/api/agent-plan", methods=["POST"])
# def agent_plan():
#     data = request.json
#     goal = data.get("goal")

#     if not goal:
#         return jsonify({"error": "Goal is required"}), 400
#     try:
#         agent_prompt = f"""
#             You are an expert AI agent that helps users create actionable plans to achieve their goals.
            
#             Instructions:
#             - Take the user's goal and break it down into 5 clear, sequential steps.
#             - Provide a brief, one-sentence description for each step.
#             - The tone should be motivating and professional.
#             - You MUST ONLY respond with a valid JSON object. Do not include any other text.
            
#             Output format:
#             {{
#                 "goal": "{goal}",
#                 "plan": [
#                     {{"step": "step 1 title", "description": "brief description"}},
#                     {{"step": "step 2 title", "description": "brief description"}},
#                     {{"step": "step 3 title", "description": "brief description"}},
#                     {{"step": "step 4 title", "description": "brief description"}},
#                     {{"step": "step 5 title", "description": "brief description"}}
#                 ]
#             }}

#             User's Goal: {goal}
#         """

#         response = chat_model.invoke(agent_prompt).content

#         json_match = re.search(r'\{.*\}', response, re.DOTALL)
#         if json_match:
#             json_string = json_match.group(0)
#             plan = json.loads(json_string)
#         else:
#             raise ValueError("Could not find a valid JSON object in the AI's response.")
        
#         return jsonify({"plan": plan})

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# # Agent query endpoint

# @app.route("/api/agent-query", methods=["POST"])
# def agent_query():
#     data = request.json
#     query = data.get("query")

#     if not query:
#         return jsonify({"error": "Query is required"}), 400

#     try:
#         response = agent_executor.invoke({"input": query})
#         return jsonify({"reply": response['output']})
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500
# if __name__ == '__main__':
#     if not os.path.exists(CHROMA_DB_PATH):
#         os.makedirs(CHROMA_DB_PATH)
#     app.run(port=5000, debug=True)