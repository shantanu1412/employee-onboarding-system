import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Briefcase, 
  Building, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  AlertCircle,
  UserCheck,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  ExternalLink,
  Laptop,
  CheckSquare,
  Square,
  Edit3,
  Trash2,
  AlertTriangle,
  FileUp,
  MapPin,
  DollarSign,
  Hash
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import OnboardingProgress from '../components/OnboardingProgress';
import LoadingState from '../components/LoadingState';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { 
  getCandidateById, 
  updateCandidate, 
  uploadCandidateDocument, 
  updateDocumentStatus, 
  deleteDocument,
  getDocumentFileUrl,
  saveJoiningDetails, 
  saveInduction 
} from '../services/api';

const DOCUMENT_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Degree Certificate',
  'Resume',
  'Experience Letter',
  'Address Proof',
  'Other'
];

export default function CandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [candidate, setCandidate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  // Modals state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [isUploadDocOpen, setIsUploadDocOpen] = useState(false);
  const [isVerifyDocOpen, setIsVerifyDocOpen] = useState(false);
  const [isRejectDocOpen, setIsRejectDocOpen] = useState(false);
  const [isJoiningOpen, setIsJoiningOpen] = useState(false);
  const [isInductionOpen, setIsInductionOpen] = useState(false);

  // Form states
  const [submitting, setSubmitting] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Edit Candidate form
  const [profileForm, setProfileForm] = useState({});

  // Document Upload form
  const [docType, setDocType] = useState('Aadhaar Card');
  const [docFile, setDocFile] = useState(null);
  const [docRemarks, setDocRemarks] = useState('');

  // Document Verification form
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');

  // Joining Details form
  const [joiningForm, setJoiningForm] = useState({
    employee_code: '',
    official_email: '',
    work_location: 'Headquarters',
    employment_type: 'full_time',
    reporting_manager: '',
    salary_ctc: '',
    joining_status: 'pending',
    actual_joining_date: ''
  });

  // Induction form
  const [inductionForm, setInductionForm] = useState({
    session_title: 'Corporate Orientation & HR Briefing',
    instructor_name: '',
    scheduled_date: '',
    completion_status: 'scheduled',
    it_assets_assigned: false,
    policy_acceptance: false,
    notes: ''
  });

  const loadCandidateData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getCandidateById(id);
      if (res?.data) {
        setCandidate(res.data);
      } else {
        setError(`Candidate with ID #${id} was not found.`);
      }
    } catch (err) {
      console.error('Error fetching candidate details:', err);
      setError(err.message || 'Unable to retrieve candidate details from backend.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadCandidateData();
  }, [loadCandidateData]);

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Scheduled';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  // --- Handlers: Profile Edit ---
  const handleOpenEditProfile = () => {
    let formattedDate = '';
    if (candidate.joining_date) {
      try {
        formattedDate = new Date(candidate.joining_date).toISOString().split('T')[0];
      } catch (err) {
        console.debug('Failed to parse date:', err);
        formattedDate = candidate.joining_date;
      }
    }

    setProfileForm({
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email,
      phone: candidate.phone || '',
      position: candidate.position,
      department: candidate.department,
      joining_date: formattedDate,
      status: candidate.status
    });
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await updateCandidate(candidate.id, profileForm);
      setIsEditProfileOpen(false);
      setToast({
        type: 'success',
        title: 'Profile Updated',
        message: 'Candidate information updated successfully.'
      });
      loadCandidateData();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Failed to update candidate profile.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers: Document Upload ---
  const handleOpenUploadDoc = () => {
    setDocType('Aadhaar Card');
    setDocFile(null);
    setDocRemarks('');
    setIsUploadDocOpen(true);
  };

  const handleUploadDocSubmit = async (e) => {
    e.preventDefault();
    if (!docFile) {
      setToast({
        type: 'error',
        title: 'File Required',
        message: 'Please choose a document file (PDF, JPG, PNG) to upload.'
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('document_type', docType);
      if (docRemarks.trim()) formData.append('remarks', docRemarks.trim());

      await uploadCandidateDocument(candidate.id, formData);
      setIsUploadDocOpen(false);
      setToast({
        type: 'success',
        title: 'Document Uploaded',
        message: `${docType} uploaded successfully and submitted for verification.`
      });
      loadCandidateData();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Upload Error',
        message: err.message || 'Failed to upload document.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers: Verify Document ---
  const handleOpenVerify = (doc) => {
    setSelectedDoc(doc);
    setVerifyRemarks(doc.remarks || '');
    setIsVerifyDocOpen(true);
  };

  const handleConfirmVerify = async () => {
    if (!selectedDoc) return;
    setSubmitting(true);
    try {
      await updateDocumentStatus(selectedDoc.id, {
        verification_status: 'verified',
        remarks: verifyRemarks.trim() || 'Verified by HR Administrator'
      });
      setIsVerifyDocOpen(false);
      setToast({
        type: 'success',
        title: 'Document Verified',
        message: `${selectedDoc.document_type} has been approved.`
      });
      loadCandidateData();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Verification Failed',
        message: err.message || 'Could not verify document.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers: Reject Document ---
  const handleOpenReject = (doc) => {
    setSelectedDoc(doc);
    setRejectRemarks('');
    setIsRejectDocOpen(true);
  };

  const handleConfirmReject = async () => {
    if (!selectedDoc) return;
    if (!rejectRemarks.trim()) {
      setToast({
        type: 'error',
        title: 'Remarks Required',
        message: 'Please provide clear HR remarks explaining why this document was rejected.'
      });
      return;
    }

    setSubmitting(true);
    try {
      await updateDocumentStatus(selectedDoc.id, {
        verification_status: 'rejected',
        remarks: rejectRemarks.trim()
      });
      setIsRejectDocOpen(false);
      setToast({
        type: 'info',
        title: 'Document Rejected',
        message: `${selectedDoc.document_type} marked rejected. Feedback sent to candidate.`
      });
      loadCandidateData();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Rejection Failed',
        message: err.message || 'Could not reject document.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers: Delete Document ---
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document record?')) return;
    try {
      await deleteDocument(docId);
      setToast({
        type: 'success',
        title: 'Document Deleted',
        message: 'Document record was removed.'
      });
      loadCandidateData();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete document.'
      });
    }
  };

  // --- Handlers: Joining Details ---
  const handleOpenJoining = () => {
    const existing = candidate.joining_details;
    let actualDate = '';
    if (existing?.actual_joining_date) {
      try {
        actualDate = new Date(existing.actual_joining_date).toISOString().split('T')[0];
      } catch (err) {
        console.debug('Failed to parse actual date:', err);
        actualDate = existing.actual_joining_date;
      }
    } else if (candidate.joining_date) {
      try {
        actualDate = new Date(candidate.joining_date).toISOString().split('T')[0];
      } catch (err) {
        console.debug('Failed to parse candidate date:', err);
        actualDate = candidate.joining_date;
      }
    }

    setJoiningForm({
      employee_code: existing?.employee_code || `EMP-2026-${1000 + candidate.id}`,
      official_email: existing?.official_email || `${candidate.first_name.toLowerCase()}.${candidate.last_name.toLowerCase().charAt(0)}@company.com`,
      work_location: existing?.work_location || 'Headquarters',
      employment_type: existing?.employment_type || 'full_time',
      reporting_manager: existing?.reporting_manager || '',
      salary_ctc: existing?.salary_ctc || '',
      joining_status: existing?.joining_status || 'pending',
      actual_joining_date: actualDate
    });
    setIsJoiningOpen(true);
  };

  const handleSaveJoining = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveJoiningDetails(candidate.id, joiningForm);
      setIsJoiningOpen(false);
      setToast({
        type: 'success',
        title: 'Joining Details Saved',
        message: joiningForm.joining_status === 'joined'
          ? 'Candidate marked as Officially Joined! Induction stage initiated.'
          : 'Joining credentials and logistics recorded.'
      });
      loadCandidateData();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Joining Save Error',
        message: err.message || 'Failed to save joining details.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // --- Handlers: Induction ---
  const handleOpenInduction = () => {
    const existing = candidate.induction;
    let schedDate = '';
    if (existing?.scheduled_date) {
      try {
        schedDate = new Date(existing.scheduled_date).toISOString().slice(0, 16);
      } catch (err) {
        console.debug('Failed to parse scheduled date:', err);
        schedDate = existing.scheduled_date;
      }
    }

    setInductionForm({
      session_title: existing?.session_title || 'Corporate Culture & Security Compliance',
      instructor_name: existing?.instructor_name || 'HR Operations Lead',
      scheduled_date: schedDate,
      completion_status: existing?.completion_status || 'scheduled',
      it_assets_assigned: Boolean(existing?.it_assets_assigned),
      policy_acceptance: Boolean(existing?.policy_acceptance),
      notes: existing?.notes || ''
    });
    setIsInductionOpen(true);
  };

  const handleSaveInduction = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await saveInduction(candidate.id, inductionForm);
      setIsInductionOpen(false);
      setToast({
        type: 'success',
        title: inductionForm.completion_status === 'completed' ? 'Onboarding Complete!' : 'Induction Updated',
        message: inductionForm.completion_status === 'completed'
          ? 'Induction and policy sign-off completed! Candidate is now officially onboarded.'
          : 'Induction session schedule and checklist updated.'
      });
      loadCandidateData();
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Induction Error',
        message: err.message || 'Failed to update induction.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading candidate profile & onboarding workspace..." />;
  }

  if (error || !candidate) {
    return (
      <div className="page-wrapper">
        <button 
          type="button" 
          className="btn btn-secondary btn-sm mb-4" 
          onClick={() => navigate('/candidates')}
        >
          <ArrowLeft size={16} />
          <span>Back to Candidates</span>
        </button>

        <div className="alert-banner alert-danger">
          <AlertCircle size={20} className="alert-icon" />
          <div className="alert-content">
            <strong>Candidate Not Found</strong>
            <p>{error || 'The requested candidate profile does not exist in the database.'}</p>
          </div>
        </div>
      </div>
    );
  }

  const fullName = `${candidate.first_name} ${candidate.last_name}`;
  const docsList = candidate.documents || [];
  const joining = candidate.joining_details;
  const induction = candidate.induction;

  return (
    <div className="page-wrapper candidate-details-page">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Top Navigation Row */}
      <div className="candidate-details-nav-row">
        <button 
          type="button" 
          className="btn btn-secondary btn-sm"
          onClick={() => navigate('/candidates')}
        >
          <ArrowLeft size={16} />
          <span>Back to Candidates</span>
        </button>

        <div className="candidate-header-pill-group">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={handleOpenEditProfile}
          >
            <Edit3 size={14} />
            <span>Edit Profile</span>
          </button>
          <span className="candidate-record-id">Candidate ID: #{candidate.id}</span>
          <StatusBadge status={candidate.status} />
        </div>
      </div>

      {/* Candidate Hero Card */}
      <div className="candidate-hero-card">
        <div className="candidate-hero-left">
          <div className="candidate-large-avatar">
            {candidate.first_name?.[0]}{candidate.last_name?.[0]}
          </div>
          <div>
            <h2 className="candidate-hero-name">{fullName}</h2>
            <div className="candidate-hero-sub-row">
              <span className="candidate-hero-position">
                <Briefcase size={15} />
                <span>{candidate.position}</span>
              </span>
              <span className="candidate-hero-separator">•</span>
              <span className="candidate-hero-dept">
                <Building size={15} />
                <span>{candidate.department} Department</span>
              </span>
            </div>
          </div>
        </div>

        <div className="candidate-hero-status-box">
          <div className="hero-status-label">CURRENT ONBOARDING STAGE</div>
          <div className="hero-status-val">
            <StatusBadge status={candidate.status} size="normal" />
          </div>
        </div>
      </div>

      {/* Grid: Information + Onboarding Progress */}
      <div className="candidate-details-grid mb-6">
        {/* Card 1: Candidate Information */}
        <div className="card info-card">
          <div className="card-header">
            <h3 className="card-header-title">
              <UserCheck size={18} className="header-icon-accent" />
              <span>Candidate Information</span>
            </h3>
            <button 
              type="button" 
              className="btn btn-link btn-sm" 
              onClick={handleOpenEditProfile}
            >
              Edit Details
            </button>
          </div>

          <div className="card-body">
            <div className="profile-field-list">
              <div className="profile-field-item">
                <span className="profile-field-label">Full Name</span>
                <strong className="profile-field-value">{fullName}</strong>
              </div>

              <div className="profile-field-item">
                <span className="profile-field-label">Email Address</span>
                <div className="profile-field-value field-with-icon">
                  <Mail size={15} className="cell-muted-icon" />
                  <a href={`mailto:${candidate.email}`} className="text-link">
                    {candidate.email}
                  </a>
                </div>
              </div>

              <div className="profile-field-item">
                <span className="profile-field-label">Phone Number</span>
                <div className="profile-field-value field-with-icon">
                  <Phone size={15} className="cell-muted-icon" />
                  <span>{candidate.phone || 'Not provided'}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <span className="profile-field-label">Department</span>
                <div className="profile-field-value field-with-icon">
                  <Building size={15} className="cell-muted-icon" />
                  <span>{candidate.department}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <span className="profile-field-label">Designation / Role</span>
                <div className="profile-field-value field-with-icon">
                  <Briefcase size={15} className="cell-muted-icon" />
                  <span>{candidate.position}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <span className="profile-field-label">Scheduled Joining Date</span>
                <div className="profile-field-value field-with-icon">
                  <Calendar size={15} className="cell-muted-icon" />
                  <span>{formatDate(candidate.joining_date)}</span>
                </div>
              </div>

              <div className="profile-field-item">
                <span className="profile-field-label">Current Status</span>
                <div className="profile-field-value">
                  <StatusBadge status={candidate.status} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Visual Onboarding Progress */}
        <div className="card progress-card">
          <div className="card-header">
            <h3 className="card-header-title">
              <ShieldCheck size={18} className="header-icon-accent" />
              <span>Onboarding Lifecycle Flow</span>
            </h3>
          </div>

          <div className="card-body">
            <OnboardingProgress 
              currentStatus={candidate.status} 
              mode="candidate"
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: DOCUMENTS MODULE */}
      <div className="card workspace-section-card mb-6">
        <div className="card-header">
          <div className="card-header-title">
            <FileText size={18} className="header-icon-accent" />
            <span>Submitted Documents ({docsList.length})</span>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleOpenUploadDoc}
          >
            <Upload size={14} />
            <span>Upload Document</span>
          </button>
        </div>

        <div className="card-body p-0">
          {docsList.length > 0 ? (
            <div className="table-container-responsive">
              <table className="enterprise-table">
                <thead>
                  <tr>
                    <th>Document Type</th>
                    <th>Document Name</th>
                    <th>Status</th>
                    <th>HR Remarks</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {docsList.map((doc) => (
                    <tr key={doc.id} className="table-row-hover">
                      <td>
                        <strong className="doc-type-badge">{doc.document_type}</strong>
                      </td>
                      <td>
                        <div className="doc-name-cell">
                          <FileText size={15} className="doc-file-icon" />
                          <span className="doc-file-label">{doc.document_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`doc-status-tag ${doc.verification_status}`}>
                          {doc.verification_status === 'verified' && <CheckCircle2 size={13} />}
                          {doc.verification_status === 'pending' && <Clock size={13} />}
                          {doc.verification_status === 'rejected' && <XCircle size={13} />}
                          <span>{doc.verification_status}</span>
                        </span>
                      </td>
                      <td>
                        <span className="doc-remarks-text">
                          {doc.remarks || <em className="text-muted">None</em>}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="table-action-btns-group">
                          {/* View/Download */}
                          {doc.file_url ? (
                            <a 
                              href={getDocumentFileUrl(doc.id)} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-table-action"
                              title="View Document"
                            >
                              <ExternalLink size={13} />
                              <span>View</span>
                            </a>
                          ) : (
                            <button 
                              type="button" 
                              className="btn btn-table-action"
                              onClick={() => alert(`Document metadata: ${doc.document_name} (${doc.document_type})`)}
                            >
                              <ExternalLink size={13} />
                              <span>Details</span>
                            </button>
                          )}

                          {/* Verify */}
                          <button 
                            type="button" 
                            className="btn btn-table-action btn-table-action-verify"
                            onClick={() => handleOpenVerify(doc)}
                            title="Verify document"
                          >
                            <CheckCircle2 size={13} />
                            <span>Verify</span>
                          </button>

                          {/* Reject */}
                          <button 
                            type="button" 
                            className="btn btn-table-action btn-table-action-reject"
                            onClick={() => handleOpenReject(doc)}
                            title="Reject document with feedback"
                          >
                            <XCircle size={13} />
                            <span>Reject</span>
                          </button>

                          {/* Delete */}
                          <button 
                            type="button" 
                            className="btn btn-table-action btn-table-action-delete"
                            onClick={() => handleDeleteDoc(doc.id)}
                            title="Delete document"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state-card py-6">
              <FileUp size={36} className="text-muted" />
              <h4 className="empty-state-title mt-2">No documents uploaded yet</h4>
              <p className="empty-state-desc">
                Click "Upload Document" to upload identity, education, or employment certificates for verification.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4: JOINING DETAILS MODULE */}
      <div className="card workspace-section-card mb-6">
        <div className="card-header">
          <div className="card-header-title">
            <Briefcase size={18} className="header-icon-accent" />
            <span>Joining Details</span>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleOpenJoining}
          >
            <Briefcase size={14} />
            <span>{joining ? 'Edit Joining Details' : 'Setup Joining Details'}</span>
          </button>
        </div>

        <div className="card-body">
          {joining ? (
            <div className="joining-display-grid">
              <div className="joining-field-box">
                <Hash size={18} className="joining-field-icon" />
                <div className="joining-field-text">
                  <span className="joining-field-title">Employee Code</span>
                  <span className="joining-field-desc highlight-val">{joining.employee_code || 'Pending generation'}</span>
                </div>
              </div>

              <div className="joining-field-box">
                <Mail size={18} className="joining-field-icon" />
                <div className="joining-field-text">
                  <span className="joining-field-title">Official Corporate Email</span>
                  <span className="joining-field-desc">{joining.official_email || 'Pending IT provisioning'}</span>
                </div>
              </div>

              <div className="joining-field-box">
                <Calendar size={18} className="joining-field-icon" />
                <div className="joining-field-text">
                  <span className="joining-field-title">Actual Joining Date</span>
                  <span className="joining-field-desc">{formatDate(joining.actual_joining_date || candidate.joining_date)}</span>
                </div>
              </div>

              <div className="joining-field-box">
                <Building size={18} className="joining-field-icon" />
                <div className="joining-field-text">
                  <span className="joining-field-title">Department</span>
                  <span className="joining-field-desc">{candidate.department}</span>
                </div>
              </div>

              <div className="joining-field-box">
                <Briefcase size={18} className="joining-field-icon" />
                <div className="joining-field-text">
                  <span className="joining-field-title">Designation</span>
                  <span className="joining-field-desc">{candidate.position}</span>
                </div>
              </div>

              <div className="joining-field-box">
                <UserCheck size={18} className="joining-field-icon" />
                <div className="joining-field-text">
                  <span className="joining-field-title">Reporting Manager</span>
                  <span className="joining-field-desc">{joining.reporting_manager || 'Not assigned'}</span>
                </div>
              </div>

              <div className="joining-field-box">
                <DollarSign size={18} className="joining-field-icon" />
                <div className="joining-field-text">
                  <span className="joining-field-title">Annual Salary (CTC)</span>
                  <span className="joining-field-desc">
                    {joining.salary_ctc ? `₹ ${Number(joining.salary_ctc).toLocaleString('en-IN')}` : 'Not specified'}
                  </span>
                </div>
              </div>

              <div className="joining-field-box">
                <MapPin size={18} className="joining-field-icon" />
                <div className="joining-field-text">
                  <span className="joining-field-title">Work Location</span>
                  <span className="joining-field-desc">{joining.work_location} ({joining.employment_type?.replace('_', ' ')})</span>
                </div>
              </div>

              <div className="joining-field-box">
                <ShieldCheck size={18} className="joining-field-icon" />
                <div className="joining-field-text">
                  <span className="joining-field-title">Joining Status</span>
                  <span className={`badge-pill ${joining.joining_status === 'joined' ? 'badge-pill-success' : 'badge-pill-warning'}`}>
                    {joining.joining_status === 'joined' ? 'Officially Joined' : 'Joining Pending'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="joining-empty-callout">
              <Briefcase size={36} className="callout-icon" />
              <div className="callout-body">
                <h4>Joining Details Not Configured</h4>
                <p>
                  Click "Setup Joining Details" to assign employee code, corporate email, reporting manager, and CTC offer agreement.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 5: INDUCTION & ORIENTATION MODULE */}
      <div className="card workspace-section-card">
        <div className="card-header">
          <div className="card-header-title">
            <Laptop size={18} className="header-icon-accent" />
            <span>Induction & Orientation</span>
          </div>
          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleOpenInduction}
          >
            <Calendar size={14} />
            <span>{induction ? 'Update Induction' : 'Schedule Induction'}</span>
          </button>
        </div>

        <div className="card-body">
          {induction ? (
            <div className="induction-workspace-grid">
              <div className="induction-session-summary">
                <h4 className="session-title-large">{induction.session_title}</h4>
                <div className="induction-meta-list mt-2">
                  <div>
                    <strong>Instructor:</strong> {induction.instructor_name || 'HR Operations Team'}
                  </div>
                  <div>
                    <strong>Scheduled Date:</strong> {induction.scheduled_date ? new Date(induction.scheduled_date).toLocaleString() : 'Not scheduled'}
                  </div>
                  <div>
                    <strong>Status:</strong>{' '}
                    <span className={`badge-pill ${induction.completion_status === 'completed' ? 'badge-pill-success' : 'badge-pill-info'}`}>
                      {induction.completion_status}
                    </span>
                  </div>
                </div>

                {induction.notes && (
                  <div className="induction-notes-callout mt-4">
                    <strong>Orientation Notes:</strong>
                    <p>{induction.notes}</p>
                  </div>
                )}
              </div>

              <div className="induction-checklist-card">
                <h5>Onboarding Compliance Checklist</h5>
                <ul className="compliance-checklist mt-3">
                  <li className="checklist-item">
                    {induction.it_assets_assigned ? (
                      <CheckSquare size={18} className="text-success" />
                    ) : (
                      <Square size={18} className="text-muted" />
                    )}
                    <span>IT Assets Allocated (Laptop, Peripherals, VPN)</span>
                  </li>
                  <li className="checklist-item">
                    {induction.policy_acceptance ? (
                      <CheckSquare size={18} className="text-success" />
                    ) : (
                      <Square size={18} className="text-muted" />
                    )}
                    <span>Company Policies & NDA Signed</span>
                  </li>
                  <li className="checklist-item">
                    {induction.completion_status === 'completed' ? (
                      <CheckSquare size={18} className="text-success" />
                    ) : (
                      <Square size={18} className="text-muted" />
                    )}
                    <span>HR Orientation Session Completed</span>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="joining-empty-callout">
              <Laptop size={36} className="callout-icon" />
              <div className="callout-body">
                <h4>Induction Session Not Scheduled</h4>
                <p>
                  Click "Schedule Induction" to assign an instructor, set the orientation date, and track hardware asset allocation.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: Edit Profile */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => !submitting && setIsEditProfileOpen(false)}
        title="Edit Candidate Information"
        subtitle={`Candidate ID #${candidate.id}`}
      >
        <form onSubmit={handleSaveProfile} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">First Name</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.first_name || ''}
                onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Last Name</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.last_name || ''}
                onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })}
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
                value={profileForm.email || ''}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Phone</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.phone || ''}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
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
                value={profileForm.position || ''}
                onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Department</label>
              <input
                type="text"
                className="form-control"
                value={profileForm.department || ''}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
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
                value={profileForm.joining_date || ''}
                onChange={(e) => setProfileForm({ ...profileForm, joining_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Onboarding Status</label>
              <select
                className="form-select"
                value={profileForm.status || 'selected'}
                onChange={(e) => setProfileForm({ ...profileForm, status: e.target.value })}
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
              onClick={() => setIsEditProfileOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Upload Document */}
      <Modal
        isOpen={isUploadDocOpen}
        onClose={() => !submitting && setIsUploadDocOpen(false)}
        title="Upload Verification Document"
        subtitle={`Upload document for candidate ${fullName}`}
      >
        <form onSubmit={handleUploadDocSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label required">Document Type</label>
            <select
              className="form-select"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              {DOCUMENT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label required">Select Document File</label>
            <input
              type="file"
              className="form-control"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setDocFile(e.target.files[0] || null)}
              required
            />
            <small className="form-help-text">Allowed formats: PDF, JPG, PNG (Max 10MB)</small>
          </div>

          <div className="form-group">
            <label className="form-label">Optional Remarks / Notes</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Verified copy submitted via portal"
              value={docRemarks}
              onChange={(e) => setDocRemarks(e.target.value)}
            />
          </div>

          <div className="modal-actions-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsUploadDocOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Uploading...' : 'Upload & Submit'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Verify Document */}
      <Modal
        isOpen={isVerifyDocOpen}
        onClose={() => !submitting && setIsVerifyDocOpen(false)}
        title="Approve Document Verification"
        subtitle={selectedDoc ? `${selectedDoc.document_type} - ${selectedDoc.document_name}` : ''}
        maxWidth="480px"
      >
        <div className="verify-dialog-body">
          <p className="verify-dialog-text">
            Mark this document as <strong>Verified</strong>? This confirms the certificate or identity proof satisfies HR compliance.
          </p>

          <div className="form-group mt-4">
            <label className="form-label">HR Verification Remarks (Optional)</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Identity verified successfully"
              value={verifyRemarks}
              onChange={(e) => setVerifyRemarks(e.target.value)}
            />
          </div>

          <div className="modal-actions-footer mt-6">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsVerifyDocOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-success"
              onClick={handleConfirmVerify}
              disabled={submitting}
            >
              {submitting ? 'Verifying...' : 'Mark as Verified'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 4: Reject Document */}
      <Modal
        isOpen={isRejectDocOpen}
        onClose={() => !submitting && setIsRejectDocOpen(false)}
        title="Reject Document"
        subtitle={selectedDoc ? `${selectedDoc.document_type} - ${selectedDoc.document_name}` : ''}
        maxWidth="480px"
      >
        <div className="reject-dialog-body">
          <div className="alert-banner alert-danger mb-4">
            <AlertTriangle size={18} className="alert-icon" />
            <p>
              When rejecting, HR remarks are <strong>mandatory</strong> to instruct the candidate why the document was declined.
            </p>
          </div>

          <div className="form-group">
            <label className="form-label required">Reason for Rejection</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="e.g. Degree certificate is unclear or expired. Please upload a high-resolution scanned copy."
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions-footer mt-6">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsRejectDocOpen(false)}
              disabled={submitting}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger"
              onClick={handleConfirmReject}
              disabled={submitting}
            >
              {submitting ? 'Rejecting...' : 'Reject Document'}
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL 5: Setup / Edit Joining Details */}
      <Modal
        isOpen={isJoiningOpen}
        onClose={() => !submitting && setIsJoiningOpen(false)}
        title="Official Employee Joining Details"
        subtitle={`Configure enterprise credentials for ${fullName}`}
        maxWidth="620px"
      >
        <form onSubmit={handleSaveJoining} className="modal-form">
          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Employee Code</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. EMP-2026-1042"
                value={joiningForm.employee_code}
                onChange={(e) => setJoiningForm({ ...joiningForm, employee_code: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Official Corporate Email</label>
              <input
                type="email"
                className="form-control"
                placeholder="name@company.com"
                value={joiningForm.official_email}
                onChange={(e) => setJoiningForm({ ...joiningForm, official_email: e.target.value })}
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
                placeholder="e.g. Rajesh Verma (VP Eng)"
                value={joiningForm.reporting_manager}
                onChange={(e) => setJoiningForm({ ...joiningForm, reporting_manager: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Annual CTC (Salary in INR)</label>
              <input
                type="number"
                className="form-control"
                placeholder="e.g. 1850000"
                value={joiningForm.salary_ctc}
                onChange={(e) => setJoiningForm({ ...joiningForm, salary_ctc: e.target.value })}
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
                placeholder="e.g. Bengaluru, India"
                value={joiningForm.work_location}
                onChange={(e) => setJoiningForm({ ...joiningForm, work_location: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Employment Type</label>
              <select
                className="form-select"
                value={joiningForm.employment_type}
                onChange={(e) => setJoiningForm({ ...joiningForm, employment_type: e.target.value })}
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
                value={joiningForm.actual_joining_date}
                onChange={(e) => setJoiningForm({ ...joiningForm, actual_joining_date: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Joining Confirmation Status</label>
              <select
                className="form-select"
                value={joiningForm.joining_status}
                onChange={(e) => setJoiningForm({ ...joiningForm, joining_status: e.target.value })}
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
              onClick={() => setIsJoiningOpen(false)}
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

      {/* MODAL 6: Schedule / Update Induction */}
      <Modal
        isOpen={isInductionOpen}
        onClose={() => !submitting && setIsInductionOpen(false)}
        title="Induction & Orientation Management"
        subtitle={`Session coordination for ${fullName}`}
        maxWidth="600px"
      >
        <form onSubmit={handleSaveInduction} className="modal-form">
          <div className="form-group">
            <label className="form-label required">Session Title</label>
            <input
              type="text"
              className="form-control"
              value={inductionForm.session_title}
              onChange={(e) => setInductionForm({ ...inductionForm, session_title: e.target.value })}
              required
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label required">Assigned Instructor / HR Lead</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Pooja Nair (HR Lead)"
                value={inductionForm.instructor_name}
                onChange={(e) => setInductionForm({ ...inductionForm, instructor_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label required">Scheduled Date & Time</label>
              <input
                type="datetime-local"
                className="form-control"
                value={inductionForm.scheduled_date}
                onChange={(e) => setInductionForm({ ...inductionForm, scheduled_date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Induction Progress Status</label>
            <select
              className="form-select"
              value={inductionForm.completion_status}
              onChange={(e) => setInductionForm({ ...inductionForm, completion_status: e.target.value })}
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
                checked={inductionForm.it_assets_assigned}
                onChange={(e) => setInductionForm({ ...inductionForm, it_assets_assigned: e.target.checked })}
              />
              <span>IT Assets Allocated & Handed Over (Laptop, Email & VPN credentials)</span>
            </label>

            <label className="checkbox-label mt-2">
              <input
                type="checkbox"
                checked={inductionForm.policy_acceptance}
                onChange={(e) => setInductionForm({ ...inductionForm, policy_acceptance: e.target.checked })}
              />
              <span>Company Handbook & Security Policies Formally Accepted</span>
            </label>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Orientation Notes & Feedback</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="e.g. Orientation attended enthusiastically, signed handbook copy received."
              value={inductionForm.notes}
              onChange={(e) => setInductionForm({ ...inductionForm, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsInductionOpen(false)}
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
