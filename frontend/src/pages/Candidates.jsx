import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  UserPlus, 
  Search, 
  RefreshCw, 
  AlertCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import CandidateTable from '../components/CandidateTable';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { 
  getCandidates, 
  createCandidate, 
  updateCandidate, 
  deleteCandidate 
} from '../services/api';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'selected', label: 'Selected' },
  { value: 'document_verification', label: 'Document Verification' },
  { value: 'joining_pending', label: 'Joining Pending' },
  { value: 'induction_in_progress', label: 'Induction In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'rejected', label: 'Rejected' }
];

const DEFAULT_FORM = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  position: '',
  department: 'Engineering',
  joining_date: '',
  status: 'selected'
};

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDepartment, setSelectedDepartment] = useState('all');

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [currentCandidate, setCurrentCandidate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Toast state
  const [toast, setToast] = useState(null);

  const fetchCandidateList = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const response = await getCandidates();
      const list = Array.isArray(response?.data) ? response.data : [];
      setCandidates(list);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setError(err.message || 'Unable to load candidates. Please check whether the Express server is running.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidateList();
  }, [fetchCandidateList]);

  // Unique departments for filter
  const departmentOptions = useMemo(() => {
    const depts = new Set(['Engineering', 'Product', 'Design', 'Marketing', 'Human Resources', 'Finance', 'Sales']);
    candidates.forEach(c => {
      if (c.department) depts.add(c.department);
    });
    return ['all', ...Array.from(depts)];
  }, [candidates]);

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return candidates.filter(candidate => {
      const fullName = `${candidate.first_name || ''} ${candidate.last_name || ''}`.toLowerCase();
      const email = (candidate.email || '').toLowerCase();
      const position = (candidate.position || '').toLowerCase();
      const query = searchTerm.toLowerCase().trim();

      const matchesSearch = !query || 
        fullName.includes(query) || 
        email.includes(query) || 
        position.includes(query);

      const matchesStatus = selectedStatus === 'all' || candidate.status === selectedStatus;
      const matchesDept = selectedDepartment === 'all' || candidate.department === selectedDepartment;

      return matchesSearch && matchesStatus && matchesDept;
    });
  }, [candidates, searchTerm, selectedStatus, selectedDepartment]);

  const hasActiveFilters = searchTerm !== '' || selectedStatus !== 'all' || selectedDepartment !== 'all';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedDepartment('all');
  };

  // Form Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.first_name.trim()) errors.first_name = 'First name is required';
    if (!formData.last_name.trim()) errors.last_name = 'Last name is required';
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address';
    }
    if (!formData.phone.trim()) errors.phone = 'Phone number is required';
    if (!formData.position.trim()) errors.position = 'Job position is required';
    if (!formData.department.trim()) errors.department = 'Department is required';
    if (!formData.joining_date) errors.joining_date = 'Target joining date is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setFormData(DEFAULT_FORM);
    setFormErrors({});
    setIsAddOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (candidate) => {
    setCurrentCandidate(candidate);
    // Format date for date input (YYYY-MM-DD)
    let formattedDate = '';
    if (candidate.joining_date) {
      try {
        formattedDate = new Date(candidate.joining_date).toISOString().split('T')[0];
      } catch (_) {
        formattedDate = candidate.joining_date;
      }
    }

    setFormData({
      first_name: candidate.first_name || '',
      last_name: candidate.last_name || '',
      email: candidate.email || '',
      phone: candidate.phone || '',
      position: candidate.position || '',
      department: candidate.department || 'Engineering',
      joining_date: formattedDate,
      status: candidate.status || 'selected'
    });
    setFormErrors({});
    setIsEditOpen(true);
  };

  // Open Delete Modal
  const handleOpenDelete = (candidate) => {
    setCurrentCandidate(candidate);
    setIsDeleteOpen(true);
  };

  // Submit Add Candidate
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await createCandidate(formData);
      setIsAddOpen(false);
      setToast({
        type: 'success',
        title: 'Candidate Created',
        message: `${formData.first_name} ${formData.last_name} has been successfully added to the onboarding pool.`
      });
      fetchCandidateList(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Error Creating Candidate',
        message: err.message || 'Failed to create candidate.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Edit Candidate
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await updateCandidate(currentCandidate.id, formData);
      setIsEditOpen(false);
      setToast({
        type: 'success',
        title: 'Candidate Updated',
        message: `Candidate record for ${formData.first_name} ${formData.last_name} was updated.`
      });
      fetchCandidateList(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Error Updating Candidate',
        message: err.message || 'Failed to update candidate.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Confirm Delete Candidate
  const handleDeleteConfirm = async () => {
    if (!currentCandidate) return;
    setSubmitting(true);
    try {
      await deleteCandidate(currentCandidate.id);
      setIsDeleteOpen(false);
      setToast({
        type: 'success',
        title: 'Candidate Deleted',
        message: `${currentCandidate.first_name} ${currentCandidate.last_name} was removed from the system.`
      });
      fetchCandidateList(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Error Deleting Candidate',
        message: err.message || 'Failed to delete candidate.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-wrapper candidates-page">
      {/* Toast Notification Container */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h2 className="page-heading">Candidates</h2>
          <p className="page-subheading">
            Manage candidate profiles and track onboarding status.
          </p>
        </div>

        <div className="header-action-group">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchCandidateList(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spinner-animation' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh List'}</span>
          </button>

          <button 
            type="button"
            className="btn btn-primary"
            onClick={handleOpenAdd}
          >
            <UserPlus size={16} />
            <span>Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="alert-banner alert-danger">
          <AlertCircle size={20} className="alert-icon" />
          <div className="alert-content">
            <strong>Unable to load candidates</strong>
            <p>{error}</p>
            <small>Please check the server connection and ensure MySQL is reachable on port 3306.</small>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-danger"
            onClick={() => fetchCandidateList()}
          >
            Retry Connection
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-card">
        <div className="filter-grid">
          {/* Search Box */}
          <div className="filter-field search-field">
            <label htmlFor="candidate-search" className="filter-label">Search Candidates</label>
            <div className="input-with-icon">
              <Search size={16} className="input-icon" />
              <input
                id="candidate-search"
                type="text"
                className="form-control"
                placeholder="Search by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  type="button" 
                  className="input-clear-btn"
                  onClick={() => setSearchTerm('')}
                  aria-label="Clear search"
                >
                  <XCircle size={15} />
                </button>
              )}
            </div>
          </div>

          {/* Status Filter */}
          <div className="filter-field">
            <label htmlFor="status-filter" className="filter-label">Status Filter</label>
            <div className="select-wrapper">
              <select
                id="status-filter"
                className="form-select"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Department Filter */}
          <div className="filter-field">
            <label htmlFor="dept-filter" className="filter-label">Department Filter</label>
            <div className="select-wrapper">
              <select
                id="dept-filter"
                className="form-select"
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
              >
                {departmentOptions.map(dept => (
                  <option key={dept} value={dept}>
                    {dept === 'all' ? 'All Departments' : dept}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset Filters Action */}
          {hasActiveFilters && (
            <div className="filter-field-actions">
              <button 
                type="button"
                className="btn btn-outline btn-sm filter-reset-btn"
                onClick={resetFilters}
              >
                <XCircle size={14} />
                <span>Reset Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Filter Summary Stats */}
        <div className="filter-summary-row">
          <span className="filter-count-text">
            Showing <strong>{filteredCandidates.length}</strong> of <strong>{candidates.length}</strong> candidates
          </span>
          {hasActiveFilters && (
            <span className="filter-active-pill">
              Filtered results
            </span>
          )}
        </div>
      </div>

      {/* Candidate Data Table with View, Edit, and Delete Actions */}
      <div className="table-card">
        <CandidateTable 
          candidates={filteredCandidates}
          loading={loading}
          error={error}
          onEdit={handleOpenEdit}
          onDelete={handleOpenDelete}
        />
      </div>

      {/* MODAL 1: Add Candidate */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => !submitting && setIsAddOpen(false)}
        title="Add New Candidate"
        subtitle="Create a candidate profile to initiate the onboarding process."
        maxWidth="600px"
      >
        <form onSubmit={handleCreateSubmit} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">First Name</label>
              <input
                type="text"
                className={`form-control ${formErrors.first_name ? 'is-invalid' : ''}`}
                placeholder="e.g. Rahul"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
              {formErrors.first_name && <span className="field-error">{formErrors.first_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Last Name</label>
              <input
                type="text"
                className={`form-control ${formErrors.last_name ? 'is-invalid' : ''}`}
                placeholder="e.g. Verma"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
              {formErrors.last_name && <span className="field-error">{formErrors.last_name}</span>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Email Address</label>
              <input
                type="email"
                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                placeholder="rahul.verma@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Phone Number</label>
              <input
                type="text"
                className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                placeholder="+91-9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Position / Designation</label>
              <input
                type="text"
                className={`form-control ${formErrors.position ? 'is-invalid' : ''}`}
                placeholder="e.g. Product Designer"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
              {formErrors.position && <span className="field-error">{formErrors.position}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Department</label>
              <select
                className={`form-select ${formErrors.department ? 'is-invalid' : ''}`}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Sales">Sales</option>
              </select>
              {formErrors.department && <span className="field-error">{formErrors.department}</span>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Scheduled Joining Date</label>
              <input
                type="date"
                className={`form-control ${formErrors.joining_date ? 'is-invalid' : ''}`}
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              />
              {formErrors.joining_date && <span className="field-error">{formErrors.joining_date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Initial Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="selected">Selected (Default)</option>
                <option value="document_verification">Document Verification</option>
                <option value="joining_pending">Joining Pending</option>
              </select>
            </div>
          </div>

          <div className="modal-actions-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsAddOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="spinner-animation" />
                  <span>Adding Candidate...</span>
                </>
              ) : (
                'Add Candidate'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Edit Candidate */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => !submitting && setIsEditOpen(false)}
        title="Edit Candidate Profile"
        subtitle={`Update details for ${currentCandidate?.first_name} ${currentCandidate?.last_name}`}
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">First Name</label>
              <input
                type="text"
                className={`form-control ${formErrors.first_name ? 'is-invalid' : ''}`}
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              />
              {formErrors.first_name && <span className="field-error">{formErrors.first_name}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Last Name</label>
              <input
                type="text"
                className={`form-control ${formErrors.last_name ? 'is-invalid' : ''}`}
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              />
              {formErrors.last_name && <span className="field-error">{formErrors.last_name}</span>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Email Address</label>
              <input
                type="email"
                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {formErrors.email && <span className="field-error">{formErrors.email}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Phone Number</label>
              <input
                type="text"
                className={`form-control ${formErrors.phone ? 'is-invalid' : ''}`}
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
              {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Position / Designation</label>
              <input
                type="text"
                className={`form-control ${formErrors.position ? 'is-invalid' : ''}`}
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              />
              {formErrors.position && <span className="field-error">{formErrors.position}</span>}
            </div>

            <div className="form-group">
              <label className="form-label required">Department</label>
              <select
                className={`form-select ${formErrors.department ? 'is-invalid' : ''}`}
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              >
                <option value="Engineering">Engineering</option>
                <option value="Product">Product</option>
                <option value="Design">Design</option>
                <option value="Marketing">Marketing</option>
                <option value="Human Resources">Human Resources</option>
                <option value="Finance">Finance</option>
                <option value="Sales">Sales</option>
              </select>
              {formErrors.department && <span className="field-error">{formErrors.department}</span>}
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Joining Date</label>
              <input
                type="date"
                className={`form-control ${formErrors.joining_date ? 'is-invalid' : ''}`}
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
              />
              {formErrors.joining_date && <span className="field-error">{formErrors.joining_date}</span>}
            </div>

            <div className="form-group">
              <label className="form-label">Onboarding Status</label>
              <select
                className="form-select"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={15} className="spinner-animation" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Delete Confirmation */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => !submitting && setIsDeleteOpen(false)}
        title="Delete Candidate Record"
        maxWidth="460px"
      >
        <div className="delete-dialog-content">
          <div className="delete-warning-icon">
            <AlertTriangle size={28} />
          </div>
          <p className="delete-confirm-text">
            Are you sure you want to delete candidate{' '}
            <strong>
              {currentCandidate?.first_name} {currentCandidate?.last_name}
            </strong>
            ?
          </p>
          <p className="delete-subtext">
            This action will safely remove the candidate profile and all associated onboarding records from MySQL. This action cannot be undone.
          </p>

          <div className="modal-actions-footer mt-6">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsDeleteOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger"
              onClick={handleDeleteConfirm}
              disabled={submitting}
            >
              {submitting ? 'Deleting...' : 'Delete Candidate'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
