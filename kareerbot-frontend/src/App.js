import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';

const BOT_WELCOME = {
  text: "Hello! I'm KareerBot, your personal career assistant. You can either type or paste your resume into the box below, or upload a document to get started.",
  sender: "bot",
};

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([BOT_WELCOME]);
  const [fileUploaded, setFileUploaded] = useState(false);
  const chatEndRef = useRef(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isBotTyping]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    // Optionally, you can trigger the upload immediately after a file is selected
    // or keep the button for explicit user action.
  };

  const handleUploadOrTextSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    let formData = new FormData();
    let userMessage = chatInput;
    
    // Determine if the user is uploading a file or typing/pasting text
    if (file) {
      formData.append('file', file);
      setChatHistory(prev => [...prev, { sender: 'user', text: `Uploading: ${file.name}`}]);
      userMessage = "Analyzing resume...";
    } else if (chatInput.trim()) {
      formData.append('text', chatInput);
      setChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
    } else {
      return;
    }

    setChatInput('');
    setLoading(true);
    setIsBotTyping(true);

    try {
      const endpoint = file ? "http://localhost:5000/api/upload-resume" : "http://localhost:5000/api/analyze-text";
      const res = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const feedback = res.data.feedback;
      let initialMessage = "✅ Resume successfully analyzed! Here is some initial feedback:\n\n";
      
      initialMessage += "💪 **Strengths:**\n" + feedback.strengths.map(s => `- ${s}`).join('\n');
      initialMessage += "\n\n⚡ **Areas for Improvement:**\n" + feedback.improvements.map(i => `- ${i}`).join('\n');
      initialMessage += "\n\nFeel free to ask me follow-up questions, like 'How can I improve my work experience section?'";
      
      setChatHistory(prev => [...prev, { sender: 'bot', text: initialMessage }]);
      setFileUploaded(true);
      setFile(null); // Clear the file state
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'bot', text: '❌ Error analyzing your resume. Please try again.' }]);
      console.error(err);
    } finally {
      setLoading(false);
      setIsBotTyping(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMessage = chatInput;
    setChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setLoading(true);
    setIsBotTyping(true);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", { message: userMessage });
      const botReply = res.data.reply;
      setChatHistory(prev => [...prev, { sender: 'bot', text: botReply }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: 'bot', text: '❌ Error getting a response. Please try again later.' }]);
      console.error(err);
    } finally {
      setLoading(false);
      setIsBotTyping(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="app-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>KareerBot Menu</h3>
          <button className="close-btn" onClick={toggleSidebar}>
            &times;
          </button>
        </div>
        <ul className="sidebar-links">
          <li>Home</li>
          <li>History</li>
          <li>Settings</li>
          <li>About</li>
        </ul>
      </div>

      <div className="chat-window">
        <header className="chat-header">
          <button className="hamburger-menu" onClick={toggleSidebar}>
            <span className="bar"></span>
            <span className="bar"></span>
            <span className="bar"></span>
          </button>
          <div className="header-title">
            <span className="bot-name">KareerBot</span>
          </div>
        </header>

        <div className="messages-container">
          {chatHistory.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.text.split('\n').map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          ))}
          {isBotTyping && (
            <div className="message bot">
              <div className="typing-indicator">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <form onSubmit={fileUploaded ? handleChatSubmit : handleUploadOrTextSubmit} className="chat-input-form">
          <textarea
            className="chat-input-field"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={fileUploaded ? "Type your question here..." : "Paste your resume or type here..."}
            disabled={loading}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                (fileUploaded ? handleChatSubmit : handleUploadOrTextSubmit)(e);
              }
            }}
          />
          {!fileUploaded && (
            <label className="file-upload-label">
              <span className="material-icons">attach_file</span>
              <input type="file" accept=".pdf,.docx,.txt" onChange={handleFileChange} />
            </label>
          )}
          <button type="submit" disabled={loading}>
            <span className="material-icons">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}