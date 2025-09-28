import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AgentPage.css';
import AgentLandingPage from './AgentLandingPage';
import AgentDashboardHub from './AgentDashboardHub';
import sendIcon from './send.png';

// --- Placeholder Components for Dashboard Tabs ---
const GoalTrackingPage = () => <div className="agent-content-page"><h2>MyGoal/Path</h2><p>This is where the agent will display your full plan flow.</p></div>;
const JobsPage = () => <div className="agent-content-page"><h2>Jobs Dashboard</h2><p>The agent will list recommended jobs and track applications here.</p></div>;
const StatisticsPage = () => <div className="agent-content-page"><h2>Statistics</h2><p>This page will show success prediction and streaks.</p></div>;
const TutorialsPage = () => <div className="agent-content-page"><h2>Tutorials & Resources</h2><p>The agent will curate learning resources for your current step.</p></div>;

const AGENT_WELCOME = {
  text: "Hello! I am your AI Agent. I can help you with career plans, business ideas, and more. Feel free to ask me anything. For example, 'Find the latest trends in AI.'",
  sender: "bot",
};

// --- The Main Agent Page Component ---
export default function AgentPage({ agentPurchased, setAgentPurchased }) {
    // viewState tracks the currently active page: 'landing', 'hub', 'chat', 'myGoal', etc.
    const [viewState, setViewState] = useState(agentPurchased ? 'hub' : 'landing'); 
    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([AGENT_WELCOME]);
    const [persona, setPersona] = useState("a professional career coach");
    const chatEndRef = useRef(null);
    
    // Function to handle returning to the HUB view
    const handleGoToHub = () => {
        setViewState('hub');
    };

    // Effect to scroll the chat
    useEffect(() => {
        if (viewState === 'chat') {
             chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, viewState]);

    const handlePurchase = () => {
        // Simulates payment success and moves to the dashboard hub
        setAgentPurchased(true); 
        setViewState('hub');
        // Reset chat history for the new paid session
        setChatHistory([AGENT_WELCOME]); 
    };

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

    // --- Renderers for the three main UI states ---

    const renderChatInterface = () => (
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

    const renderCurrentView = () => {
        switch (viewState) {
            case 'landing':
                return <AgentLandingPage onPurchase={handlePurchase} />;
            case 'hub':
                // Pass the setViewState function to the hub to enable navigation
                return <AgentDashboardHub setActiveView={setViewState} />;
            case 'chat':
                return renderChatInterface();
            case 'myGoal':
                return <GoalTrackingPage />;
            case 'jobs':
                return <JobsPage />;
            case 'statistics':
                return <StatisticsPage />;
            case 'tutorials':
                return <TutorialsPage />;
            default:
                return renderChatInterface();
        }
    };

    // --- Main Render Block ---
    return (
        <div className="agent-page-container">
            {/* The main dashboard container is only rendered if the view is not the landing page */}
            {viewState !== 'landing' ? (
                <div className="agent-full-dashboard">
                    <div className="agent-dashboard-header">
                        {/* The logic for the back button and returning to the hub */}
                        {viewState !== 'hub' && (
                            <button onClick={handleGoToHub} className="back-to-hub-button">
                                &larr; Back to Dashboard
                            </button>
                        )}
                        <h2 className="dashboard-title">
                             {/* Display the current view name */}
                             {viewState === 'hub' ? 'Your AI Dashboard' : viewState.charAt(0).toUpperCase() + viewState.slice(1).replace(/([A-Z])/g, ' $1').trim()}
                        </h2>
                    </div>
                    <div className="agent-view-content">
                        {renderCurrentView()}
                    </div>
                </div>
            ) : (
                 // Render only the Landing Page if not purchased
                renderCurrentView()
            )}
        </div>
    );
}








// import React, { useState } from 'react';
// import AgentLandingPage from './AgentLandingPage';
// import AgentDashboardHub from './AgentDashboardHub';
// import AgentChatInterface from './AgentChatInterface'; // New component for chat/input
// import './AgentPage.css';

// // Placeholder components (You must create these files if you haven't yet)
// const GoalTrackingPage = () => <div className="agent-content-page"><h2>MyGoal/Path</h2><p>This is where the agent will display your full plan flow.</p></div>;
// const JobsPage = () => <div className="agent-content-page"><h2>Jobs Dashboard</h2><p>The agent will list recommended jobs and track applications here.</p></div>;
// const StatisticsPage = () => <div className="agent-content-page"><h2>Statistics</h2><p>This page will show success prediction and streaks.</p></div>;
// const TutorialsPage = () => <div className="agent-content-page"><h2>Tutorials & Resources</h2><p>The agent will curate learning resources for your current step.</p></div>;

// export default function AgentPage({ agentPurchased, setAgentPurchased }) {
//     // State management for the 3 main views within the purchased agent area
//     const [viewState, setViewState] = useState('hub'); // 'hub', 'chat', 'myGoal', 'jobs', 'statistics', 'tutorials'
    
//     const handlePurchase = () => {
//         // Simulates payment success and moves to the dashboard hub
//         setAgentPurchased(true); 
//         setViewState('hub');
//     };

//     const renderMainContent = () => {
//         switch (viewState) {
//             case 'hub':
//                 // The main interactive bubble grid
//                 return <AgentDashboardHub setActiveView={setViewState} />;
//             case 'chat':
//                 // The main chat window
//                 return <AgentChatInterface setActiveView={setViewState} />; 
//             case 'myGoal':
//                 return <GoalTrackingPage setActiveView={setViewState} />;
//             case 'jobs':
//                 return <JobsPage setActiveView={setViewState} />;
//             case 'statistics':
//                 return <StatisticsPage setActiveView={setViewState} />;
//             case 'tutorials':
//                 return <TutorialsPage setActiveView={setViewState} />;
//             default:
//                 return <AgentDashboardHub setActiveView={setViewState} />;
//         }
//     };

//     return (
//         <div className="agent-page-container">
//             {agentPurchased ? (
//                 // Purchased State: Show Dashboard/Hub
//                 <div className="agent-full-dashboard">
//                     <div className="agent-dashboard-header">
//                         {/* Back button logic */}
//                         {viewState !== 'hub' && (
//                             <button onClick={() => setViewState('hub')} className="back-to-hub-button">
//                                 &larr; Back to Hub
//                             </button>
//                         )}
//                         <h2 className="dashboard-title">
//                             {viewState === 'hub' ? 'Your AI Dashboard' : viewState.charAt(0).toUpperCase() + viewState.slice(1).replace(/([A-Z])/g, ' $1').trim()}
//                         </h2>
//                     </div>
//                     <div className="agent-view-content">
//                         {renderMainContent()}
//                     </div>
//                 </div>
//             ) : (
//                 // Pre-Purchase State: Show Landing Page
//                 <AgentLandingPage onPurchase={handlePurchase} />
//             )}
//         </div>
//     );
// }