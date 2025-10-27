import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './AgentPage.css';
// AgentPage is rendered by parent SPA router; no react-router needed here

// Import Agent Landing and Payment components
import AgentLandingPage from './AgentLandingPage';
import AgentPaymentPage from './AgentPaymentPage'; // NEW IMPORT

// Import Icons
import sendIcon from './send.png'; 
import paperclipIcon from './paperclip.png';
import MyGoalIcon from './mygoal-icon.png'; 
import ChatIcon from './chat-icon.png';
import JobsIcon from './jobs-icon.png';
import StatisticsIcon from './statistics-icon.png';
import TutorialsIcon from './tutorials-icon.png';
import NotificationIcon from './icons/notification-icon.png'; 
import ProfileIcon from './icons/profile-icon.png';


// --- Placeholder Components for Dashboard Tabs (No changes here) ---
const MyGoalPage = ({ resumeText, userGoalPlan, onConfirmPlan, onChangePlan }) => {
    // This page now shows the generated plan and allows the user to confirm or request changes.
    if (!userGoalPlan) {
        return (
            <div className="agent-content-page goal-setting-page">
                <h2 className="goal-title">Set Your Goal in Chat</h2>
                <p>Start a conversation in the Chat tab and tell your agent about your career goal.
                Upload your resume there first so the agent can tailor the plan.</p>
            </div>
        );
    }

    const plan = userGoalPlan;

    return (
        <div className="agent-content-page goal-tracking-page">
            <h2>Your Proposed Roadmap</h2>
            <p>Review the agent's proposed plan below. Choose Confirm to lock and generate the visual roadmap, or Change to ask the agent to modify it.</p>

            <div className="plan-details-section">
                <h3>Plan for: {plan.goal}</h3>
                <div className="plan-steps">
                    {plan.plan.map((item, index) => (
                        <div key={index} className="plan-step-card">
                            <h4>Step {index + 1}: {item.step}</h4>
                            <p>{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                <button className="goal-submit-button" onClick={() => onChangePlan && onChangePlan()}>Change Plan</button>
                <button className="goal-submit-button" onClick={() => onConfirmPlan && onConfirmPlan()}>Confirm Plan</button>
            </div>

            {/* Roadmap visual area - initially hidden until confirmed. The parent will toggle to show a flow diagram when confirmed. */}
            {/* The confirmed roadmap rendering is handled by the parent via a different view or state. */}
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
    text: "I am an AI Agent. You can ask me Q&A, provide your skills and resume, and tell me your goal — I will help guide your career and create a plan.",
    sender: "bot",
};

// --- The Main Agent Page Component ---
export default function AgentPage({ currentPath, navigate, agentPurchased, setAgentPurchased }) {
    // NEW STATE: Manages the transition to the payment page
    const [showPaymentPage, setShowPaymentPage] = useState(false); 

    const [loading, setLoading] = useState(false);
    const [chatInput, setChatInput] = useState("");
    const [chatHistory, setChatHistory] = useState([AGENT_WELCOME]);
    const [persona, setPersona] = useState("a professional career coach");
    const [fullResumeText, setFullResumeText] = useState(null); 
    const [resumeFeedback, setResumeFeedback] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [planConfirmed, setPlanConfirmed] = useState(false);
    const [onboardingMode, setOnboardingMode] = useState('collect_docs'); // collect_docs | await_goal | plan_pending | active
    const [pendingPlan, setPendingPlan] = useState(null);
    const chatEndRef = useRef(null);
    const [userGoalPlan, setUserGoalPlan] = useState(null);

    // derive active view from parent-provided currentPath
    const pathAfterAgent = (currentPath || '').split('/agent/')[1] || '';
    const activeView = pathAfterAgent.split('/')[0] || 'chat';

    // Scroll to bottom of chat when in chat view
    useEffect(() => {
        if (activeView === 'chat') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [chatHistory, activeView]);

    const token = localStorage.getItem('kb_token');
    const userId = localStorage.getItem('kb_user_id') || 'default';
    const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

    // Load saved plan from backend on mount (per-user)
    useEffect(() => {
        async function fetchSavedPlan() {
            try {
                const res = await axios.get(`http://localhost:5000/api/load-plan`, { headers: authHeaders });
                if (res.data && res.data.plan) {
                    setUserGoalPlan(res.data.plan);
                    setPlanConfirmed(true);
                }
            } catch (e) {
                console.warn('No saved plan found or load failed', e);
            }
        }
        fetchSavedPlan();
    }, [token]);

    // 1. Landing Page -> Payment Page
    const handlePurchaseClick = () => {
        // Move from Landing Page to Payment Page
        setShowPaymentPage(true); 
    navigate('/agent'); // ensure route stays under /agent
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
    navigate('/agent/chat');
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
    navigate('/agent/chat');
        setChatHistory([AGENT_WELCOME]); 
    };

    // --- In AgentPage.js, replace the existing handleChatSubmit function ---

const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userMessage = chatInput;
    // Treat as goal-setting only when user is in onboarding 'await_goal' or no plan exists and still collecting docs
    const isGoalSetting = onboardingMode === 'await_goal' || (onboardingMode === 'collect_docs' && !userGoalPlan);

    setChatHistory(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setLoading(true);

    try {
    if (isGoalSetting) {
            const goal = userMessage;

            // 1. Get Plan
                    const planRes = await axios.post("http://localhost:5000/api/agent-plan", { goal }, { headers: authHeaders });
            const initialPlan = planRes.data.plan;

            // 2. Get Prediction using uploaded resume if present
            let predictionData = { success_score: 50, justification: 'No resume provided.' };
            if (fullResumeText) {
                try {
                    const predRes = await axios.post('http://localhost:5000/api/predict-success', { resumeText: fullResumeText, goal }, { headers: authHeaders });
                    predictionData = predRes.data.prediction;
                } catch (pe) {
                    console.warn('Prediction failed', pe);
                }
            }

            const fullPlan = {
                goal: goal,
                predictionScore: predictionData.success_score,
                justification: predictionData.justification,
                plan: initialPlan.plan.map(step => ({ ...step, isComplete: false }))
            };

            // set pending plan and ask user to confirm in chat
            setPendingPlan(fullPlan);
            setOnboardingMode('plan_pending');
            setChatHistory(prev => [...prev, { sender: 'bot', text: `✅ I have generated a proposed plan for: ${goal}\nPrediction: ${predictionData.success_score}%\n${predictionData.justification}\nPlan (pointwise):\n${fullPlan.plan.map((p, i) => `${i+1}. ${p.step} - ${p.description}`).join('\n')}` }]);
            } else {
            const chatHistoryPayload = chatHistory.map(msg => ({ sender: msg.sender, text: msg.text }));
                const res = await axios.post("http://localhost:5000/api/agent-query", { 
                query: userMessage,
                chat_history: chatHistoryPayload,
                persona: persona
            }, { headers: authHeaders });
            const botReply = res.data.reply;
            setChatHistory(prev => [...prev, { sender: 'bot', text: botReply }]);
        }

    } catch (err) {
        console.error(err);
        setChatHistory(prev => [...prev, { sender: 'bot', text: '❌ An error occurred. Check backend server logs.' }]);
    } finally {
        setLoading(false);
    }
};

    // --- Renderers for the main content area ---
    const renderContent = () => {
        switch (activeView) {
            case 'mygoal':
                if (planConfirmed && userGoalPlan) {
                    // Render visual roadmap flow using existing CSS
                    return (
                        <div className="agent-content-page goal-tracking-page-container">
                            <h2 className="goal-title">Roadmap for: {userGoalPlan.goal}</h2>
                            <div className="horizontal-roadmap-flow">
                                {userGoalPlan.plan.map((step, idx) => (
                                    <React.Fragment key={idx}>
                                        <div className={`flow-step ${idx <  userGoalPlan.plan.findIndex(s => s.isComplete) ? 'complete' : ''}`}>
                                            <div className="step-header">
                                                <div className="step-number">{idx+1}</div>
                                                <h4>{step.step}</h4>
                                            </div>
                                            <div className="step-description">{step.description}</div>
                                            <div className="skills-list">
                                                <h5>Suggested skills & actions</h5>
                                                <ul>
                                                    <li>Learn core concepts</li>
                                                    <li>Build a project</li>
                                                    <li>Apply to jobs</li>
                                                </ul>
                                            </div>
                                        </div>
                                        {idx < userGoalPlan.plan.length - 1 && <div className={`flow-connector ${idx <  userGoalPlan.plan.findIndex(s => s.isComplete) ? 'complete' : ''}`} />}
                                    </React.Fragment>
                                ))}
                            </div>
                        </div>
                    );
                }

                return <MyGoalPage resumeText={fullResumeText} userGoalPlan={userGoalPlan} onConfirmPlan={() => setPlanConfirmed(true)} onChangePlan={async () => {
                    // Simple change flow: ask agent to regenerate plan with a slight modification prompt
                    if (!userGoalPlan) return;
                    const newGoal = userGoalPlan.goal + ' (revise)';
                    try {
                            const resp = await axios.post('http://localhost:5000/api/agent-plan', { goal: newGoal }, { headers: authHeaders });
                            setUserGoalPlan(resp.data.plan);
                        } catch (e) {
                            console.error('Change plan failed', e);
                        }
                }} />;
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

                            {/* resume upload moved to input area */}
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
                            <input id="hidden-resume-input" type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style={{ display: 'none' }} onChange={async (e) => {
                                const file = e.target.files[0];
                                if (!file) return;
                                setUploading(true);
                                const form = new FormData();
                                form.append('file', file);
                                try {
                                    const res = await axios.post('http://localhost:5000/api/process-resume', form, { headers: { 'Content-Type': 'multipart/form-data', ...authHeaders } });
                                    const data = res.data;
                                    if (data.feedback) setResumeFeedback(data.feedback);
                                    if (data.resume_text) setFullResumeText(data.resume_text);
                                    // move to awaiting goal state
                                    setOnboardingMode('await_goal');
                                    setChatHistory(prev => [...prev, { sender: 'bot', text: '✅ Resume uploaded and ingested. Please provide your career goal (one sentence). Example: Become a Full Stack Developer.' }]);
                                } catch (err) {
                                    console.error('Upload error', err);
                                    setChatHistory(prev => [...prev, { sender: 'bot', text: '❌ Failed to upload resume. See console for details.' }]);
                                } finally {
                                    setUploading(false);
                                    e.target.value = null;
                                }
                            }} />

                            <button type="button" title="Upload resume" onClick={() => document.getElementById('hidden-resume-input').click()} className="agent-send-button" style={{ marginRight: 8 }}>
                                <img src={paperclipIcon} alt="Attach" />
                            </button>

                            <button type="submit" disabled={loading} className="agent-send-button">
                                <img src={sendIcon} alt="Send" />
                            </button>
                        </form>
                        {uploading && <div style={{ padding: 8, color: '#aebfc2' }}>Uploading and processing resume...</div>}
                        {resumeFeedback && (
                            <div style={{ padding: '8px 12px', color: '#cfeadf' }}>
                                <strong>Resume Feedback:</strong>
                                <div><strong>Strengths:</strong> {resumeFeedback.strengths?.join(', ')}</div>
                                <div><strong>Improvements:</strong> {resumeFeedback.improvements?.join(', ')}</div>
                            </div>
                        )}

                        {onboardingMode === 'plan_pending' && pendingPlan && (
                            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                <button className="goal-submit-button" onClick={async () => {
                                    // Confirm plan: save to userGoalPlan, persist to backend, and set active
                                    setUserGoalPlan(pendingPlan);
                                    try {
                                                    await axios.post(`http://localhost:5000/api/save-plan`, { user_id: userId, plan: pendingPlan }, { headers: authHeaders });
                                    } catch (e) {
                                        console.warn('Failed to save plan to backend', e);
                                    }
                                    setPlanConfirmed(true);
                                    setOnboardingMode('active');
                                    setPendingPlan(null);
                                    setChatHistory(prev => [...prev, { sender: 'bot', text: '✅ Roadmap has been set for your goal and saved. All the best! You can view it in MyGoal.' }]);
                                }}>Confirm Plan</button>
                                <button className="goal-submit-button" onClick={() => {
                                    setOnboardingMode('await_goal');
                                    setChatHistory(prev => [...prev, { sender: 'bot', text: 'Okay — please provide the revised goal or tell me what to change in the plan.' }]);
                                }}>Change Plan</button>
                            </div>
                        )}
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
                    <button className={`nav-item`} onClick={() => navigate('/agent/mygoal')}>
                        <img src={MyGoalIcon} alt="My Goal" className="nav-icon" /> MyGoal
                    </button>
                    <button className={`nav-item`} onClick={() => navigate('/agent/chat')}>
                        <img src={ChatIcon} alt="Chat" className="nav-icon" /> Chat
                    </button>
                    <button className={`nav-item`} onClick={() => navigate('/agent/jobs')}>
                        <img src={JobsIcon} alt="Jobs" className="nav-icon" /> Jobs
                    </button>
                    <button className={`nav-item`} onClick={() => navigate('/agent/statistics')}>
                        <img src={StatisticsIcon} alt="Statistics" className="nav-icon" /> Statistics
                    </button>
                    <button className={`nav-item`} onClick={() => navigate('/agent/tutorials')}>
                        <img src={TutorialsIcon} alt="Tutorials" className="nav-icon" /> Tutorials
                    </button>
                </nav>
                <div style={{ padding: 12 }}>
                    <button onClick={() => { localStorage.removeItem('kb_token'); localStorage.removeItem('kb_user_id'); window.location.href = '/login'; }} className="goal-submit-button">Logout</button>
                </div>
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