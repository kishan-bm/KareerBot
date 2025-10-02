import React from 'react';
import './AgentLandingPage.css'; // This CSS file will contain the new styles

// Import icons for the feature cards. Make sure these paths are correct!
import ProactiveGuidanceIcon from './icons/arrow-up-icon.png'; // Example icon for 'Proactive Guidance'
import SuccessPredictionIcon from './icons/check-circle-icon.png'; // Example icon for 'Success Prediction'
import PersonalizedPlansIcon from './icons/clipboard-list-icon.png'; // Example icon for 'Personalized Plans'


const AgentLandingPage = ({ onPurchase }) => {
  return (
    <div className="agent-landing-page-container">
      <div className="agent-landing-card"> {/* Main card wrapper */}
        <h2 className="landing-title">Unlock Your Personal AI Agent</h2>
        <p className="landing-subtitle">Your dedicated partner for proactive career guidance and success.</p>

        <div className="feature-grid">
          {/* Feature 1: Proactive Guidance */}
          <div className="feature-item">
            <img src={ProactiveGuidanceIcon} alt="Proactive Guidance" className="feature-icon" />
            <p className="feature-name">Proactive Guidance</p>
          </div>

          {/* Feature 2: Success Prediction */}
          <div className="feature-item">
            <img src={SuccessPredictionIcon} alt="Success Prediction" className="feature-icon" />
            <p className="feature-name">Success Prediction</p>
          </div>

          {/* Feature 3: Personalized Plans */}
          <div className="feature-item">
            <img src={PersonalizedPlansIcon} alt="Personalized Plans" className="feature-icon" />
            <p className="feature-name">Personalized Plans</p>
          </div>
        </div>

        <button onClick={onPurchase} className="purchase-button">
          Buy Your Agent
        </button>
        <p className="landing-footer-text">Experience a smarter way to manage your career roadmap.</p>
      </div>
    </div>
  );
};

export default AgentLandingPage;