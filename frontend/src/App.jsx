import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Candidates from './pages/Candidates';
import CandidateDetails from './pages/CandidateDetails';
import Documents from './pages/Documents';
import JoiningDetails from './pages/JoiningDetails';
import Induction from './pages/Induction';
import SystemStatus from './pages/SystemStatus';
import './App.css';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Main Dashboard */}
          <Route index element={<Dashboard />} />

          {/* Candidates & Candidate Details */}
          <Route path="candidates" element={<Candidates />} />
          <Route path="candidates/:id" element={<CandidateDetails />} />

          {/* Onboarding Workflow Modules */}
          <Route path="documents" element={<Documents />} />
          <Route path="joining-details" element={<JoiningDetails />} />
          <Route path="joining" element={<Navigate to="/joining-details" replace />} />
          <Route path="induction" element={<Induction />} />

          {/* Technical Diagnostics */}
          <Route path="system-status" element={<SystemStatus />} />

          {/* Catch-all fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
