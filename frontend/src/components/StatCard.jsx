import React from 'react';

export default function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  subtitle, 
  badge,
  theme = 'blue',
  loading = false 
}) {
  return (
    <div className={`stat-card stat-card-${theme}`}>
      <div className="stat-card-top">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className={`stat-card-icon-wrapper icon-${theme}`}>
            <Icon size={20} />
          </div>
        )}
      </div>

      <div className="stat-card-body">
        {loading ? (
          <div className="stat-loading-skeleton"></div>
        ) : (
          <div className="stat-card-value">{value ?? 0}</div>
        )}
        
        {subtitle && (
          <div className="stat-card-footer">
            <span className="stat-subtitle">{subtitle}</span>
            {badge && <span className="stat-badge">{badge}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
