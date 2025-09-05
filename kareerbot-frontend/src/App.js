import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import paperclipIcon from './paperclip.png';
import sendIcon from './send.png';
import userIcon from './user.png';

const BOT_WELCOME = {
  text: "Hello! I'm KareerBot, your personal career assistant. You can either type or paste your resume into the box below, or upload a document to get started.",
  sender: "bot",
};

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef(null);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  
  const [chatSessions, setChatSessions] = useState([{
    id: Date.now(),
    title: 'New Chat',
    messages: [BOT_WELCOME]
  }]);
  const [activeChatId, setActiveChatId] = useState(chatSessions[0].id);

  const activeChat = chatSessions.find(chat => chat.id === activeChatId);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChat?.messages.length, isBotTyping, activeChatId]);

  const updateChatState = (userMsg, botMsg) => {
    setChatSessions(prevSessions => prevSessions.map(session =>
      session.id === activeChatId ?
      { ...session, messages: [...session.messages, userMsg, botMsg] } : session
    ));
  };
  
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setSelectedFile(selected);
    }
  };

  const handleUploadOrTextSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    let requestData;
    let headers = {};
    let userMessageText;
    let fileUploadedFlag = false;

    if (file) {
      requestData = new FormData();
      requestData.append('file', file);
      userMessageText = `Uploading: ${file.name}`;
      fileUploadedFlag = true;
    } else if (chatInput.trim()) {
      requestData = { text: chatInput };
      headers = { 'Content-Type': 'application/json' };
      userMessageText = chatInput;
    } else {
      return;
    }
    
    setChatInput('');
    setSelectedFile(null);
    setFile(null);

    const initialChatTitle = userMessageText.length > 20 ? userMessageText.substring(0, 20) + '...' : userMessageText;
    setChatSessions(prevSessions => prevSessions.map(session => 
      session.id === activeChatId ? 
      { ...session, title: initialChatTitle, messages: [...session.messages, { sender: 'user', text: userMessageText }] } : session
    ));
    
    setLoading(true);
    setIsBotTyping(true);

    try {
      const res = await axios.post("http://localhost:5000/api/process-resume", requestData, { headers });

      const feedback = res.data.feedback;
      let initialMessage = "✅ Resume successfully analyzed! Here is some initial feedback:\n\n";
      initialMessage += "💪 **Strengths:**\n" + feedback.strengths.map(s => `- ${s}`).join('\n');
      initialMessage += "\n\n⚡ **Areas for Improvement:**\n" + feedback.improvements.map(i => `- ${i}`).join('\n');
      initialMessage += "\n\nFeel free to ask me follow-up questions, like 'How can I improve my work experience section?'";
      
      setChatSessions(prevSessions => prevSessions.map(session =>
        session.id === activeChatId ?
        { ...session, messages: [...session.messages, { sender: 'bot', text: initialMessage }] } : session
      ));
      
      setFile(null);
    } catch (err) {
      setChatSessions(prevSessions => prevSessions.map(session =>
        session.id === activeChatId ?
        { ...session, messages: [...session.messages, { sender: 'bot', text: '❌ Error analyzing your resume. Please try again.' }] } : session
      ));
      console.error(err);
    } finally {
      setLoading(false);
      setIsBotTyping(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMessageText = chatInput;
    
    const isFirstMessage = activeChat.messages.length <= 1;

    setChatSessions(prevSessions => prevSessions.map(session =>
      session.id === activeChatId ?
      { ...session, messages: [...session.messages, { sender: 'user', text: userMessageText }] } : session
    ));
    setChatInput('');
    
    if (isFirstMessage) {
        setLoading(true);
        setIsBotTyping(true);
        const botReply = "Hello! I'm your resume assistant. I can help you improve your resume. Please send me your resume text or upload a file to get started.";
        
        // This is a temporary way to handle the title for a new chat
        const initialChatTitle = userMessageText.length > 20 ? userMessageText.substring(0, 20) + '...' : userMessageText;

        setChatSessions(prevSessions => prevSessions.map(session => 
          session.id === activeChatId ? 
          { ...session, title: initialChatTitle, messages: [...session.messages, { sender: 'bot', text: botReply }] } : session
        ));

        setLoading(false);
        setIsBotTyping(false);
        return;
    }

    setLoading(true);
    setIsBotTyping(true);

    try {
      const res = await axios.post("http://localhost:5000/api/chat", { message: userMessageText });
      const botReply = res.data.reply;
      
      setChatSessions(prevSessions => prevSessions.map(session =>
        session.id === activeChatId ?
        { ...session, messages: [...session.messages, { sender: 'bot', text: botReply }] } : session
      ));

    } catch (err) {
      setChatSessions(prevSessions => prevSessions.map(session =>
        session.id === activeChatId ?
        { ...session, messages: [...session.messages, { sender: 'bot', text: '❌ Error getting a response. Please try again later.' }] } : session
      ));
      console.error(err);
    } finally {
      setLoading(false);
      setIsBotTyping(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleNewChat = () => {
    const newChatId = Date.now();
    const newChatSession = {
      id: newChatId,
      title: 'New Chat',
      messages: [BOT_WELCOME]
    };
    setChatSessions(prevSessions => [newChatSession, ...prevSessions]);
    setActiveChatId(newChatId);
    setSelectedFile(null);
    setFile(null);
    setChatInput('');
    setSidebarOpen(false);
  };
  
  const handleSelectChat = (chatId) => {
    setActiveChatId(chatId);
    setSidebarOpen(false);
  };

  const handlePreviewClick = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  const FilePreviewModal = ({ file, onClose }) => {
    if (!file) return null;
    const isImage = file.type.startsWith('image/');
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={onClose}>&times;</button>
          {isImage ? (
            <img src={URL.createObjectURL(file)} alt="File Preview" className="modal-image" />
          ) : (
            <div className="modal-file-info">
              <img src={paperclipIcon} alt="File Icon" className="file-icon" />
              <p>File Name: {file.name}</p>
              <p>File Type: {file.type}</p>
              <p>File preview not available for this type.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (selectedFile) {
      handleUploadOrTextSubmit(e);
    } else {
      handleChatSubmit(e);
    }
  };

  return (
    <div className="app-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>KareerBot Menu</h3>
          <button className="close-btn" onClick={toggleSidebar}>&times;</button>
        </div>
        <div className="sidebar-search-container">
          <div className="search-bar">
            <span className="material-icons search-icon">search</span>
            <input type="text" placeholder="Search" />
          </div>
        </div>
        <ul className="sidebar-links">
          <li onClick={handleNewChat} className="new-chat-btn">
            <span className="material-icons">add</span>
            New Chat
          </li>
          {chatSessions.map(chat => (
            <li
              key={chat.id}
              className={chat.id === activeChatId ? 'active' : ''}
              onClick={() => handleSelectChat(chat.id)}
            >
              <span className="chat-history-text">{chat.title}</span>
            </li>
          ))}
        </ul>
        <div className="bottom-sidebar-links">
          <ul className="sidebar-links">
            <li><span className="material-icons">settings</span>Settings</li>
            <li><span className="material-icons">help</span>Help</li>
            <li className="profile-item">
              <img src={userIcon} alt="Profile" className="profile-icon" />
              <span className="profile-name">Kishan B M</span>
            </li>
          </ul>
        </div>
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
          {activeChat?.messages.map((msg, index) => (
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

        <form onSubmit={handleFormSubmit} className="chat-input-form">
          {selectedFile && (
            <div className="file-preview-pill" onClick={handlePreviewClick}>
              <span className="material-icons">description</span>
              <p>{selectedFile.name}</p>
              <button onClick={() => setSelectedFile(null)} className="remove-file-btn">&times;</button>
            </div>
          )}
          <div className="input-field-container">
            <label className="file-upload-label left-attach">
              <img src={paperclipIcon} alt="Attach File" />
              <input type="file" accept=".pdf,.docx,.txt,.jpg,.jpeg,.png" onChange={handleFileChange} />
            </label>
            <textarea
              className="chat-input-field"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={activeChat?.messages.length > 1 ? "Type your question here..." : "Paste your resume or type here..."}
              disabled={loading}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleFormSubmit(e);
                }
              }}
            />
            <button type="submit" className="send-btn" disabled={loading}>
              <img src={sendIcon} alt="Send" />
            </button>
          </div>
        </form>
      </div>
      {showPreview && <FilePreviewModal file={selectedFile} onClose={closePreview} />}
    </div>
  );
}