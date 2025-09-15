import React, { useState } from 'react';
import axios from 'axios';
import './AgentPage.css';

const AgentPage = () => {
    const [goal, setGoal] = useState('');
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGoalSubmit = async (e) => {
        e.preventDefault();
        if (!goal.trim()) {
            setError('Please enter a goal.');
            return;
        }

        setLoading(true);
        setError('');
        setPlan(null);

        try {
            const res = await axios.post("http://localhost:5000/api/agent-plan", { goal });
            setPlan(res.data.plan);
        } catch (err) {
            setError('Failed to generate a plan. Please try again.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="agent-page-container">
            <h2>AI Agent</h2>
            <p>I'm here to help you achieve your goals. What would you like to accomplish?</p>
            
            <form onSubmit={handleGoalSubmit} className="goal-form">
                <input
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="e.g., Become a AI Engineer"
                    className="goal-input"
                    disabled={loading}
                />
                <button type="submit" disabled={loading} className="goal-submit-button">
                    {loading ? 'Generating...' : 'Start Planning'}
                </button>
            </form>

            {error && <div className="error-message">{error}</div>}

            {plan && (
                <div className="plan-container">
                    <h3>Goal: {plan.goal}</h3>
                    <div className="plan-steps-container">
                        {plan.plan.map((step, index) => (
                            <div key={index} className="plan-step">
                                <h4>Step {index + 1}: {step.step}</h4>
                                <p>{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AgentPage;