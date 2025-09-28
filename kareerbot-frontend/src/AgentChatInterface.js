import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AgentPage.css';
import sendIcon from './send.png';

const AGENT_WELCOME = {
  text: "Hello! I am your AI Agent. I can help you with career plans, business ideas, and more. Feel free to ask me anything. For example, 'Find the latest trends in AI.'",
  sender: "bot",
};

export default function AgentChatInterface({ persona, setPersona, initialHistory = [AGENT_WELCOME] }) {
    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState(initialHistory);
    const chatEndRef = useRef(null);

    // Effect to handle scrolling to the bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory]);


    const handleChatSubmit = async (e) => {
        e.preventDefault();
        if (!chatInput.trim() || loading) return;
        
        const userMessage = chatInput;
        setChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
        setChatInput('');
        setLoading(true);

        try {
            // The persona is passed from the parent component (Dashboard)
            const chatHistoryPayload = chatHistory.map(msg => ({ sender: msg.sender, text: msg.text }));
            const res = await axios.post("http://localhost:5000/api/agent-query", { 
                query: userMessage,
                chat_history: chatHistoryPayload,
                persona: persona 
            });
            const botReply = res.data.reply;
            setChatHistory(prev => [...prev, { sender: 'bot', text: botReply }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { sender: 'bot', text: '❌ An error occurred. Please try again later.' }]);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="agent-messages-container">
                <div className="agent-persona-selector">
                    <label htmlFor="persona-select">Select Agent Persona:</label>
                    <select id="persona-select" value={persona} onChange={(e) => setPersona(e.target.value)}>
                        <option value="a professional career coach">Career Coach</option>
                        <option value="a creative writing expert">Creative Writing Expert</option>
                        <option value="a business strategist">Business Strategist</option>
                        <option value="a technical architect">Technical Architect</option>
                    </select>
                </div>
                {chatHistory.map((msg, index) => (
                    <div key={index} className={`agent-message ${msg.sender}`}>
                        <div className="agent-message-content">
                            {msg.text}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="agent-message bot">
                        <div className="typing-indicator">
                            <span></span><span></span><span></span>
                        </div>
                    </div>
                )}
                <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChatSubmit} className="agent-input-form">
                <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask your agent a question..."
                    className="agent-input-field"
                    disabled={loading}
                />
                <button type="submit" disabled={loading} className="agent-send-button">
                    <img src={sendIcon} alt="Send" />
                </button>
            </form>
        </>
    );
}