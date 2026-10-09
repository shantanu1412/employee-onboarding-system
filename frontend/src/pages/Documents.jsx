import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Info, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import LoadingState from '../components/LoadingState';
import { 
  getAllDocuments, 
  updateDocumentStatus, 
  deleteDocument,
  getDocumentFileUrl 
} from '../services/api';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [toast, setToast] = useState(null);

  // Modals state
  const [isVerifyOpen, setIsVerifyOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [verifyRemarks, setVerifyRemarks] = useState('');
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDocs = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await getAllDocuments(statusFilter);
      setDocuments(Array.isArray(res?.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setToast({
        type: 'error',
        title: 'Error Loading Documents',
        message: err.message || 'Failed to retrieve documents.'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  const handleOpenVerify = (doc) => {
    setSelectedDoc(doc);
    setVerifyRemarks(doc.remarks || '');
    setIsVerifyOpen(true);
  };

  const handleConfirmVerify = async () => {
    if (!selectedDoc) return;
    setSubmitting(true);
    try {
      await updateDocumentStatus(selectedDoc.id, {
        verification_status: 'verified',
        remarks: verifyRemarks.trim() || 'Verified by HR Administrator'
      });
      setIsVerifyOpen(false);
      setToast({
        type: 'success',
        title: 'Document Verified',
        message: `${selectedDoc.document_type} for ${selectedDoc.first_name} ${selectedDoc.last_name} was approved.`
      });
      fetchDocs(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Verification Error',
        message: err.message || 'Failed to verify document.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenReject = (doc) => {
    setSelectedDoc(doc);
    setRejectRemarks('');
    setIsRejectOpen(true);
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
      setIsRejectOpen(false);
      setToast({
        type: 'info',
        title: 'Document Rejected',
        message: `${selectedDoc.document_type} rejected with feedback.`
      });
      fetchDocs(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Rejection Error',
        message: err.message || 'Failed to reject document.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to delete this document record?')) return;
    try {
      await deleteDocument(docId);
      setToast({
        type: 'success',
        title: 'Document Deleted',
        message: 'Document record was removed.'
      });
      fetchDocs(true);
    } catch (err) {
      setToast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete document.'
      });
    }
  };

  return (
    <div className="page-wrapper documents-page">
      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />

      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h2 className="page-heading">Documents</h2>
          <p className="page-subheading">
            Track candidate document verification, compliance reviews, and audit trails.
          </p>
        </div>

        <div className="header-action-group">
          <button 
            type="button"
            className="btn btn-secondary"
            onClick={() => fetchDocs(true)}
            disabled={loading || refreshing}
          >
            <RefreshCw size={15} className={refreshing ? 'spinner-animation' : ''} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh List'}</span>
          </button>
        </div>
      </div>

      {/* Information Banner */}
      <div className="alert-banner alert-info">
        <Info size={20} className="alert-icon" />
        <div className="alert-content">
          <strong>Document Verification Management</strong>
          <p>
            Review submitted government IDs, academic degrees, and certificates. Verify approved documents or reject with actionable feedback for the candidate.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="document-filter-tabs mb-4">
        {['all', 'pending', 'verified', 'rejected'].map(tab => (
          <button
            key={tab}
            type="button"
            className={`btn-tab ${statusFilter === tab ? 'active' : ''}`}
            onClick={() => setStatusFilter(tab)}
          >
            <span className="capitalize">{tab === 'all' ? 'All Documents' : tab}</span>
          </button>
        ))}
      </div>

      {/* Table Card */}
      <div className="table-card">
        <div className="table-card-header">
          <h3 className="section-title">Submitted Candidate Documents</h3>
          <span className="badge-records-count">
            {documents.length} Document Record{documents.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <LoadingState message="Querying MySQL verification documents..." />
        ) : (
          <div className="table-container-responsive">
            <table className="enterprise-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Department</th>
                  <th>Document Type</th>
                  <th>Submitted File / Name</th>
                  <th>Status</th>
                  <th>HR Remarks</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <tr key={doc.id} className="table-row-hover">
                      <td>
                        <div className="candidate-full-name">
                          {doc.first_name} {doc.last_name}
                        </div>
                        <span className="candidate-id-sub">{doc.candidate_email}</span>
                      </td>
                      <td>
                        <span className="department-tag">{doc.department}</span>
                      </td>
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
                          <span className="capitalize">{doc.verification_status}</span>
                        </span>
                      </td>
                      <td>
                        <span className="doc-remarks-text">
                          {doc.remarks || <em className="text-muted">None</em>}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="table-action-btns-group">
                          {/* Safe View Link */}
                          {doc.file_url ? (
                            <a 
                              href={getDocumentFileUrl(doc.id)} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn btn-table-action"
                              title="View Document File"
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
                            title="Reject document"
                          >
                            <XCircle size={13} />
                            <span>Reject</span>
                          </button>

                          {/* Delete */}
                          <button 
                            type="button" 
                            className="btn btn-table-action btn-table-action-delete"
                            onClick={() => handleDelete(doc.id)}
                            title="Delete record"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="table-empty-cell">
                      <div className="empty-state-card py-6">
                        <FileText size={32} className="text-muted" />
                        <h4 className="empty-state-title mt-2">No documents found</h4>
                        <p className="empty-state-desc">
                          No documents matching the current status filter.
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

      {/* MODAL 1: Verify */}
      <Modal
        isOpen={isVerifyOpen}
        onClose={() => !submitting && setIsVerifyOpen(false)}
        title="Approve Document Verification"
        subtitle={selectedDoc ? `${selectedDoc.document_type} - ${selectedDoc.document_name}` : ''}
        maxWidth="480px"
      >
        <div className="verify-dialog-body">
          <p className="verify-dialog-text">
            Mark this document as <strong>Verified</strong> for candidate{' '}
            <strong>{selectedDoc?.first_name} {selectedDoc?.last_name}</strong>?
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
              onClick={() => setIsVerifyOpen(false)}
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

      {/* MODAL 2: Reject */}
      <Modal
        isOpen={isRejectOpen}
        onClose={() => !submitting && setIsRejectOpen(false)}
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
              placeholder="e.g. Certificate is blurry or incomplete. Please upload an official scanned copy."
              value={rejectRemarks}
              onChange={(e) => setRejectRemarks(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions-footer mt-6">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setIsRejectOpen(false)}
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
    </div>
  );
}
