import React, { useState, useEffect, useCallback } from 'react';
import { 
  Server, 
  Database, 
  Globe, 
  Code2, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Terminal, 
  Zap 
} from 'lucide-react';
import { healthCheck, databaseHealthCheck, getCandidates } from '../services/api';

export default function SystemStatus() {
  const [healthData, setHealthData] = useState(null);
  const [dbData, setDbData] = useState(null);
  const [testCandidateData, setTestCandidateData] = useState(null);
  
  const [loadingHealth, setLoadingHealth] = useState(false);
  const [loadingCandidateTest, setLoadingCandidateTest] = useState(false);
  const [latency, setLatency] = useState(null);
  const [lastPingTime, setLastPingTime] = useState(null);
  const [error, setError] = useState(null);

  // Expandable sections for raw JSON
  const [expandHealthJson, setExpandHealthJson] = useState(false);
  const [expandDbJson, setExpandDbJson] = useState(false);
  const [expandCandidateJson, setExpandCandidateJson] = useState(false);

  const [copiedSection, setCopiedSection] = useState(null);

  const runDiagnostics = useCallback(async () => {
    setLoadingHealth(true);
    setError(null);
    const start = performance.now();

    try {
      const [hRes, dbRes] = await Promise.all([
        healthCheck(),
        databaseHealthCheck().catch(err => ({ error: err.message, connected: false }))
      ]);

      const end = performance.now();
      setLatency(Math.round(end - start));
      setHealthData(hRes);
      setDbData(dbRes);
      setLastPingTime(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('System diagnostics error:', err);
      setError(err.message || 'Cannot connect to backend Express server.');
      setLastPingTime(new Date().toLocaleTimeString());
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  const handleTestCandidateRoute = async () => {
    setLoadingCandidateTest(true);
    try {
      const res = await getCandidates();
      setTestCandidateData(res);
      setExpandCandidateJson(true);
    } catch (err) {
      setTestCandidateData({ error: err.message });
      setExpandCandidateJson(true);
    } finally {
      setLoadingCandidateTest(false);
    }
  };

  const copyToClipboard = (data, sectionKey) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopiedSection(sectionKey);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  useEffect(() => {
    runDiagnostics();
  }, [runDiagnostics]);

  const isApiConnected = Boolean(healthData?.success);
  const isDbConnected = Boolean(healthData?.database?.connected || dbData?.success || dbData?.connected);

  return (
    <div className="page-wrapper system-status-page">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h2 className="page-heading">System Diagnostics & Architecture</h2>
          <p className="page-subheading">
            Live technical health monitor for Frontend, Express REST API, and MySQL Database.
          </p>
        </div>

        <div className="header-action-group">
          <button 
            type="button"
            className="btn btn-primary"
            onClick={runDiagnostics}
            disabled={loadingHealth}
          >
            <RefreshCw size={15} className={loadingHealth ? 'spinner-animation' : ''} />
            <span>{loadingHealth ? 'Pinging Server...' : '🔄 Ping Server'}</span>
          </button>
        </div>
      </div>

      {/* Global Error Notice if API down */}
      {error && (
        <div className="alert-banner alert-danger">
          <XCircle size={20} className="alert-icon" />
          <div className="alert-content">
            <strong>Backend API Connection Failed</strong>
            <p>{error}</p>
            <small>Verify that the Express server is running on <code>http://localhost:5000</code>.</small>
          </div>
        </div>
      )}

      {/* Architecture Tier Cards */}
      <div className="tech-stack-cards-grid">
        {/* Tier 1: Frontend */}
        <div className="card tech-tier-card">
          <div className="tier-header">
            <span className="tier-badge">Tier 1</span>
            <div className="tier-status-pill connected">
              <span className="status-dot"></span> Active
            </div>
          </div>
          <div className="tier-body">
            <div className="tier-title-row">
              <Globe size={24} className="tier-icon text-cyan" />
              <div>
                <h3 className="tier-title">Frontend</h3>
                <span className="tier-subtitle">Client Interface</span>
              </div>
            </div>
            <ul className="tier-specs">
              <li>
                <CheckCircle2 size={15} className="spec-check" />
                <span>React 19 + Vite</span>
              </li>
              <li>
                <span className="spec-label">Port:</span>
                <code className="spec-code">5173</code>
              </li>
              <li>
                <CheckCircle2 size={15} className="spec-check" />
                <span>Responsive CSS & Lucide Icons</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Tier 2: Backend */}
        <div className="card tech-tier-card">
          <div className="tier-header">
            <span className="tier-badge">Tier 2</span>
            <div className={`tier-status-pill ${isApiConnected ? 'connected' : 'error'}`}>
              <span className="status-dot"></span> {isApiConnected ? 'Connected' : 'Offline'}
            </div>
          </div>
          <div className="tier-body">
            <div className="tier-title-row">
              <Server size={24} className="tier-icon text-emerald" />
              <div>
                <h3 className="tier-title">Backend API</h3>
                <span className="tier-subtitle">Node.js + Express REST</span>
              </div>
            </div>
            <ul className="tier-specs">
              <li>
                {isApiConnected ? <CheckCircle2 size={15} className="spec-check" /> : <XCircle size={15} className="spec-x" />}
                <span>Node.js + Express</span>
              </li>
              <li>
                <span className="spec-label">Port:</span>
                <code className="spec-code">5000</code>
              </li>
              <li>
                <CheckCircle2 size={15} className="spec-check" />
                <span>CORS, Morgan, & Global ErrorHandler</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Tier 3: Database */}
        <div className="card tech-tier-card">
          <div className="tier-header">
            <span className="tier-badge">Tier 3</span>
            <div className={`tier-status-pill ${isDbConnected ? 'connected' : 'error'}`}>
              <span className="status-dot"></span> {isDbConnected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
          <div className="tier-body">
            <div className="tier-title-row">
              <Database size={24} className="tier-icon text-indigo" />
              <div>
                <h3 className="tier-title">Database</h3>
                <span className="tier-subtitle">Relational MySQL</span>
              </div>
            </div>
            <ul className="tier-specs">
              <li>
                {isDbConnected ? <CheckCircle2 size={15} className="spec-check" /> : <XCircle size={15} className="spec-x" />}
                <span>MySQL 9.6</span>
              </li>
              <li>
                <span className="spec-label">Database:</span>
                <code className="spec-code">employee_onboarding</code>
              </li>
              <li>
                <span className="spec-label">Port:</span>
                <code className="spec-code">3306</code>
              </li>
            </ul>
          </div>
        </div>

        {/* Tier 4: HTTP Client */}
        <div className="card tech-tier-card">
          <div className="tier-header">
            <span className="tier-badge">Network</span>
            <div className="tier-status-pill connected">
              <span className="status-dot"></span> Ready
            </div>
          </div>
          <div className="tier-body">
            <div className="tier-title-row">
              <Code2 size={24} className="tier-icon text-amber" />
              <div>
                <h3 className="tier-title">HTTP Client</h3>
                <span className="tier-subtitle">Axios Integration</span>
              </div>
            </div>
            <ul className="tier-specs">
              <li>
                <CheckCircle2 size={15} className="spec-check" />
                <span>Axios Client Interceptors</span>
              </li>
              <li>
                <span className="spec-label">Service:</span>
                <code className="spec-code">frontend/src/services/api.js</code>
              </li>
              <li>
                <span className="spec-label">Latency:</span>
                <strong className="text-highlight">{latency !== null ? `${latency} ms` : '—'}</strong>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Live Health Details & Diagnostic Ping Cards */}
      <div className="diagnostics-detail-grid">
        {/* Card A: Express API Health */}
        <div className="card health-summary-card">
          <div className="card-header">
            <div className="endpoint-pill-title">
              <span className="http-method-tag">GET</span>
              <code>/api/health</code>
            </div>
            {latency !== null && (
              <span className="latency-indicator-badge">
                <Zap size={13} /> {latency} ms
              </span>
            )}
          </div>

          <div className="card-body">
            <div className="health-metrics-list">
              <div className="metric-row">
                <span className="metric-label">API Status</span>
                <span className={`metric-val-pill ${isApiConnected ? 'success' : 'danger'}`}>
                  {isApiConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">HTTP Status</span>
                <code className="metric-val-code">{isApiConnected ? '200 OK' : 'ERR_NETWORK'}</code>
              </div>
              <div className="metric-row">
                <span className="metric-label">Response Time</span>
                <span className="metric-val-text">{latency !== null ? `${latency} ms` : 'N/A'}</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Message</span>
                <span className="metric-val-text">
                  {healthData?.message || 'Employee Onboarding API is running'}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Last Checked</span>
                <span className="metric-val-text">{lastPingTime || 'Just now'}</span>
              </div>
            </div>

            {/* Collapsible Technical Details */}
            <div className="collapsible-technical-section">
              <button 
                type="button" 
                className="btn-expand-trigger"
                onClick={() => setExpandHealthJson(!expandHealthJson)}
              >
                {expandHealthJson ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Technical Details (Raw /api/health JSON)</span>
                <span className="expand-indicator-hint">{expandHealthJson ? '[Collapse]' : '[Expand]'}</span>
              </button>

              {expandHealthJson && (
                <div className="code-block-container mt-2">
                  <div className="code-block-header">
                    <span>Response Payload</span>
                    <button 
                      type="button" 
                      className="copy-btn-sm"
                      onClick={() => copyToClipboard(healthData, 'health')}
                    >
                      <Copy size={13} />
                      <span>{copiedSection === 'health' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="code-pre">
                    {JSON.stringify(healthData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card B: MySQL Database Health */}
        <div className="card health-summary-card">
          <div className="card-header">
            <div className="endpoint-pill-title">
              <span className="http-method-tag">GET</span>
              <code>/api/health/db</code>
            </div>
            <span className={`metric-val-pill ${isDbConnected ? 'success' : 'danger'}`}>
              {isDbConnected ? 'MySQL Connected' : 'MySQL Offline'}
            </span>
          </div>

          <div className="card-body">
            <div className="health-metrics-list">
              <div className="metric-row">
                <span className="metric-label">MySQL Database</span>
                <span className={`metric-val-pill ${isDbConnected ? 'success' : 'danger'}`}>
                  {isDbConnected ? 'Connected' : 'Pending'}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Database Name</span>
                <code className="metric-val-code">employee_onboarding</code>
              </div>
              <div className="metric-row">
                <span className="metric-label">Database Host</span>
                <span className="metric-val-text">localhost:3306</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Tables Verified</span>
                <span className="metric-val-text">users, candidates, documents, joining_details, induction</span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Active Connection Pool</span>
                <span className="metric-val-text">mysql2 connection pool (Max 10)</span>
              </div>
            </div>

            {/* Collapsible Technical Details */}
            <div className="collapsible-technical-section">
              <button 
                type="button" 
                className="btn-expand-trigger"
                onClick={() => setExpandDbJson(!expandDbJson)}
              >
                {expandDbJson ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Technical Details (Raw /api/health/db JSON)</span>
                <span className="expand-indicator-hint">{expandDbJson ? '[Collapse]' : '[Expand]'}</span>
              </button>

              {expandDbJson && (
                <div className="code-block-container mt-2">
                  <div className="code-block-header">
                    <span>Database Diagnostic JSON</span>
                    <button 
                      type="button" 
                      className="copy-btn-sm"
                      onClick={() => copyToClipboard(dbData, 'db')}
                    >
                      <Copy size={13} />
                      <span>{copiedSection === 'db' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="code-pre">
                    {JSON.stringify(dbData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Developer Route Tester: GET /api/candidates */}
      <div className="card route-tester-card mt-6">
        <div className="card-header">
          <div className="card-header-title">
            <Terminal size={18} className="header-icon-accent" />
            <span>Developer Route Verification Tool</span>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={handleTestCandidateRoute}
            disabled={loadingCandidateTest}
          >
            <RefreshCw size={14} className={loadingCandidateTest ? 'spinner-animation' : ''} />
            <span>{loadingCandidateTest ? 'Querying API...' : 'Test Candidate REST Route'}</span>
          </button>
        </div>

        <div className="card-body">
          <p className="route-tester-desc">
            Directly test the foundational <code>GET /api/candidates</code> route. 
            Raw payload responses are encapsulated inside this collapsible container so the main business dashboard remains clean.
          </p>

          {testCandidateData && (
            <div className="collapsible-technical-section mt-4">
              <button 
                type="button" 
                className="btn-expand-trigger"
                onClick={() => setExpandCandidateJson(!expandCandidateJson)}
              >
                {expandCandidateJson ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <span>Candidate Route Output (<code>/api/candidates</code>)</span>
                <span className="expand-indicator-hint">{expandCandidateJson ? '[Collapse]' : '[Expand]'}</span>
              </button>

              {expandCandidateJson && (
                <div className="code-block-container mt-2">
                  <div className="code-block-header">
                    <span>API JSON Payload</span>
                    <button 
                      type="button" 
                      className="copy-btn-sm"
                      onClick={() => copyToClipboard(testCandidateData, 'candidates')}
                    >
                      <Copy size={13} />
                      <span>{copiedSection === 'candidates' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="code-pre">
                    {JSON.stringify(testCandidateData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
