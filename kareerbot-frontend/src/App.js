import React, { useState } from 'react';
import './App.css';
import ResumeBotPage from './ResumeBotPage';
import AgentPage from './AgentPage';
import userIcon from './user.png';

export default function App() {
  const [currentPage, setCurrentPage] = useState('resumeBot');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [agentPurchased, setAgentPurchased] = useState(false); // New global state

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <div className="app-container">
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h3>KareerBot Menu</h3>
          <button className="close-btn" onClick={toggleSidebar}>&times;</button>
        </div>
        <div className="sidebar-search-container">
          <div className="search-bar">
            <span className="material-icons search-icon">search</span>
            <input type="text" placeholder="Search" />
          </div>
        </div>
        <ul className="sidebar-links">
          {/* We will add the New Chat button here later */}
        </ul>
        <div className="bottom-sidebar-links">
          <ul className="sidebar-links">
            <li><span className="material-icons">settings</span>Settings</li>
            <li><span className="material-icons">help</span>Help</li>
            <li className="profile-item">
              <img src={userIcon} alt="Profile" className="profile-icon" />
              <span className="profile-name">Kishan B M</span>
            </li>
          </ul>
        </div>
      </div>
      
      <div className="main-content-pane">
        {currentPage === 'resumeBot' ? (
          <ResumeBotPage onSidebarToggle={toggleSidebar} />
        ) : (
          <AgentPage 
            agentPurchased={agentPurchased} 
            setAgentPurchased={setAgentPurchased} 
          />
        )}
      </div>

      <nav className="bottom-nav">
        <button className={currentPage === 'resumeBot' ? 'active' : ''} onClick={() => setCurrentPage('resumeBot')}>
          Resume Bot
        </button>
        <button className={currentPage === 'agentPage' ? 'active' : ''} onClick={() => setCurrentPage('agentPage')}>
          AI Agent
        </button>
      </nav>
    </div>
  );
}