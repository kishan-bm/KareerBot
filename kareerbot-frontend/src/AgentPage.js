import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AgentPage.css';
import AgentLandingPage from './AgentLandingPage';
import sendIcon from './send.png';

const AGENT_WELCOME = {
  text: "Hello! I am your AI Agent. I can help you with career plans, business ideas, and more. Feel free to ask me anything. For example, 'Find the latest trends in AI.'",
  sender: "bot",
};

// Placeholder components for new pages
const GoalTrackingPage = () => <div className="agent-content-page"><h2>Goal Tracking</h2><p>This is where you will visually track your progress towards a goal.</p></div>;
const NotesPage = () => <div className="agent-content-page"><h2>Notes</h2><p>A simple page to keep your thoughts and notes.</p></div>;
const TutorialsPage = () => <div className="agent-content-page"><h2>Tutorials</h2><p>Your AI agent will find the best learning resources for you here.</p></div>;

export default function AgentPage({ agentPurchased, setAgentPurchased }) {
    const [currentTab, setCurrentTab] = useState('chat'); // New state for tabs
    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([AGENT_WELCOME]);
    const [persona, setPersona] = useState("a professional career coach");
    const chatEndRef = useRef(null);

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
    
    const handlePurchase = () => {
      setAgentPurchased(true);
      setChatHistory([AGENT_WELCOME]);
    };

    const renderPage = () => {
        switch (currentTab) {
            case 'chat':
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
            case 'goalTracking':
                return <GoalTrackingPage />;
            case 'notes':
                return <NotesPage />;
            case 'tutorials':
                return <TutorialsPage />;
            default:
                return null;
        }
    };

    return (
        <div className="agent-page-container">
            {agentPurchased ? (
                <>
                    <nav className="agent-tab-nav">
                        <button className={currentTab === 'chat' ? 'active' : ''} onClick={() => setCurrentTab('chat')}>Chat</button>
                        <button className={currentTab === 'goalTracking' ? 'active' : ''} onClick={() => setCurrentTab('goalTracking')}>Goal Tracking</button>
                        <button className={currentTab === 'notes' ? 'active' : ''} onClick={() => setCurrentTab('notes')}>Notes</button>
                        <button className={currentTab === 'tutorials' ? 'active' : ''} onClick={() => setCurrentTab('tutorials')}>Tutorials</button>
                    </nav>
                    {renderPage()}
                </>
            ) : (
                <AgentLandingPage onPurchase={handlePurchase} />
            )}
        </div>
    );

}

const ChatPage = () => {
    // Note: The ChatPage component is not used in the final version of this code.
    // The chat logic is rendered directly in the switch statement above.

    return (
        <div>
            <h2>Chat Page</h2>
            <p>This is the chat page content.</p>
        </div>
    );
};

