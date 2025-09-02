# KareerBot

## Project Overview

KareerBot is an AI-powered resume review and feedback platform. It allows users to upload their resume (PDF/DOCX) or paste text, and get instant, actionable feedback. The platform also supports chat-based Q&A about the resume.

---

## Tech Stack

- **Frontend:** React (JavaScript)
- **Backend:**
	- Node.js/Express (fully functional)
	- Python/Flask (migration in progress, experimental)
- **AI:** Google Gemini (Generative AI)
- **Vector DB:** ChromaDB (for Python backend)

---

## Setup Instructions

1. **Clone the repository:**
	 ```bash
	 git clone <repo-url>
	 ```

2. **Install dependencies:**
	 - **Frontend:**
		 ```bash
		 cd kareerbot-frontend
		 npm install
		 ```
	 - **Node.js Backend:**
		 ```bash
		 cd kareerbot-backend
		 npm install
		 ```
	 - **Python Backend:**
		 ```bash
		 cd kareerbot-backend
		 python -m venv venv
		 venv\Scripts\activate
		 pip install -r requirements.txt
		 ```

3. **Start the servers:**
	 - **Frontend:**
		 ```bash
		 cd kareerbot-frontend
		 npm start
		 ```
	 - **Node.js Backend (recommended):**
		 ```bash
		 cd kareerbot-backend
		 npm start
		 # or
		 nodemon index.js
		 ```
	 - **Python Backend (experimental):**
		 ```bash
		 cd kareerbot-backend
		 venv\Scripts\activate
		 flask run
		 # or
		 python app.py
		 ```

---

## Important Notes

- The **Node.js backend is fully working and recommended for production use**.
- The **Python backend is under development**; some features may not work as expected.
- Do **not** commit `venv` or `node_modules` folders to Git. These are excluded in `.gitignore`.
- If switching backend, update the frontend API URLs accordingly.

---

## Features

- Upload resume (PDF/DOCX) or paste text
- Get AI-generated feedback (strengths & improvements)
- Chat-based Q&A about your resume
- Robust error handling and user feedback

---

## What We Did

- Built and tested both Node.js and Python backends for resume review
- Integrated Gemini AI for feedback and chat
- Implemented file upload and text input in frontend
- Cleaned up the repo for GitHub (removed secrets, added `.gitignore`)
- Migrated backend logic to Python/Flask with LangChain (still stabilizing)
- Ensured robust error handling and user feedback in both front and backends

---

## Note
- Currently migrating to Python for advanced AI features, but Node.js is stable and recommended for now

---

## Contact

For any questions, reach out to the mail: kishanbm22@gmail.com.
# KareerBot

