import React, { useState, useEffect, useCallback } from 'react';
import { 
  Briefcase, 
  Info, 
  UserCheck, 
  Mail, 
  RefreshCw,
  Edit3,
  CheckCircle2,
  Clock
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingState from '../components/LoadingState';
import { getAllJoiningDetails, saveJoiningDetails } from '../services/api';

export default function JoiningDetails() {
  const [joiningRecords, setJoiningRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [form, setForm] = useState({
    employee_code: '',
    official_email: '',
    work_location: 'Headquarters',
    employment_type: 'full_time',
    reporting_manager: '',
    salary_ctc: '',
    joining_status: 'pending',
    actual_joining_date: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchRecords = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getAllJoiningDetails();
      setJoiningRecords(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching joining records:', err);
      setToast({
        type: 'error',
        title: 'Error Loading Joining Details',
        message: err.message || 'Failed to retrieve joining records.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleOpenEdit = (record) => {
    setSelectedRecord(record);
    let dateStr = '';
    if (record.actual_joining_date) {
      try {
        dateStr = new Date(record.actual_joining_date).toISOString().split('T')[0];
      } catch (err) {
        console.debug('Failed to parse actual joining date:', err);
        dateStr = record.actual_joining_date;
      }
    } else if (record.joining_date) {
      try {
        dateStr = new Date(record.joining_date).toISOString().split('T')[0];
      } catch (err) {
        console.debug('Failed to parse joining date:', err);
        dateStr = record.joining_date;
      }
    }

    setForm({
      employee_code: record.employee_code || '',
      official_email: record.official_email || '',
      work_location: record.work_location || 'Headquarters',
      employment_type: record.employment_type || 'full_time',
      reporting_manager: record.reporting_manager || '',
      salary_ctc: record.salary_ctc || '',
      joining_status: record.joining_status || 'pending',
      actual_joining_date: dateStr
    });
    setIsEditOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveJoiningDetails(selectedRecord.candidate_id, form);
      setIsEditOpen(false);
      setToast({
        type: 'success',
        title: 'Joining Updated',
        message: form.joining_status === 'joined'
          ? `${selectedRecord.first_name} ${selectedRecord.last_name} marked as Joined! Candidate moved to Induction.`
          : `Joining details updated for ${selectedRecord.first_name} ${selectedRecord.last_name}.`
      });
      fetchRecords(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Update Error',
        message: err.message || 'Failed to update joining details.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper joining-page">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h2 className="page-heading">Joining Details</h2>
          <p className="page-subheading">
            Manage official employment generation, employee codes, CTC agreements, and joining logistics.
          </p>
        </div>

        <div className="header-action-group">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchRecords(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spinner-animation' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Records'}</span>
          </button>
        </div>
      </div>

      {/* Information Banner */}
      <div className="alert-banner alert-info">
        <Info size={20} className="alert-icon" />
        <div className="alert-content">
          <strong>Joining Workflow Policy</strong>
          <p>
            Candidates transition to Joining Details upon document verification. 
            Official employee codes and corporate emails must be provisioned before the first day of employment.
          </p>
        </div>
      </div>

      {/* Joining Table */}
      <div className="table-card mb-6">
        <div className="table-card-header">
          <h3 className="section-title">Official Joining Records</h3>
          <span className="badge-records-count">
            {joiningRecords.length} Record{joiningRecords.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <LoadingState message="Loading candidate joining records from MySQL..." />
        ) : (
          <div className="table-container-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Employee Code</th>
                  <th>Official Email</th>
                  <th>Department / Role</th>
                  <th>Reporting Manager</th>
                  <th>CTC (INR)</th>
                  <th>Joining Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {joiningRecords.length > 0 ? (
                  joiningRecords.map((item) => (
                    <tr key={item.id} className="table-row-hover">
                      <td>
                        <div className="candidate-full-name">
                          {item.first_name} {item.last_name}
                        </div>
                        <span className="candidate-id-sub">{item.work_location}</span>
                      </td>
                      <td>
                        <strong className="code-badge">{item.employee_code || 'Pending'}</strong>
                      </td>
                      <td>
                        <span className="cell-with-icon">
                          <Mail size={13} className="cell-muted-icon" />
                          <span>{item.official_email || 'Not generated'}</span>
                        </span>
                      </td>
                      <td>
                        <div>{item.position}</div>
                        <span className="department-tag">{item.department}</span>
                      </td>
                      <td>
                        <span className="cell-with-icon">
                          <UserCheck size={13} className="cell-muted-icon" />
                          <span>{item.reporting_manager || 'Unassigned'}</span>
                        </span>
                      </td>
                      <td>
                        <span className="ctc-val">
                          {item.salary_ctc ? `₹ ${Number(item.salary_ctc).toLocaleString('en-IN')}` : '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge-pill ${item.joining_status === 'joined' ? 'badge-pill-success' : 'badge-pill-warning'}`}>
                          {item.joining_status === 'joined' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                          <span className="capitalize">{item.joining_status}</span>
                        </span>
                      </td>
                      <td className="text-right">
                        <button 
                          type="button" 
                          className="btn btn-table-action"
                          onClick={() => handleOpenEdit(item)}
                          title="Edit joining details"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="table-empty-cell">
                      <div className="empty-state-card py-6">
                        <Briefcase size={36} className="text-muted" />
                        <h4 className="empty-state-title mt-2">No joining records found</h4>
                        <p className="empty-state-desc">
                          Joining details will appear here once configured for verified candidates.
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

      {/* Edit Joining Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !submitting && setIsEditOpen(false)}
        title="Edit Joining Details"
        subtitle={`Employee: ${selectedRecord?.first_name} ${selectedRecord?.last_name}`}
        maxWidth="600px"
      >
        <form onSubmit={handleSave} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Employee Code</label>
              <input
                type="text"
                className="form-control"
                value={form.employee_code}
                onChange={(e) => setForm({ ...form, employee_code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Official Corporate Email</label>
              <input
                type="email"
                className="form-control"
                value={form.official_email}
                onChange={(e) => setForm({ ...form, official_email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Reporting Manager</label>
              <input
                type="text"
                className="form-control"
                value={form.reporting_manager}
                onChange={(e) => setForm({ ...form, reporting_manager: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Annual CTC (INR)</label>
              <input
                type="number"
                className="form-control"
                value={form.salary_ctc}
                onChange={(e) => setForm({ ...form, salary_ctc: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Work Location</label>
              <input
                type="text"
                className="form-control"
                value={form.work_location}
                onChange={(e) => setForm({ ...form, work_location: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select
                className="form-select"
                value={form.employment_type}
                onChange={(e) => setForm({ ...form, employment_type: e.target.value })}
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="contract">Contract</option>
                <option value="intern">Intern</option>
              </select>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Confirmed Joining Date</label>
              <input
                type="date"
                className="form-control"
                value={form.actual_joining_date}
                onChange={(e) => setForm({ ...form, actual_joining_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Joining Confirmation Status</label>
              <select
                className="form-select"
                value={form.joining_status}
                onChange={(e) => setForm({ ...form, joining_status: e.target.value })}
              >
                <option value="pending">Pending (Pre-joining)</option>
                <option value="joined">Confirmed Joined (Start Induction)</option>
                <option value="delayed">Delayed / Rescheduled</option>
                <option value="cancelled">Cancelled</option>
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
              {submitting ? 'Saving...' : 'Save Joining Details'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
