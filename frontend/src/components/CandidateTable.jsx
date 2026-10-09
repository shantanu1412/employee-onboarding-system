import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Edit3, Trash2, Calendar, Mail, Building, Briefcase } from 'lucide-react';
import StatusBadge from './StatusBadge';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';

export default function CandidateTable({ 
  candidates = [], 
  loading = false, 
  error = null,
  onEdit = null,
  onDelete = null,
  showActions = true
}) {
  const navigate = useNavigate();

  const handleViewDetails = (candidate) => {
    navigate(`/candidates/${candidate.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not Scheduled';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getInitials = (firstName = '', lastName = '') => {
    const f = firstName ? firstName.charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.charAt(0).toUpperCase() : '';
    return f + l || 'NA';
  };

  if (loading) {
    return <LoadingState message="Loading candidates from database..." />;
  }

  if (error) {
    return (
      <div className="table-error-banner">
        <strong>Unable to load candidates</strong>
        <p>{error}</p>
      </div>
    );
  }

  if (!candidates || candidates.length === 0) {
    return (
      <EmptyState 
        title="No candidates found"
        description="There are currently no candidate records matching your criteria."
      />
    );
  }

  return (
    <div className="table-container-responsive">
      <table className="enterprise-table">
        <thead>
          <tr>
            <th>Candidate Name</th>
            <th>Email</th>
            <th>Position</th>
            <th>Department</th>
            <th>Status</th>
            <th>Joining Date</th>
            {showActions && <th className="text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const fullName = `${candidate.first_name} ${candidate.last_name}`;
            const initials = getInitials(candidate.first_name, candidate.last_name);

            return (
              <tr key={candidate.id} className="table-row-hover">
                <td>
                  <div className="candidate-name-cell">
                    <div className="candidate-avatar">
                      {initials}
                    </div>
                    <div>
                      <div className="candidate-full-name">{fullName}</div>
                      <span className="candidate-id-sub">ID: #{candidate.id}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="cell-with-icon">
                    <Mail size={14} className="cell-muted-icon" />
                    <span>{candidate.email}</span>
                  </span>
                </td>
                <td>
                  <span className="cell-with-icon">
                    <Briefcase size={14} className="cell-muted-icon" />
                    <span>{candidate.position}</span>
                  </span>
                </td>
                <td>
                  <span className="cell-with-icon">
                    <Building size={14} className="cell-muted-icon" />
                    <span className="department-tag">{candidate.department}</span>
                  </span>
                </td>
                <td>
                  <StatusBadge status={candidate.status} />
                </td>
                <td>
                  <span className="cell-with-icon">
                    <Calendar size={14} className="cell-muted-icon" />
                    <span>{formatDate(candidate.joining_date)}</span>
                  </span>
                </td>
                {showActions && (
                  <td className="text-right">
                    <div className="table-action-btns-group">
                      <button 
                        type="button"
                        className="btn btn-table-action"
                        onClick={() => handleViewDetails(candidate)}
                        title={`View full details & onboarding workspace for ${fullName}`}
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>

                      {onEdit && (
                        <button 
                          type="button"
                          className="btn btn-table-action btn-table-action-edit"
                          onClick={() => onEdit(candidate)}
                          title={`Edit ${fullName}`}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      )}

                      {onDelete && (
                        <button 
                          type="button"
                          className="btn btn-table-action btn-table-action-delete"
                          onClick={() => onDelete(candidate)}
                          title={`Delete ${fullName}`}
                        >
                          <Trash2 size={13} />
                          <span>Delete</span>
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
