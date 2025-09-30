import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AgentPage.css';
import AgentLandingPage from './AgentLandingPage';
import sendIcon from './send.png'; // Assuming you have a send icon
import MyGoalIcon from './mygoal-icon.png'; // Placeholder for icons
import ChatIcon from './chat-icon.png';
import JobsIcon from './jobs-icon.png';
import StatisticsIcon from './statistics-icon.png';
import TutorialsIcon from './tutorials-icon.png';


// --- Placeholder Components for Dashboard Tabs ---
// These will be filled with actual content later, for now they show basic text
const MyGoalPage = ({ resumeText }) => {
    const [goalInput, setGoalInput] = useState('');
    const [currentPlan, setCurrentPlan] = useState(null);
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleGoalSubmit = async (e) => {
        e.preventDefault();
        if (!goalInput.trim()) return;
        if (!resumeText) {
             setError("Please submit your resume first through the main chat interface.");
             return;
        }

        setLoading(true);
        setError(null);
        setPrediction(null); // Clear previous prediction
        setCurrentPlan(null); // Clear previous plan

        try {
            // Step 1: Get Success Prediction
            const predictionRes = await axios.post("http://localhost:5000/api/predict-success", { 
                resumeText: resumeText,
                goal: goalInput 
            });
            setPrediction(predictionRes.data.prediction); 
            
            // Step 2: Generate Plan
            const planRes = await axios.post("http://localhost:5000/api/agent-plan", { goal: goalInput });
            setCurrentPlan(planRes.data.plan); 

        } catch (err) {
            console.error("Goal/Prediction API Error:", err);
            setError("Failed to generate plan or prediction. Check server logs.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="agent-content-page mygoal-page">
            <h2>Your Career Roadmap</h2>
            <p>Define your primary career goal and let your agent build your personalized roadmap.</p>
            
            <form onSubmit={handleGoalSubmit} className="goal-input-section">
                <input
                    type="text"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    placeholder="E.g., Become a Senior Full-Stack Developer"
                    className="goal-input-field"
                    disabled={loading}
                />
                <button type="submit" disabled={loading} className="goal-submit-button">
                    {loading ? 'Analyzing...' : 'Generate Roadmap'}
                </button>
            </form>

            {error && <div className="error-message">{error}</div>}

            {prediction && (
                <div className="prediction-results">
                    <h3>Predicted Success: <span className="success-score-display">{prediction.success_score}%</span></h3>
                    <div className="prediction-bar-container">
                        <div className="prediction-bar-fill" style={{ width: `${prediction.success_score}%` }}></div>
                    </div>
                    <p className="prediction-justification">{prediction.justification}</p>
                </div>
            )}

            {currentPlan && (
                <div className="plan-details-section">
                    <h3>Plan for: {currentPlan.goal}</h3>
                    <div className="plan-steps">
                        {currentPlan.plan.map((item, index) => (
                            <div key={index} className="plan-step-card">
                                <h4>Step {index + 1}: {item.step}</h4>
                                <p>{item.description}</p>
                                <label className="checkbox-container">
                                    <input type="checkbox" className="goal-completion-checkbox" />
                                    <span className="checkmark"></span> Mark as Complete
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const JobsPage = () => (
    <div className="agent-content-page">
        <h2>Job Recommendations</h2>
        <p>Your agent is actively searching for the best job opportunities tailored to your profile.</p>
        {/* Job listings will go here */}
        <div className="job-card-placeholder">
            <p>No new job recommendations yet. Please set your goal in "MyGoal" to activate job matching!</p>
        </div>
    </div>
);
const StatisticsPage = () => (
    <div className="agent-content-page">
        <h2>Your Progress Statistics</h2>
        <p>Track your roadmap completion, learning streaks, and agent's job application activity.</p>
        {/* Graphs and stats will go here */}
        <div className="stat-card-placeholder">
            <p>No statistics available yet. Complete more steps to see your progress!</p>
        </div>
    </div>
);
const TutorialsPage = () => (
    <div className="agent-content-page">
        <h2>Curated Learning Resources</h2>
        <p>Discover the best tutorials, courses, and articles relevant to your next steps.</p>
        {/* Resource cards will go here */}
        <div className="tutorial-card-placeholder">
            <p>No tutorials available. Set your goal and let the agent find relevant resources!</p>
        </div>
    </div>
);


const AGENT_WELCOME = {
  text: "Hello! I am your AI Agent. How can I assist you today?",
  sender: "bot",
};

// --- The Main Agent Page Component ---
export default function AgentPage({ agentPurchased, setAgentPurchased }) {
    // Current active view: 'landing', 'myGoal', 'chat', 'jobs', 'statistics', 'tutorials'
    const [activeView, setActiveView] = useState(agentPurchased ? 'chat' : 'landing'); 
    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([AGENT_WELCOME]);
    const [persona, setPersona] = useState("a professional career coach");
    const [fullResumeText, setFullResumeText] = useState(null); // Stores the full resume text for prediction
    const chatEndRef = useRef(null);
    
    // Scroll to bottom of chat
    useEffect(() => {
        if (activeView === 'chat') {
             chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, activeView]);

    const handlePurchase = () => {
        setAgentPurchased(true); 
        setActiveView('chat'); // Go directly to chat after purchase
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
            // First, check if the message is a resume upload
            let requestData = { query: userMessage, chat_history: chatHistory, persona: persona };
            let endpoint = "http://localhost:5000/api/agent-query";
            let headers = {};

            if (userMessage.toLowerCase().includes("my resume is:") || userMessage.toLowerCase().includes("here is my resume:")) {
                endpoint = "http://localhost:5000/api/process-resume";
                requestData = { text: userMessage.substring(userMessage.indexOf(":") + 1).trim() };
                headers = { 'Content-Type': 'application/json' };
            }
            // Add file upload logic here if you want to support it directly in chat input

            const res = await axios.post(endpoint, requestData, { headers });
            
            let botReply = "";
            if (endpoint === "http://localhost:5000/api/process-resume") {
                const feedback = res.data.feedback;
                setFullResumeText(res.data.full_resume_text); // Save full resume text here
                botReply = `Thanks for your resume! Here's some initial feedback:\n\nStrengths:\n${feedback.strengths.map(s => `- ${s}`).join('\n')}\n\nImprovements:\n${feedback.improvements.map(i => `- ${i}`).join('\n')}\n\nI've stored your resume. How else can I help?`;
            } else {
                botReply = res.data.reply;
            }

            setChatHistory(prev => [...prev, { sender: 'bot', text: botReply }]);
        } catch (err) {
            setChatHistory(prev => [...prev, { sender: 'bot', text: '❌ An error occurred. Please try again later.' }]);
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // --- Renderers for the main content area ---
    const renderContent = () => {
        switch (activeView) {
            case 'myGoal':
                return <MyGoalPage resumeText={fullResumeText} />;
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
            case 'jobs':
                return <JobsPage />;
            case 'statistics':
                return <StatisticsPage />;
            case 'tutorials':
                return <TutorialsPage />;
            default:
                return null; // Should not happen if activeView is properly managed
        }
    };

    // Main Render Block
    if (!agentPurchased || activeView === 'landing') {
        return <AgentLandingPage onPurchase={handlePurchase} />;
    }

    return (
        <div className="ai-dashboard-container">
            <div className="dashboard-sidebar">
                <h1 className="sidebar-logo">Your AI Dashboard</h1>
                <nav className="sidebar-nav">
                    <button 
                        className={`nav-item ${activeView === 'myGoal' ? 'active' : ''}`} 
                        onClick={() => setActiveView('myGoal')}
                    >
                        <img src={MyGoalIcon} alt="My Goal" className="nav-icon" /> MyGoal
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'chat' ? 'active' : ''}`} 
                        onClick={() => setActiveView('chat')}
                    >
                        <img src={ChatIcon} alt="Chat" className="nav-icon" /> Chat
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'jobs' ? 'active' : ''}`} 
                        onClick={() => setActiveView('jobs')}
                    >
                        <img src={JobsIcon} alt="Jobs" className="nav-icon" /> Jobs
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'statistics' ? 'active' : ''}`} 
                        onClick={() => setActiveView('statistics')}
                    >
                        <img src={StatisticsIcon} alt="Statistics" className="nav-icon" /> Statistics
                    </button>
                    <button 
                        className={`nav-item ${activeView === 'tutorials' ? 'active' : ''}`} 
                        onClick={() => setActiveView('tutorials')}
                    >
                        <img src={TutorialsIcon} alt="Tutorials" className="nav-icon" /> Tutorials
                    </button>
                </nav>
                <div className="sidebar-footer">
                    September 30, 2025, 13:25
                </div>
            </div>
            <div className="dashboard-main-content">
                <header className="main-content-header">
                    {/* Placeholder for header elements like notifications/profile */}
                    <div className="header-icons">
                        {/* <img src={NotificationIcon} alt="Notifications" className="header-icon" /> */}
                        {/* <img src={ProfileIcon} alt="Profile" className="header-icon" /> */}
                    </div>
                </header>
                <div className="content-area">
                    {renderContent()}
                </div>
            </div>
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