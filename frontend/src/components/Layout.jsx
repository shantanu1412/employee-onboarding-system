import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="enterprise-layout">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Main Content Area */}
      <div className="layout-body">
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
        />

        <main className="content-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
