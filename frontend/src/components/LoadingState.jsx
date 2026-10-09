import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading onboarding data...' }) {
  return (
    <div className="loading-state-wrapper">
      <div className="loading-spinner-container">
        <Loader2 className="spinner-animation" size={28} />
      </div>
      <p className="loading-state-text">{message}</p>
    </div>
  );
}
