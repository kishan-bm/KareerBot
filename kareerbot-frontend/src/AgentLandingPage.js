import React from 'react';
import './AgentPage.css';

const AgentLandingPage = ({ onPurchase }) => {
  return (
    <div className="agent-landing-page-container">
      <div className="agent-landing-content">
        <h2>Unlock Your Personal AI Agent</h2>
        <p>Purchase your personal AI agent to get proactive guidance, success prediction, and more.</p>
        <button onClick={onPurchase} className="purchase-button">
          Buy Your Agent
        </button>
      </div>
    </div>
  );
};

export default AgentLandingPage;