import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

const PIPELINE_STAGES = [
  { key: 'selected', label: 'Candidate Selected', shortLabel: 'Selected' },
  { key: 'document_verification', label: 'Document Verification', shortLabel: 'Documents' },
  { key: 'joining_pending', label: 'Joining Pending', shortLabel: 'Joining' },
  { key: 'induction_in_progress', label: 'Induction In Progress', shortLabel: 'Induction' },
  { key: 'completed', label: 'Completed', shortLabel: 'Completed' }
];

export default function OnboardingProgress({ currentStatus, stageCounts, mode = 'candidate' }) {
  // If mode === 'pipeline', render horizontal pipeline with overview counts for Dashboard
  if (mode === 'pipeline') {
    return (
      <div className="onboarding-pipeline-card">
        <div className="pipeline-header">
          <div>
            <h3 className="pipeline-title">Onboarding Pipeline</h3>
            <p className="pipeline-subtitle">Real-time candidate count across lifecycle stages</p>
          </div>
          <span className="pipeline-pill">Live MySQL Data</span>
        </div>

        <div className="pipeline-steps">
          {PIPELINE_STAGES.map((stage, idx) => {
            const count = stageCounts?.[stage.key] || 0;
            const hasCandidates = count > 0;

            return (
              <React.Fragment key={stage.key}>
                <div className={`pipeline-step-node ${hasCandidates ? 'has-active' : ''}`}>
                  <div className="step-count-badge">{count}</div>
                  <div className="step-label-group">
                    <span className="step-stage-name">{stage.label}</span>
                    <span className="step-stage-sub">Stage 0{idx + 1}</span>
                  </div>
                </div>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="pipeline-connector">
                    <ArrowRight size={16} />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // Candidate individual timeline mode
  const stageKeys = PIPELINE_STAGES.map(s => s.key);
  const currentIndex = stageKeys.indexOf(currentStatus);
  const activeIndex = currentIndex === -1 ? 0 : currentIndex;

  return (
    <div className="candidate-progress-timeline">
      <h4 className="timeline-title">ONBOARDING PROGRESS</h4>
      <div className="timeline-items">
        {PIPELINE_STAGES.map((stage, idx) => {
          let state = 'upcoming'; // 'completed' | 'current' | 'upcoming'
          if (currentStatus === 'completed' || idx < activeIndex) {
            state = 'completed';
          } else if (idx === activeIndex) {
            state = 'current';
          }

          return (
            <div key={stage.key} className={`timeline-item timeline-${state}`}>
              <div className="timeline-indicator-col">
                <div className="timeline-bullet">
                  {state === 'completed' && <Check size={14} strokeWidth={3} />}
                  {state === 'current' && <span className="bullet-dot-inner"></span>}
                  {state === 'upcoming' && <span className="bullet-circle-inner"></span>}
                </div>
                {idx < PIPELINE_STAGES.length - 1 && <div className="timeline-line"></div>}
              </div>

              <div className="timeline-content">
                <div className="timeline-stage-title">
                  {stage.label}
                  {state === 'current' && <span className="stage-active-badge">Current Stage</span>}
                  {state === 'completed' && <span className="stage-done-badge">Completed</span>}
                </div>
                <div className="timeline-stage-desc">
                  {idx === 0 && 'Candidate selected and profile created in onboarding pool.'}
                  {idx === 1 && 'Collection, background review, and verification of identity & degree documents.'}
                  {idx === 2 && 'Generation of official employee code, CTC offer agreement, and joining logistics.'}
                  {idx === 3 && 'Corporate orientation, training session schedule, and IT assets allocation.'}
                  {idx === 4 && 'Policy acceptance completed, official employee profile fully activated.'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
