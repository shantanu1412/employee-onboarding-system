import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Activity, 
  Building2,
  X,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const handleNavClick = () => {
    if (window.innerWidth < 1024 && onClose) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div className="sidebar-backdrop" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-brand-wrapper">
          <div className="sidebar-brand">
            <div className="brand-icon-box">
              <Building2 size={22} className="brand-svg-icon" />
            </div>
            <div className="brand-text-group">
              <span className="brand-app-name">Employee Onboarding</span>
              <span className="brand-app-badge">HR PORTAL</span>
            </div>
          </div>
          <button 
            type="button" 
            className="sidebar-close-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="sidebar-nav">
          {/* Group 1: MAIN */}
          <div className="nav-group">
            <div className="nav-group-title">MAIN</div>
            <ul className="nav-list">
              <li>
                <NavLink 
                  to="/" 
                  end
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <LayoutDashboard size={18} className="nav-icon" />
                  <span className="nav-label">Dashboard</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Group 2: CANDIDATE MANAGEMENT */}
          <div className="nav-group">
            <div className="nav-group-title">CANDIDATE MANAGEMENT</div>
            <ul className="nav-list">
              <li>
                <NavLink 
                  to="/candidates" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Users size={18} className="nav-icon" />
                  <span className="nav-label">Candidates</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Group 3: ONBOARDING */}
          <div className="nav-group">
            <div className="nav-group-title">ONBOARDING</div>
            <ul className="nav-list">
              <li>
                <NavLink 
                  to="/documents" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <FileText size={18} className="nav-icon" />
                  <span className="nav-label">Documents</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/joining-details" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Briefcase size={18} className="nav-icon" />
                  <span className="nav-label">Joining Details</span>
                </NavLink>
              </li>
              <li>
                <NavLink 
                  to="/induction" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <GraduationCap size={18} className="nav-icon" />
                  <span className="nav-label">Induction</span>
                </NavLink>
              </li>
            </ul>
          </div>

          {/* Group 4: SYSTEM */}
          <div className="nav-group">
            <div className="nav-group-title">SYSTEM</div>
            <ul className="nav-list">
              <li>
                <NavLink 
                  to="/system-status" 
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={handleNavClick}
                >
                  <Activity size={18} className="nav-icon" />
                  <span className="nav-label">System Status</span>
                  <span className="status-live-indicator">LIVE</span>
                </NavLink>
              </li>
            </ul>
          </div>
        </nav>

        {/* Sidebar Footer User Card */}
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              <span>HA</span>
            </div>
            <div className="user-info">
              <span className="user-name">HR Admin</span>
              <span className="user-role">HR Operations Lead</span>
            </div>
            <div className="user-verified-badge" title="Authenticated HR Administrator">
              <ShieldCheck size={16} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
