import React, { useState, useEffect } from 'react';
import './AgentPage.css'; // Uses existing styles

export default function AgentDashboardHub({ setActiveView }) {
    const [showHub, setShowHub] = useState(false);

    useEffect(() => {
        // Simple delay to ensure the component is mounted before showing
        setShowHub(true);
    }, []);

    const handleFeatureClick = (viewName) => {
        // Direct transition to the clicked feature view
        setActiveView(viewName);
    };

    return (
        <div className="agent-hub-container">
            {showHub && (
                <div className="agent-feature-grid-v2">
                    {/* Central Button: Clicks to the main chat interface */}
                    <div 
                        className="feature-bubble center-chat-bubble" 
                        onClick={() => handleFeatureClick('chat')}
                    >
                        Chat
                    </div>

                    {/* Surrounding Feature Bubbles (Red Circles) */}
                    <div 
                        className="feature-bubble top-center-v2" 
                        onClick={() => handleFeatureClick('myGoal')}
                    >
                        MyGoal
                    </div>
                    
                    <div 
                        className="feature-bubble right-center-v2" 
                        onClick={() => handleFeatureClick('jobs')}
                    >
                        jobs
                    </div>
                    
                    <div 
                        className="feature-bubble bottom-left-v2" 
                        onClick={() => handleFeatureClick('tutorials')}
                    >
                        tutorials
                    </div>
                    
                    <div 
                        className="feature-bubble bottom-right-v2" 
                        onClick={() => handleFeatureClick('statistics')}
                    >
                        statastics
                    </div>
                </div>
            )}
            {/* The 'YOUR AGENT' button is now the landing page itself */}
        </div>
    );
}