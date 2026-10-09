import React from 'react';

const STATUS_CONFIG = {
  selected: {
    label: 'Selected',
    bg: 'var(--badge-selected-bg, #eff6ff)',
    text: 'var(--badge-selected-text, #1d4ed8)',
    border: 'var(--badge-selected-border, #bfdbfe)',
    dot: '#3b82f6'
  },
  document_verification: {
    label: 'Document Verification',
    bg: 'var(--badge-doc-bg, #fef3c7)',
    text: 'var(--badge-doc-text, #b45309)',
    border: 'var(--badge-doc-border, #fde68a)',
    dot: '#f59e0b'
  },
  joining_pending: {
    label: 'Joining Pending',
    bg: 'var(--badge-join-bg, #f3e8ff)',
    text: 'var(--badge-join-text, #6b21a8)',
    border: 'var(--badge-join-border, #e9d5ff)',
    dot: '#9333ea'
  },
  induction_in_progress: {
    label: 'Induction In Progress',
    bg: 'var(--badge-induct-bg, #e0e7ff)',
    text: 'var(--badge-induct-text, #3730a3)',
    border: 'var(--badge-induct-border, #c7d2fe)',
    dot: '#4f46e5'
  },
  completed: {
    label: 'Completed',
    bg: 'var(--badge-comp-bg, #dcfce7)',
    text: 'var(--badge-comp-text, #15803d)',
    border: 'var(--badge-comp-border, #bbf7d0)',
    dot: '#22c55e'
  },
  rejected: {
    label: 'Rejected',
    bg: 'var(--badge-rej-bg, #fee2e2)',
    text: 'var(--badge-rej-text, #b91c1c)',
    border: 'var(--badge-rej-border, #fecaca)',
    dot: '#ef4444'
  }
};

export default function StatusBadge({ status, size = 'normal' }) {
  const config = STATUS_CONFIG[status] || {
    label: status ? status.replace(/_/g, ' ') : 'Pending',
    bg: '#f1f5f9',
    text: '#475569',
    border: '#cbd5e1',
    dot: '#94a3b8'
  };

  return (
    <span 
      className={`status-badge ${size === 'sm' ? 'status-badge-sm' : ''}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border
      }}
    >
      <span className="badge-dot" style={{ backgroundColor: config.dot }}></span>
      <span className="badge-text">{config.label}</span>
    </span>
  );
}
