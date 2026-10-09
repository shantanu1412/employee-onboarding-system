import React, { useState, useEffect, useCallback } from 'react';
import { 
  GraduationCap, 
  Info, 
  UserCheck, 
  CheckCircle2, 
  RefreshCw, 
  Edit3, 
  Clock, 
  CheckSquare, 
  Square
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingState from '../components/LoadingState';
import { getAllInductions, saveInduction } from '../services/api';

export default function Induction() {
  const [inductions, setInductions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInduction, setSelectedInduction] = useState(null);
  const [form, setForm] = useState({
    session_title: '',
    instructor_name: '',
    scheduled_date: '',
    completion_status: 'scheduled',
    it_assets_assigned: false,
    policy_acceptance: false,
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchInductions = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getAllInductions();
      setInductions(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching inductions:', err);
      setToast({
        type: 'error',
        title: 'Error Loading Inductions',
        message: err.message || 'Failed to retrieve induction sessions.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchInductions();
  }, [fetchInductions]);

  const handleOpenEdit = (item) => {
    setSelectedInduction(item);
    let schedDate = '';
    if (item.scheduled_date) {
      try {
        schedDate = new Date(item.scheduled_date).toISOString().slice(0, 16);
      } catch (err) {
        console.debug('Failed to parse scheduled date:', err);
        schedDate = item.scheduled_date;
      }
    }

    setForm({
      session_title: item.session_title || 'Corporate Orientation & HR Briefing',
      instructor_name: item.instructor_name || '',
      scheduled_date: schedDate,
      completion_status: item.completion_status || 'scheduled',
      it_assets_assigned: Boolean(item.it_assets_assigned),
      policy_acceptance: Boolean(item.policy_acceptance),
      notes: item.notes || ''
    });
    setIsEditOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveInduction(selectedInduction.candidate_id, form);
      setIsEditOpen(false);
      setToast({
        type: 'success',
        title: form.completion_status === 'completed' ? 'Onboarding Completed!' : 'Induction Updated',
        message: form.completion_status === 'completed'
          ? `Orientation finalized for ${selectedInduction.first_name} ${selectedInduction.last_name}. Candidate marked as Completed 🎉`
          : `Session details updated for ${selectedInduction.first_name} ${selectedInduction.last_name}.`
      });
      fetchInductions(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Update Error',
        message: err.message || 'Failed to update induction session.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not Scheduled';
    try {
      const d = new Date(dateString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="page-wrapper induction-page">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h2 className="page-heading">Induction & Orientation</h2>
          <p className="page-subheading">
            Coordinate welcome sessions, instructor assignments, IT hardware provisioning, and policy compliance sign-offs.
          </p>
        </div>

        <div className="header-action-group">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchInductions(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spinner-animation' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Inductions'}</span>
          </button>
        </div>
      </div>

      {/* Information Banner */}
      <div className="alert-banner alert-info">
        <Info size={20} className="alert-icon" />
        <div className="alert-content">
          <strong>Orientation & IT Enablement</strong>
          <p>
            When candidates complete orientation, receive hardware assets, and sign company policies, 
            mark their induction as <strong>Completed</strong> to finalize the entire employee onboarding journey.
          </p>
        </div>
      </div>

      {/* Induction Sessions Table */}
      <div className="table-card mb-6">
        <div className="table-card-header">
          <h3 className="section-title">Orientation Sessions</h3>
          <span className="badge-records-count">
            {inductions.length} Session{inductions.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <LoadingState message="Loading orientation sessions from MySQL..." />
        ) : (
          <div className="table-container-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department / Role</th>
                  <th>Session Title</th>
                  <th>Instructor</th>
                  <th>Scheduled Date & Time</th>
                  <th>IT Assets</th>
                  <th>Policy Sign-off</th>
                  <th>Induction Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {inductions.length > 0 ? (
                  inductions.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      <td>
                        <div className="candidate-full-name">
                          {item.first_name} {item.last_name}
                        </div>
                        <span className="candidate-id-sub">{item.email}</span>
                      </td>
                      <td>
                        <div>{item.position}</div>
                        <span className="department-tag">{item.department}</span>
                      </td>
                      <td>
                        <strong className="session-title-text">{item.session_title}</strong>
                      </td>
                      <td>
                        <span className="cell-with-icon">
                          <UserCheck size={13} className="cell-muted-icon" />
                          <span>{item.instructor_name || 'HR Team'}</span>
                        </span>
                      </td>
                      <td>
                        <span className="cell-with-icon">
                          <Clock size={13} className="cell-muted-icon" />
                          <span>{formatDateTime(item.scheduled_date)}</span>
                        </span>
                      </td>
                      <td>
                        {item.it_assets_assigned ? (
                          <span className="compliance-tag verified">
                            <CheckSquare size={13} /> Assigned
                          </span>
                        ) : (
                          <span className="compliance-tag pending">
                            <Square size={13} /> Pending
                          </span>
                        )}
                      </td>
                      <td>
                        {item.policy_acceptance ? (
                          <span className="compliance-tag verified">
                            <CheckSquare size={13} /> Signed
                          </span>
                        ) : (
                          <span className="compliance-tag pending">
                            <Square size={13} /> Pending
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge-pill ${item.completion_status === 'completed' ? 'badge-pill-success' : 'badge-pill-info'}`}>
                          {item.completion_status === 'completed' && <CheckCircle2 size={12} />}
                          <span className="capitalize">{item.completion_status}</span>
                        </span>
                      </td>
                      <td className="text-right">
                        <button 
                          type="button" 
                          className="btn btn-table-action"
                          onClick={() => handleOpenEdit(item)}
                          title="Manage orientation session"
                        >
                          <Edit3 size={13} />
                          <span>Manage</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="table-empty-cell">
                      <div className="empty-state-card py-6">
                        <GraduationCap size={36} className="text-muted" />
                        <h4 className="empty-state-title mt-2">No induction sessions found</h4>
                        <p className="empty-state-desc">
                          Induction sessions will be scheduled once candidates join the company.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit/Schedule Induction Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !submitting && setIsEditOpen(false)}
        title="Manage Induction & Orientation"
        subtitle={`Employee: ${selectedInduction?.first_name} ${selectedInduction?.last_name}`}
        maxWidth="600px"
      >
        <form onSubmit={handleSave} className="modal-form">
          <div className="form-group">
            <label className="form-label required">Session Title</label>
            <input
              type="text"
              className="form-control"
              value={form.session_title}
              onChange={(e) => setForm({ ...form, session_title: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Instructor / HR Trainer</label>
              <input
                type="text"
                className="form-control"
                value={form.instructor_name}
                onChange={(e) => setForm({ ...form, instructor_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={form.scheduled_date}
                onChange={(e) => setForm({ ...form, scheduled_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label required">Induction Completion Status</label>
            <select
              className="form-select"
              value={form.completion_status}
              onChange={(e) => setForm({ ...form, completion_status: e.target.value })}
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed (Finalize Onboarding)</option>
              <option value="missed">Missed / Reschedule Needed</option>
            </select>
          </div>

          <div className="compliance-checkbox-group mt-3">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={form.it_assets_assigned}
                onChange={(e) => setForm({ ...form, it_assets_assigned: e.target.checked })}
              />
              <span>IT Assets Handed Over (Laptop, monitors, peripherals, VPN)</span>
            </label>

            <label className="checkbox-label mt-2">
              <input
                type="checkbox"
                checked={form.policy_acceptance}
                onChange={(e) => setForm({ ...form, policy_acceptance: e.target.checked })}
              />
              <span>Company Security & Non-Disclosure (NDA) Policy Formally Signed</span>
            </label>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Orientation Notes & Feedback</label>
            <textarea
              className="form-control"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
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
              {submitting ? 'Saving...' : 'Save Induction'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
