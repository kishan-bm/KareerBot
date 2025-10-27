// import React, { useState } from 'react';
// import './App.css';
// import ResumeBotPage from './ResumeBotPage';
// import AgentPage from './AgentPage';
// import userIcon from './user.png';
// import NotificationIcon from './icons/notification-icon.png'; 
// import ProfileIcon from './icons/profile-icon.png'; 

// export default function App() {
//   const [currentPage, setCurrentPage] = useState('resumeBot');
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [agentPurchased, setAgentPurchased] = useState(false); // New global state

//   const toggleSidebar = () => {
//     setSidebarOpen(!sidebarOpen);
//   };
  
//   return (
//     <div className="app-container">
//       <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
//         <div className="sidebar-header">
//           <h3>KareerBot Menu</h3>
//           <button className="close-btn" onClick={toggleSidebar}>&times;</button>
//         </div>
//         <div className="sidebar-search-container">
//           <div className="search-bar">
//             <span className="material-icons search-icon">search</span>
//             <input type="text" placeholder="Search" />
//           </div>
//         </div>
//         <ul className="sidebar-links">
//           {/* We will add the New Chat button here later */}
//         </ul>
//         <div className="bottom-sidebar-links">
//           <ul className="sidebar-links">
//             <li><span className="material-icons">settings</span>Settings</li>
//             <li><span className="material-icons">help</span>Help</li>
//             <li className="profile-item">
//               <img src={userIcon} alt="Profile" className="profile-icon" />
//               <span className="profile-name">Kishan B M</span>
//             </li>
//           </ul>
//         </div>
//       </div>
      
//       <div className="main-content-pane">
//         {currentPage === 'resumeBot' ? (
//           <ResumeBotPage onSidebarToggle={toggleSidebar} />
//         ) : (
//           <AgentPage 
//             agentPurchased={agentPurchased} 
//             setAgentPurchased={setAgentPurchased} 
//           />
//         )}
//       </div>

//       <nav className="bottom-nav">
//         <button className={currentPage === 'resumeBot' ? 'active' : ''} onClick={() => setCurrentPage('resumeBot')}>
//           Resume Bot
//         </button>
//         <button className={currentPage === 'agentPage' ? 'active' : ''} onClick={() => setCurrentPage('agentPage')}>
//           AI Agent
//         </button>
//       </nav>
//     </div>
//   );
// }

import React from 'react';
import './App.css';
import ResumeBotPage from './ResumeBotPage';
import AgentPage from './AgentPage';
import userIcon from './user.png';
// Import the new icons for the App-level navigation (assuming they are in src/icons or src)
import NotificationIcon from './icons/notification-icon.png'; 
import ProfileIcon from './icons/profile-icon.png'; 
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import LandingPage from './LandingPage';


export default function App() {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [agentPurchased, setAgentPurchased] = React.useState(false); // New global state
  const [currentPath, setCurrentPath] = React.useState(window.location.pathname || '/');

  // central navigate function updates history and state
  const navigate = (to) => {
    if (to === currentPath) return;
    window.history.pushState({}, '', to);
    setCurrentPath(to);
  };

  React.useEffect(() => {
    const onPop = () => setCurrentPath(window.location.pathname || '/');
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  
  
  return (
    <div className="app-container">
      {/* Existing Sidebar */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* ... (Sidebar content remains the same) ... */}
        <div className="sidebar-header">
          <h3>KareerBot</h3>
          <button className="close-btn" onClick={toggleSidebar}>&times;</button>
        </div>
        <div className="sidebar-search-container">
          <div className="search-bar">
            <span className="material-icons search-icon"></span>
            <input type="text" placeholder="Search" />
          </div>
        </div>
        <ul className="sidebar-links">
          {/* We will add the New Chat button here later */}
        </ul>
        <div className="bottom-sidebar-links">
          <ul className="sidebar-links">
            <li><span className="material-icons"></span>Settings</li>
            <li><span className="material-icons"></span>Help</li>
            <li className="profile-item">
              <img src={userIcon} alt="Profile" className="profile-icon" />
              <span className="profile-name">Kishan B M</span>
            </li>
          </ul>
        </div>
      </div>
      
      {/* NEW TOP NAVIGATION BAR */}
      <nav className="top-nav-app">
        <div className="top-nav-buttons">
          <button className="top-nav-btn" onClick={() => navigate('/resume')}>Resume Bot</button>
          <button className="top-nav-btn" onClick={() => navigate('/agent/chat')}>AI Agent</button>
        </div>
        <div className="top-nav-icons">
          <img src={NotificationIcon} alt="Notifications" className="top-icon" />
          <img src={ProfileIcon} alt="Profile" className="top-icon" />
        </div>
      </nav>
      {/* END NEW TOP NAVIGATION BAR */}

      <div className="main-content-pane">
        {currentPath === '/' && <LandingPage navigate={navigate} />}
        {currentPath === '/resume' && (localStorage.getItem('kb_token') ? <ResumeBotPage onSidebarToggle={toggleSidebar} /> : <LandingPage navigate={navigate} />)}
        {currentPath === '/login' && <LandingPage navigate={navigate} />}
        {currentPath === '/register' && <LandingPage navigate={navigate} />}
        {currentPath.startsWith('/agent') && (localStorage.getItem('kb_token') ? <AgentPage currentPath={currentPath} navigate={navigate} agentPurchased={agentPurchased} setAgentPurchased={setAgentPurchased} /> : <LandingPage navigate={navigate} />)}
      </div>

      {/* REMOVED: The bottom-nav is now obsolete */}
      {/* <nav className="bottom-nav">...</nav> */}
    </div>
  );
}