import React, { useState } from 'react';
import axios from 'axios';
import './AgentPage.css'; // Use shared CSS

// --- The Core Goal Tracking Component ---
export default function MyGoalPage({ userGoalPlan, setUserGoalPlan }) {
    const [goalInput, setGoalInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- VIEW 1: Goal Submission Form ---
    if (!userGoalPlan) {
        return (
            <div className="goal-setting-page">
                <h2>Set Your Primary Goal</h2>
                <p>Define your primary career goal and let your agent build your personalized roadmap.</p>
                
                <form onSubmit={(e) => e.preventDefault()} className="goal-form-vertical">
                    <input
                        type="text"
                        value={goalInput}
                        onChange={(e) => setGoalInput(e.target.value)}
                        placeholder="E.g., Become a Senior Full-Stack Developer"
                        className="goal-input"
                        disabled={loading}
                    />
                    <button onClick={() => {
                        // This button will eventually trigger a complex process via the chat agent
                        // For now, it will simply set a dummy plan for visualization
                        const dummyPlan = {
                            goal: goalInput,
                            plan: [
                                { step: "Build Technical Foundation", description: "Master core programming skills (Python/JavaScript) and data structures.", isComplete: true },
                                { step: "Complete Portfolio Project", description: "Develop a full-stack, deployed application showing technical mastery.", isComplete: false },
                                { step: "Acquire Specialized AI Skills", description: "Learn key ML/Agentic frameworks like LangChain and apply them.", isComplete: false },
                                { step: "Optimize Resume & Network", description: "Finalize professional materials and target companies like Relatim.", isComplete: false },
                                { step: "Ace Technical Interviews", description: "Practice behavioral and complex problem-solving skills for final rounds.", isComplete: false },
                            ]
                        };
                        setUserGoalPlan(dummyPlan);
                        setGoalInput('');
                    }} disabled={loading || !goalInput.trim()} className="goal-submit-button">
                        Generate Roadmap
                    </button>
                </form>
                {error && <div className="error-message">{error}</div>}
            </div>
        );
    }

    // --- VIEW 2: Visual Tracking Interface ---
    const completionPercentage = userGoalPlan.plan.filter(step => step.isComplete).length / userGoalPlan.plan.length * 100;

    return (
        <div className="goal-tracking-page">
            <h2>Tracking Goal: {userGoalPlan.goal}</h2>
            <div className="tracking-summary">
                <div className="tracking-metric">
                    <h3>Progress</h3>
                    <p className="percentage">{completionPercentage.toFixed(0)}%</p>
                </div>
                <div className="tracking-metric">
                    <h3>Success Score (Initial)</h3>
                    <p className="score">75%</p>
                </div>
            </div>

            <div className="goal-path-container">
                {userGoalPlan.plan.map((item, index) => (
                    <React.Fragment key={index}>
                        <div className={`path-step ${item.isComplete ? 'complete' : 'pending'}`}>
                            <div className="step-icon">
                                {item.isComplete ? '✓' : index + 1}
                            </div>
                            <div className="step-details">
                                <h4>{item.step}</h4>
                                <p>{item.description}</p>
                                {!item.isComplete && <span className="next-action">Next Action: Go to Chat for resources.</span>}
                            </div>
                        </div>
                        {index < userGoalPlan.plan.length - 1 && (
                            <div className="path-connector"></div>
                        )}
                    </React.Fragment>
                ))}
            </div>

            <button onClick={() => setUserGoalPlan(null)} className="goal-reset-button">
                Set a New Goal
            </button>
        </div>
    );
}