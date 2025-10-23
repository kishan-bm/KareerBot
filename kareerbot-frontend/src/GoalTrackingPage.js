import React from 'react';
import './AgentPage.css';

export default function GoalTrackingPage({ userGoalPlan, setUserGoalPlan }) {
    
    // --- Initial State Check ---
    if (!userGoalPlan) {
        return (
            <div className="goal-not-set">
                <h2>No Goal Set</h2>
                <p>Please return to the **Chat** to set your primary career goal. Your agent will build the roadmap here after confirmation.</p>
            </div>
        );
    }

    // --- Dynamic Content Display ---
    const completionPercentage = userGoalPlan.plan.filter(step => step.isComplete).length / userGoalPlan.plan.length * 100;

    return (
        <div className="goal-tracking-page-container">
            <h2 className="goal-title">Roadmap for: {userGoalPlan.goal}</h2>
            
            <div className="tracking-summary">
                <div className="tracking-metric">
                    <h3>Progress</h3>
                    <p className="percentage">{completionPercentage.toFixed(0)}% Complete</p>
                </div>
                <div className="tracking-metric">
                    <h3>Current Phase</h3>
                    {/* Find the first incomplete step */}
                    <p className="current-phase">
                        {userGoalPlan.plan.find(step => !step.isComplete)?.step || "Goal Achieved!"}
                    </p>
                </div>
            </div>

            <div className="horizontal-roadmap-flow">
                {userGoalPlan.plan.map((item, index) => (
                    <React.Fragment key={index}>
                        <div className={`flow-step ${item.isComplete ? 'complete' : 'pending'}`}>
                            <div className="step-header">
                                <span className="step-number">{index + 1}</span>
                                <h4>{item.step}</h4>
                            </div>
                            <p className="step-description">{item.description}</p>
                            <div className="skills-list">
                                <h5>Skills to Master:</h5>
                                <ul>
                                    {item.skills_required.map((skill, i) => (
                                        <li key={i}>{skill}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                        {/* Connector line between steps */}
                        {index < userGoalPlan.plan.length - 1 && (
                            <div className={`flow-connector ${userGoalPlan.plan[index].isComplete ? 'complete' : 'pending'}`}></div>
                        )}
                    </React.Fragment>
                ))}
            </div>
            
            {/* Action button (for demonstration, allowing reset) */}
            <button onClick={() => setUserGoalPlan(null)} className="goal-reset-button">
                Clear/Start New Goal
            </button>
        </div>
    );
}