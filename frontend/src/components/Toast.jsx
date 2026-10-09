import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const { type = 'success', message, title } = toast;

  return (
    <div className={`toast-notification toast-${type}`}>
      <div className="toast-icon">
        {type === 'success' && <CheckCircle2 size={18} />}
        {type === 'error' && <AlertCircle size={18} />}
        {type === 'info' && <Info size={18} />}
      </div>
      <div className="toast-content">
        {title && <strong className="toast-title">{title}</strong>}
        <p className="toast-message">{message}</p>
      </div>
      <button 
        type="button" 
        className="toast-close-btn" 
        onClick={onClose}
        aria-label="Dismiss notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}
