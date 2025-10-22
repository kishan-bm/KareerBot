import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AgentPage.css';

// Import Agent Landing and Payment components
import AgentLandingPage from './AgentLandingPage';
import AgentPaymentPage from './AgentPaymentPage'; // NEW IMPORT

// Import Icons
import sendIcon from './send.png'; 
import MyGoalIcon from './mygoal-icon.png'; 
import ChatIcon from './chat-icon.png';
import JobsIcon from './jobs-icon.png';
import StatisticsIcon from './statistics-icon.png';
import TutorialsIcon from './tutorials-icon.png';
import NotificationIcon from './icons/notification-icon.png'; 
import ProfileIcon from './icons/profile-icon.png';


// --- Placeholder Components for Dashboard Tabs (No changes here) ---
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
        <div className="job-card-placeholder">
            <p>No new job recommendations yet. Please set your goal in "MyGoal" to activate job matching!</p>
        </div>
    </div>
);
const StatisticsPage = () => (
    <div className="agent-content-page">
        <h2>Your Progress Statistics</h2>
        <p>Track your roadmap completion, learning streaks, and agent's job application activity.</p>
        <div className="stat-card-placeholder">
            <p>No statistics available yet. Complete more steps to see your progress!</p>
        </div>
    </div>
);
const TutorialsPage = () => (
    <div className="agent-content-page">
        <h2>Curated Learning Resources</h2>
        <p>Discover the best tutorials, courses, and articles relevant to your next steps.</p>
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
    // State to manage the active tab in the main dashboard
    const [activeView, setActiveView] = useState(agentPurchased ? 'chat' : 'landing'); 
    
    // NEW STATE: Manages the transition to the payment page
    const [showPaymentPage, setShowPaymentPage] = useState(false); 

    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([AGENT_WELCOME]);
    const [persona, setPersona] = useState("a professional career coach");
    const [fullResumeText, setFullResumeText] = useState(null); 
    const chatEndRef = useRef(null);
    const [userGoalPlan, setUserGoalPlan] = useState(null);
    
    // Scroll to bottom of chat
    useEffect(() => {
        if (activeView === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, activeView]);

    // 1. Landing Page -> Payment Page
    const handlePurchaseClick = () => {
        // Move from Landing Page to Payment Page
        setShowPaymentPage(true); 
        setActiveView('landing'); // Keep 'landing' active view name for rendering logic
    };

    // 2. Payment Page -> Main Agent Page (Simulated Success)
    const handleConfirmPayment = (paymentMethod) => {
        console.log(`Payment simulation: Payment confirmed via: ${paymentMethod}`);
        
        // --- TEMPORARY SUCCESS LOGIC ---
        // 1. Set purchased to true
        setAgentPurchased(true); 
        // 2. Hide payment page
        setShowPaymentPage(false); 
        // 3. Navigate to the default active view (chat)
        setActiveView('chat'); 
        // -------------------------------
    };

    // Example Order Details (Passed to the payment page)
    const orderSummary = {
        item: 'Personal AI Agent - Annual Subscription',
        price: '₹9,999.00' 
    };
    const totalDue = '₹9,999.00';


    // Original handlePurchase function (now only used if payment is skipped)
    // We update the landing page's onPurchase prop to call handlePurchaseClick instead.
    // We rename the old one to avoid conflict, though it's now internal logic.
    const handleChatPurchase = () => {
        setAgentPurchased(true); 
        setActiveView('chat'); 
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
            let requestData = { query: userMessage, chat_history: chatHistory, persona: persona };
            let endpoint = "http://localhost:5000/api/agent-query";
            let headers = {};

            if (userMessage.toLowerCase().includes("my resume is:") || userMessage.toLowerCase().includes("here is my resume:")) {
                endpoint = "http://localhost:5000/api/process-resume";
                requestData = { text: userMessage.substring(userMessage.indexOf(":") + 1).trim() };
                headers = { 'Content-Type': 'application/json' };
            }

            const res = await axios.post(endpoint, requestData, { headers });
            
            let botReply = "";
            if (endpoint === "http://localhost:5000/api/process-resume") {
                const feedback = res.data.feedback;
                setFullResumeText(res.data.full_resume_text); 
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
                return null; 
        }
    };

    // --- Main Rendering Logic (State-Dependent) ---

    // VIEW 2: Payment Page (If not purchased BUT 'Buy' was clicked)
    if (showPaymentPage) {
        return (
            <AgentPaymentPage
                orderSummary={orderSummary}
                totalDue={totalDue}
                onConfirmPayment={handleConfirmPayment}
            />
        );
    }
    
    // VIEW 1: Landing Page (If not purchased AND 'Buy' hasn't been clicked)
    if (!agentPurchased && !showPaymentPage) {
        return <AgentLandingPage onPurchase={handlePurchaseClick} />;
    }

    // VIEW 3: Main Agent Dashboard (If purchased is TRUE)
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
                <div className="content-area">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
}