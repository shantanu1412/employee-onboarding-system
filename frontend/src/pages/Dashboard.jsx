import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  FileCheck, 
  Briefcase, 
  GraduationCap, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import StatCard from '../components/StatCard';
import OnboardingProgress from '../components/OnboardingProgress';
import CandidateTable from '../components/CandidateTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { 
  getCandidates, 
  getDashboardOverview, 
  updateCandidate 
} from '../services/api';

export default function Dashboard() {
  const navigate = useNavigate();

  const [candidates, setCandidates] = useState([]);
  const [metrics, setMetrics] = useState({
    totalCandidates: 0,
    selected: 0,
    documentVerification: 0,
    joiningPending: 0,
    inductionInProgress: 0,
    completed: 0,
    pendingDocuments: 0
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Quick edit modal on recent candidates
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editCandidate, setEditCandidate] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const fetchDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [candidatesRes, dashboardRes] = await Promise.all([
        getCandidates(),
        getDashboardOverview()
      ]);

      const candidateList = Array.isArray(candidatesRes?.data) ? candidatesRes.data : [];
      setCandidates(candidateList);

      if (dashboardRes?.data) {
        setMetrics(dashboardRes.data);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Unable to connect to the backend server. Please verify Express is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleOpenEdit = (candidate) => {
    setEditCandidate(candidate);
    let formattedDate = '';
    if (candidate.joining_date) {
      try {
        formattedDate = new Date(candidate.joining_date).toISOString().split('T')[0];
      } catch (_) {
        formattedDate = candidate.joining_date;
      }
    }

    setEditForm({
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone || '',
      position: candidate.position,
      department: candidate.department,
      joining_date: formattedDate,
      status: candidate.status
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateCandidate(editCandidate.id, editForm);
      setIsEditOpen(false);
      setToast({
        type: 'success',
        title: 'Candidate Updated',
        message: `${editForm.first_name} ${editForm.last_name} was updated successfully.`
      });
      fetchDashboardData(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Update Error',
        message: err.message || 'Failed to update candidate.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare pipeline counts for the visual pipeline stage
  const pipelineCounts = {
    selected: metrics.selected,
    document_verification: metrics.documentVerification,
    joining_pending: metrics.joiningPending,
    induction_in_progress: metrics.inductionInProgress,
    completed: metrics.completed
  };

  return (
    <div className="page-wrapper dashboard-page">
      {/* Toast Feedback */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top Welcome Header */}
      <div className="page-header-flex">
        <div>
          <h2 className="page-heading">Good Morning, HR Admin 👋</h2>
          <p className="page-subheading">
            Manage and track employee onboarding from candidate selection to completion.
          </p>
        </div>

        <div className="header-action-group">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchDashboardData(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spinner-animation' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <button 
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/candidates')}
          >
            <Users size={16} />
            <span>Manage Candidates</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner if API Fails */}
      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={20} className="alert-icon" />
          <div className="alert-content">
            <strong>Unable to load dashboard data</strong>
            <p>{error}</p>
            <small>Check whether the Express API is running on port 5000 and MySQL is active.</small>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-danger"
            onClick={() => fetchDashboardData()}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* 5 Real Summary Stat Cards */}
      <div className="stats-grid stats-grid-5">
        <StatCard
          title="Total Candidates"
          value={metrics.totalCandidates}
          icon={Users}
          theme="blue"
          subtitle="All registered candidates"
          badge="In Pool"
          loading={loading}
        />
        <StatCard
          title="Documents Pending"
          value={metrics.pendingDocuments || metrics.documentVerification}
          icon={FileCheck}
          theme="amber"
          subtitle="Verification pending"
          badge="Action Req"
          loading={loading}
        />
        <StatCard
          title="Joining Pending"
          value={metrics.joiningPending}
          icon={Briefcase}
          theme="purple"
          subtitle="Pre-joining logistics"
          badge="Logistics"
          loading={loading}
        />
        <StatCard
          title="Induction In Progress"
          value={metrics.inductionInProgress}
          icon={GraduationCap}
          theme="indigo"
          subtitle="Orientation & IT assets"
          badge="Orientation"
          loading={loading}
        />
        <StatCard
          title="Completed Onboarding"
          value={metrics.completed}
          icon={CheckCircle2}
          theme="green"
          subtitle="Fully onboarded employees"
          badge="Graduated"
          loading={loading}
        />
      </div>

      {/* Onboarding Visual Pipeline with Live MySQL Counts */}
      <section className="dashboard-section">
        <OnboardingProgress 
          mode="pipeline"
          stageCounts={pipelineCounts}
        />
      </section>

      {/* Recent Candidates Section with View and Edit Actions */}
      <section className="dashboard-section">
        <div className="section-header-flex">
          <div>
            <h3 className="section-title">Recent Candidates</h3>
            <p className="section-subtitle">
              Candidates currently progressing through the onboarding workflow
            </p>
          </div>

          <button 
            type="button" 
            className="btn btn-link"
            onClick={() => navigate('/candidates')}
          >
            <span>See all candidates</span>
            <ArrowRight size={15} />
          </button>
        </div>

        <div className="table-card">
          <CandidateTable 
            candidates={candidates.slice(0, 5)}
            loading={loading}
            error={error}
            onEdit={handleOpenEdit}
          />
        </div>
      </section>

      {/* Edit Candidate Quick Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !submitting && setIsEditOpen(false)}
        title="Edit Candidate"
        subtitle={`Candidate ID #${editCandidate?.id}`}
      >
        <form onSubmit={handleEditSubmit} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">First Name</label>
              <input
                type="text"
                className="form-control"
                value={editForm.first_name || ''}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={editForm.last_name || ''}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Email</label>
              <input
                type="email"
                className="form-control"
                value={editForm.email || ''}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Phone</label>
              <input
                type="text"
                className="form-control"
                value={editForm.phone || ''}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Position</label>
              <input
                type="text"
                className="form-control"
                value={editForm.position || ''}
                onChange={(e) => setEditForm({ ...editForm, position: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Department</label>
              <input
                type="text"
                className="form-control"
                value={editForm.department || ''}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Joining Date</label>
              <input
                type="date"
                className="form-control"
                value={editForm.joining_date || ''}
                onChange={(e) => setEditForm({ ...editForm, joining_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={editForm.status || 'selected'}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="selected">Selected</option>
                <option value="document_verification">Document Verification</option>
                <option value="joining_pending">Joining Pending</option>
                <option value="induction_in_progress">Induction In Progress</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="modal-actions-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsEditOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
