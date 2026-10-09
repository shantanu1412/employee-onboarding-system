import React, { useState } from 'react';
import { Menu, Bell, ChevronDown, CheckCircle2, User, Settings, LogOut } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          type="button" 
          className="mobile-menu-trigger"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <div className="header-titles">
          <h1 className="header-main-title">Employee Onboarding Management</h1>
          <p className="header-sub-title">HR Management Portal</p>
        </div>
      </div>

      <div className="header-right">
        {/* Quick System Health Pill */}
        <div className="header-health-indicator" title="Connected to Express API & MySQL">
          <span className="health-dot-pulse"></span>
          <span className="health-label">System Active</span>
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="header-popover-container">
          <button 
            type="button"
            className="header-icon-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserDropdown(false);
            }}
            aria-label="View notifications"
          >
            <Bell size={18} />
            <span className="notification-badge">1</span>
          </button>

          {showNotifications && (
            <div className="dropdown-panel notification-panel">
              <div className="dropdown-panel-header">
                <strong>Notifications</strong>
                <span className="badge-unread">1 New</span>
              </div>
              <div className="notification-list">
                <div className="notification-item">
                  <div className="notification-icon">
                    <CheckCircle2 size={16} />
                  </div>
                  <div className="notification-text">
                    <p className="notification-msg">
                      <strong>Ananya Sharma</strong> submitted documents for verification.
                    </p>
                    <span className="notification-time">Today, Engineering Dept</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* HR Admin Profile Menu */}
        <div className="header-popover-container">
          <button 
            type="button"
            className="user-profile-btn"
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowNotifications(false);
            }}
            aria-label="User menu"
          >
            <div className="user-avatar-sm">
              <span>HA</span>
            </div>
            <span className="user-name-display">HR Admin</span>
            <ChevronDown size={15} className={`chevron-transition ${showUserDropdown ? 'open' : ''}`} />
          </button>

          {showUserDropdown && (
            <div className="dropdown-panel user-menu-panel">
              <div className="user-menu-header">
                <div className="user-avatar-md">HA</div>
                <div>
                  <div className="user-menu-name">HR Administrator</div>
                  <div className="user-menu-email">admin@company.com</div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <ul className="user-menu-links">
                <li>
                  <span className="user-menu-item">
                    <User size={15} />
                    <span>Admin Profile</span>
                  </span>
                </li>
                <li>
                  <span className="user-menu-item">
                    <Settings size={15} />
                    <span>Portal Settings</span>
                  </span>
                </li>
                <li className="menu-item-disabled">
                  <span className="user-menu-item">
                    <LogOut size={15} />
                    <span>Sign Out (Session Protected)</span>
                  </span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
