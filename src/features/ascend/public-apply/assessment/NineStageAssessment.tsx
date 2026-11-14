"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { stages, questions, isQuestionVisible, type Question } from './assessmentData';

interface NineStageAssessmentProps {
  onBackToEntrance?: () => void;
  prefillProfile?: {
    fullName?: string;
    email?: string;
    whatsapp?: string;
    goal?: string;
    experience?: string;
  };
}

export default function NineStageAssessment({ onBackToEntrance, prefillProfile }: NineStageAssessmentProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('ascend_assessment_answers');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'FT-01': {
        name: prefillProfile?.fullName || 'Athlete',
        email: prefillProfile?.email || 'athlete@ascend.fitness',
        whatsapp: prefillProfile?.whatsapp || '+234 800 000 0000',
        goal: prefillProfile?.goal || 'Build muscle and lose fat',
      },
      'FT-02': '26',
      'FT-05': ['I have read the ASCEND privacy notice.', 'I understand that ASCEND coaching does not provide medical care or emergency support.'],
      'BS-02': 'No',
      'BS-03': 'No',
      'BS-04': 'No',
      'BS-05': 'No',
      'BS-07': 'No',
      'FS-04': { value: '178', unit: 'cm' },
      'FS-05': { value: '78', unit: 'kg' },
      'FS-06': 'Staying about the same',
      'FS-07': 'Male baseline',
      'FS-10': 'No specific date',
      'TC-01': '6 to 24 months',
      'TC-03': 'Training irregularly',
      'TC-04': 3,
      'TC-05': ['Busy work or study hours'],
      'GB-01': ['Monday', 'Wednesday', 'Friday'],
      'GB-02': '60 minutes',
      'GB-04': 'Mostly fixed',
      'GB-06': ['Dumbbells', 'Barbells', 'Bench', 'Cable machine'],
      'MF-03': 'Squat, Bench Press, Dumbbell Rows',
      'TR-02': 'Breakfast: Oats & boiled eggs. Lunch: Rice & grilled fish. Dinner: Eba & egusi soup.',
      'TR-04': 'Me',
      'TR-05': '₦50,000 / month',
      'TR-06': 'No',
      'TR-08': 'None',
      'TR-09': ['Stove', 'Fridge', 'Freezer'],
      'TR-11': ['Eggs', 'Fish', 'Chicken', 'Beef', 'Beans'],
      'TR-12': 'Manageable',
      'TR-13': 'Comfortable regularly',
      'RL-01': '7 hours, good sleep',
      'RL-04': 'Moderate desk job, low physical fatigue',
      'RL-06': 'Good energy most days',
      'RL-07': 'No',
      'PP-04': ['I confirm the information is accurate to the best of my knowledge.'],
    };
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing assessment from server if available
  useEffect(() => {
    let ignore = false;
    async function loadSavedAssessment() {
      try {
        const res = await fetch('/api/assessment');
        if (!res.ok) return;
        const data = await res.json();
        if (ignore || !data.assessment) return;

        if (data.assessment.status === 'SUBMITTED' || data.assessment.status === 'APPROVED' || data.assessment.status === 'SAFETY_HELD') {
          setIsSubmitted(true);
        }

        if (Array.isArray(data.assessment.stages) && data.assessment.stages.length > 0) {
          const merged: Record<string, any> = {};
          for (const s of data.assessment.stages) {
            if (s.data && typeof s.data === 'object') {
              Object.assign(merged, s.data);
            }
          }
          if (Object.keys(merged).length > 0) {
            setAnswers((prev) => ({ ...prev, ...merged }));
          }
        }
      } catch {}
    }
    loadSavedAssessment();
    return () => { ignore = true; };
  }, []);

  // Persist answers locally
  useEffect(() => {
    try {
      localStorage.setItem('ascend_assessment_answers', JSON.stringify(answers));
    } catch {}
  }, [answers]);

  const currentStage = stages[currentStageIndex];

  // Questions belonging to the current stage that are visible based on condition
  const stageQuestions = useMemo(() => {
    return questions
      .filter((q) => q.stage === currentStageIndex)
      .filter((q) => isQuestionVisible(q, answers));
  }, [currentStageIndex, answers]);

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setError(null);
  };

  const validateCurrentStage = () => {
    for (const q of stageQuestions) {
      if (q.required) {
        const val = answers[q.id];
        if (val === undefined || val === null || val === '') {
          return `Please answer: "${q.prompt}"`;
        }
        if (Array.isArray(val) && val.length === 0) {
          return `Please select at least one option for: "${q.prompt}"`;
        }
        if (q.type === 'checks' && q.items) {
          const checked = Array.isArray(val) ? val : [];
          if (!q.items.every((item) => checked.includes(item))) {
            return `Please confirm all required statements to proceed.`;
          }
        }
      }
    }
    return null;
  };

  const fillSampleAnswers = () => {
    setAnswers({
      'FT-01': {
        name: prefillProfile?.fullName || 'Athlete',
        email: prefillProfile?.email || 'athlete@ascend.fitness',
        whatsapp: '+234 800 000 0000',
        goal: 'Build muscle and lose fat',
      },
      'FT-02': '26',
      'FT-05': [
        'I have read the ASCEND privacy notice.',
        'I understand that ASCEND coaching does not provide medical care or emergency support.',
      ],
      'BS-02': 'No',
      'BS-03': 'No',
      'BS-04': 'No',
      'BS-05': 'No',
      'BS-07': 'No',
      'FS-02': 'Muscular & Lean',
      'FS-04': { value: '178', unit: 'cm' },
      'FS-05': { value: '78', unit: 'kg' },
      'FS-06': 'Staying about the same',
      'FS-07': 'Male baseline',
      'FS-10': 'No specific date',
      'TC-01': '6 to 24 months',
      'TC-03': 'Training irregularly',
      'TC-04': 3,
      'TC-05': ['Busy work or study hours'],
      'GB-01': ['Monday', 'Wednesday', 'Friday'],
      'GB-02': '60 minutes',
      'GB-04': 'Mostly fixed',
      'GB-06': ['Dumbbells', 'Barbells', 'Bench', 'Cable machine'],
      'MF-03': 'Squat, Bench Press, Dumbbell Rows',
      'TR-02': 'Breakfast: Oats & boiled eggs. Lunch: Rice & grilled fish. Dinner: Eba & egusi soup.',
      'TR-04': 'Me',
      'TR-05': '₦50,000 / month',
      'TR-06': 'No',
      'TR-08': 'None',
      'TR-09': ['Stove', 'Fridge', 'Freezer'],
      'TR-11': ['Eggs', 'Fish', 'Chicken', 'Beef', 'Beans'],
      'TR-12': 'Manageable',
      'TR-13': 'Comfortable regularly',
      'RL-01': '7 hours, good sleep',
      'RL-04': 'Moderate desk job, low physical fatigue',
      'RL-06': 'Good energy most days',
      'RL-07': 'No',
      'PP-04': ['I confirm the information is accurate to the best of my knowledge.'],
    });
    setError(null);
  };

  const handleNext = () => {
    const err = validateCurrentStage();
    if (err) {
      setError(err);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setError(null);
    if (currentStageIndex < stages.length - 1) {
      setCurrentStageIndex((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Non-blocking intermediate autosave
      try {
        fetch('/api/assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: typeof window !== 'undefined' ? window.location.origin : '',
          },
          body: JSON.stringify({ answers, isSubmitted: false }),
        }).catch(() => {});
      } catch {}
    } else {
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Final submission
      try {
        fetch('/api/assessment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: typeof window !== 'undefined' ? window.location.origin : '',
          },
          body: JSON.stringify({ answers, isSubmitted: true }),
        }).catch(() => {});
      } catch {}
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStageIndex > 0) {
      setCurrentStageIndex((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onBackToEntrance) {
      onBackToEntrance();
    }
  };

  // Check for any urgent safety flags in health stage
  const hasSafetyFlag =
    answers['BS-02'] === 'Yes' ||
    answers['BS-03'] === 'Yes' ||
    answers['BS-06'] === 'Pregnant' ||
    answers['BS-07'] === 'Yes';

  if (isSubmitted) {
    return (
      <div className="nine-assessment-wrapper">
        <header className="assessment-topbar">
          <div className="assessment-brand">
            <strong>ASCEND</strong>
            <span>BY SAHMI EL</span>
          </div>
          <div className="assessment-tagline">NINE-STAGE PRIVATE INTAKE</div>
        </header>

        <main className="assessment-finished-card">
          <div className="finished-badge">ASSESSMENT SUBMITTED</div>
          <h1>Your foundations are recorded.</h1>
          <p className="finished-lede">
            Coach Sahmi will review your 9 stages personally. Your personalised training and nutrition programme
            delivery window is within <strong>5 business days</strong>.
          </p>

          {hasSafetyFlag && (
            <div className="safety-alert-banner">
              <strong>Safety Review Notice:</strong> You indicated a previous injury, medical condition, or movement
              pain. Sahmi will conduct an individual safety audit and may ask for clarifying documentation before
              approving heavy lifting.
            </div>
          )}

          <div className="stage-review-grid">
            <h3>Completed Stages Summary</h3>
            <ul>
              {stages.map((st, i) => (
                <li key={st.code}>
                  <span className="stage-check">✓</span>
                  <strong>Stage {i + 1}: {st.name}</strong>
                  <small>{st.short}</small>
                </li>
              ))}
            </ul>
          </div>

          <div className="finished-actions">
            <Link href="/" className="btn-gold">
              Return to ASCEND Home
            </Link>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setIsSubmitted(false);
                setCurrentStageIndex(0);
              }}
            >
              Review My Answers
            </button>
          </div>
        </main>
      </div>
    );
  }

  const progressPercent = Math.round(((currentStageIndex + 1) / stages.length) * 100);

  return (
    <div className="nine-assessment-wrapper">
      <header className="assessment-topbar">
        <div className="assessment-brand">
          <Link href="/" aria-label="ASCEND home">
            <strong>ASCEND</strong>
          </Link>
          <span>BY SAHMI EL</span>
        </div>
        <div className="assessment-progress-indicator">
          <span>STAGE {currentStageIndex + 1} OF {stages.length}</span>
          <div className="assessment-progress-bar">
            <div style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </header>

      <div className="assessment-layout">
        <main className="assessment-main">
          <div className="stage-meta-strip">
            <span className="stage-number">{String(currentStageIndex + 1).padStart(2, '0')}</span>
            <div>
              <div className="stage-overline">{currentStage.code} · STAGE {currentStageIndex + 1}</div>
              <h1 className="stage-title">{currentStage.name}</h1>
              <p className="stage-desc">{currentStage.desc}</p>
            </div>
          </div>

          {error && <div className="assessment-error-banner" role="alert">{error}</div>}

          <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="questions-form">
            {stageQuestions.map((q) => (
              <div key={q.id} className="question-item-card">
                <div className="question-header">
                  <span className="question-id">{q.id}</span>
                  {q.required ? <span className="req-pill">Required</span> : <span className="opt-pill">Optional</span>}
                </div>
                <h2 className="question-prompt">{q.prompt}</h2>
                {q.help && <p className="question-help">{q.help}</p>}

                {/* Render by Question Type */}
                {q.type === 'choice' && q.options && (
                  <div className="choice-list">
                    {q.options.map((opt) => {
                      const selected = answers[q.id] === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`choice-card ${selected ? 'active' : ''}`}
                          onClick={() => updateAnswer(q.id, opt)}
                        >
                          <span className="choice-dot">{selected ? '✓' : ''}</span>
                          <span className="choice-label">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'multi' && q.options && (
                  <div className="multi-list">
                    {q.options.map((opt) => {
                      const currentVals: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                      const selected = currentVals.includes(opt);
                      return (
                        <button
                          key={opt}
                          type="button"
                          className={`choice-card multi ${selected ? 'active' : ''}`}
                          onClick={() => {
                            if (selected) {
                              updateAnswer(q.id, currentVals.filter((v) => v !== opt));
                            } else {
                              if (q.maxSelect && currentVals.length >= q.maxSelect) {
                                updateAnswer(q.id, [...currentVals.slice(1), opt]);
                              } else {
                                updateAnswer(q.id, [...currentVals, opt]);
                              }
                            }
                          }}
                        >
                          <span className="choice-square">{selected ? '✓' : ''}</span>
                          <span className="choice-label">{opt}</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'textarea' && (
                  <textarea
                    className="assessment-textarea"
                    rows={4}
                    placeholder={q.placeholder || 'Type your answer here...'}
                    value={answers[q.id] || ''}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === 'number' && (
                  <input
                    type="number"
                    className="assessment-input"
                    placeholder={q.placeholder || '0'}
                    min={q.min}
                    max={q.max}
                    value={answers[q.id] || ''}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                  />
                )}

                {q.type === 'rating' && (
                  <div className="rating-row">
                    {Array.from({ length: (q.max || 5) - (q.min || 1) + 1 }, (_, idx) => (q.min || 1) + idx).map((num) => {
                      const selected = Number(answers[q.id]) === num;
                      return (
                        <button
                          key={num}
                          type="button"
                          className={`rating-btn ${selected ? 'active' : ''}`}
                          onClick={() => updateAnswer(q.id, num)}
                        >
                          {num}
                        </button>
                      );
                    })}
                  </div>
                )}

                {q.type === 'checks' && q.items && (
                  <div className="checks-list">
                    {q.items.map((item) => {
                      const checkedItems: string[] = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                      const isChecked = checkedItems.includes(item);
                      return (
                        <label key={item} className="check-row">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                updateAnswer(q.id, [...checkedItems, item]);
                              } else {
                                updateAnswer(q.id, checkedItems.filter((i) => i !== item));
                              }
                            }}
                          />
                          <span>{item}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.type === 'measurement' && (
                  <div className="measurement-row">
                    <input
                      type="text"
                      className="assessment-input"
                      placeholder="e.g. 78 or 178"
                      value={answers[q.id]?.value || answers[q.id] || ''}
                      onChange={(e) => {
                        const prevUnit = answers[q.id]?.unit || (q.id === 'FS-04' ? 'cm' : 'kg');
                        updateAnswer(q.id, { value: e.target.value, unit: prevUnit });
                      }}
                    />
                    <select
                      className="measurement-select"
                      value={answers[q.id]?.unit || (q.id === 'FS-04' ? 'cm' : 'kg')}
                      onChange={(e) => {
                        const prevVal = answers[q.id]?.value || answers[q.id] || '';
                        updateAnswer(q.id, { value: prevVal, unit: e.target.value });
                      }}
                    >
                      {q.id === 'FS-04' ? (
                        <>
                          <option value="cm">cm</option>
                          <option value="ft/in">ft / in</option>
                        </>
                      ) : (
                        <>
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </>
                      )}
                    </select>
                  </div>
                )}

                {q.type === 'imported' && (
                  <div className="imported-display-card">
                    <div className="imported-row">
                      <span className="imported-label">Account Email</span>
                      <div className="imported-value-wrap">
                        <strong className="imported-value">
                          {prefillProfile?.email || (typeof answers[q.id] === 'object' && answers[q.id]?.email) || answers[q.id] || 'athlete@ascend.fitness'}
                        </strong>
                        <span className="verified-pill">✓ Verified</span>
                      </div>
                    </div>
                    <div className="imported-row">
                      <span className="imported-label">Registration Record</span>
                      <div className="imported-value-wrap">
                        <strong className="imported-value">Confirmed Cohort Profile</strong>
                      </div>
                    </div>
                    <div className="imported-row">
                      <span className="imported-label">Coaching Track</span>
                      <div className="imported-value-wrap">
                        <strong className="imported-value">ASCEND 1-on-1 Physique Coaching</strong>
                      </div>
                    </div>
                    <p className="imported-subtext">
                      🔒 Your registration details are verified and securely linked to your account. You will not register again.
                    </p>
                  </div>
                )}

                {['equipment', 'exercise', 'meals', 'budget', 'sleep', 'workload', 'recovery', 'emergency'].includes(q.type) && (
                  <textarea
                    className="assessment-textarea"
                    rows={3}
                    placeholder={q.placeholder || `Provide details for ${q.prompt.toLowerCase()}...`}
                    value={typeof answers[q.id] === 'object' ? JSON.stringify(answers[q.id], null, 2) : answers[q.id] || ''}
                    onChange={(e) => updateAnswer(q.id, e.target.value)}
                  />
                )}
              </div>
            ))}

            <div className="assessment-navigation-bar">
              <button type="button" className="btn-secondary" onClick={handleBack}>
                ← {currentStageIndex === 0 ? 'Back' : 'Previous Stage'}
              </button>
              <button type="submit" className="btn-gold">
                {currentStageIndex === stages.length - 1 ? 'Submit 9-Stage Assessment' : 'Continue to Stage ' + (currentStageIndex + 2)} →
              </button>
            </div>
          </form>
        </main>

        <aside className="assessment-sidebar">
          <div className="sidebar-sticky-box">
            <span className="sidebar-overline">THE ASCEND SYSTEM</span>
            <h3 className="sidebar-title">{currentStage.name}</h3>
            <p className="sidebar-copy">{currentStage.desc}</p>

            <div className="sidebar-stages-list">
              <h4>All 9 Stages</h4>
              <ol>
                {stages.map((st, idx) => {
                  const isCurrent = idx === currentStageIndex;
                  const isDone = idx < currentStageIndex;
                  return (
                    <li
                      key={st.code}
                      className={`${isCurrent ? 'current' : ''} ${isDone ? 'done' : ''}`}
                      onClick={() => {
                        setCurrentStageIndex(idx);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{ cursor: 'pointer' }}
                      title={`Jump to Stage ${idx + 1}: ${st.name}`}
                    >
                      <span className="stage-bullet">{isDone ? '✓' : idx + 1}</span>
                      <span>{st.name}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="sidebar-footer">
              <button
                type="button"
                onClick={fillSampleAnswers}
                style={{
                  background: "rgba(223, 191, 119, 0.16)",
                  color: "#dfbf77",
                  border: "1px dashed rgba(223, 191, 119, 0.5)",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "11px",
                  fontWeight: 700,
                  width: "100%",
                  cursor: "pointer",
                  marginBottom: "14px",
                  transition: "background 0.15s",
                }}
              >
                ⚡ Fill Sample Answers (Dev)
              </button>
              <small>ASCEND BY SAHMI EL · FOUNDING COHORT</small>
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .nine-assessment-wrapper {
          min-height: 100vh;
          background: radial-gradient(circle at 50% 25%, rgba(199, 164, 91, 0.12), transparent 48%),
                      radial-gradient(circle at 15% 15%, rgba(199, 164, 91, 0.06), transparent 32%),
                      #0a0d0c;
          color: #f0f1ec;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          position: relative;
          overflow-x: hidden;
        }
        .nine-assessment-wrapper::before {
          content: "";
          position: fixed;
          top: 45%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(88vw, 880px);
          aspect-ratio: 1;
          border: 1px solid rgba(199, 164, 91, 0.15);
          border-radius: 50%;
          box-shadow: 
            0 0 0 65px rgba(199, 164, 91, 0.04),
            0 0 0 135px rgba(199, 164, 91, 0.03),
            0 0 0 210px rgba(199, 164, 91, 0.02),
            0 0 0 290px rgba(199, 164, 91, 0.015),
            0 0 0 380px rgba(199, 164, 91, 0.01);
          pointer-events: none;
          z-index: 0;
        }
        .assessment-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 36px;
          background: rgba(12, 16, 14, 0.88);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(199, 164, 91, 0.2);
          position: sticky;
          top: 0;
          z-index: 30;
        }
        .assessment-brand strong {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 24px;
          letter-spacing: 0.15em;
          color: #f7f5ed;
        }
        .assessment-brand span {
          display: block;
          font-size: 8px;
          letter-spacing: 0.22em;
          color: #dfbf77;
          font-weight: 700;
        }
        .assessment-progress-indicator {
          display: flex;
          align-items: center;
          gap: 14px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #b8c0b5;
        }
        .assessment-progress-bar {
          width: 140px;
          height: 6px;
          background: rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          overflow: hidden;
        }
        .assessment-progress-bar div {
          height: 100%;
          background: linear-gradient(90deg, #c5a359, #dfbf77);
          box-shadow: 0 0 10px rgba(223, 191, 119, 0.5);
          transition: width 0.3s ease;
        }
        .assessment-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          max-width: 1220px;
          margin: 0 auto;
          min-height: calc(100vh - 65px);
          position: relative;
          z-index: 10;
          gap: 28px;
          padding: 24px 24px 60px;
        }
        .assessment-main {
          padding: 12px 0 40px;
        }
        .stage-meta-strip {
          display: flex;
          gap: 18px;
          margin-bottom: 28px;
          align-items: flex-start;
        }
        .stage-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 46px;
          height: 46px;
          border-radius: 50%;
          background: rgba(199, 164, 91, 0.16);
          border: 1px solid rgba(199, 164, 91, 0.35);
          color: #dfbf77;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }
        .stage-overline {
          font-size: 11px;
          letter-spacing: 0.14em;
          font-weight: 800;
          color: #d4b875;
          text-transform: uppercase;
        }
        .stage-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px;
          font-weight: 500;
          margin: 4px 0 6px;
          color: #f7f5ed;
          line-height: 1.15;
        }
        .stage-desc {
          color: #aeb6ac;
          font-size: 14.5px;
          line-height: 1.55;
          margin: 0;
        }
        .assessment-error-banner {
          background: rgba(156, 51, 37, 0.16);
          border: 1px solid rgba(238, 203, 196, 0.3);
          color: #ff9d91;
          padding: 13px 18px;
          border-radius: 10px;
          margin-bottom: 24px;
          font-size: 13.5px;
          font-weight: 600;
        }
        .question-item-card {
          background: rgba(20, 26, 23, 0.82);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(199, 164, 91, 0.2);
          border-radius: 16px;
          padding: 26px 28px;
          margin-bottom: 24px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
        }
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .question-id {
          font-size: 11px;
          font-weight: 800;
          color: #dfbf77;
          letter-spacing: 0.1em;
        }
        .req-pill {
          font-size: 9.5px;
          font-weight: 700;
          color: #dfbf77;
          background: rgba(199, 164, 91, 0.16);
          border: 1px solid rgba(199, 164, 91, 0.3);
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .opt-pill {
          font-size: 9.5px;
          font-weight: 700;
          color: #92998f;
          background: rgba(255, 255, 255, 0.08);
          padding: 3px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .question-prompt {
          font-size: 18px;
          font-weight: 600;
          color: #f7f5ed;
          line-height: 1.4;
          margin: 0 0 8px;
        }
        .question-help {
          font-size: 13px;
          color: #a4aca0;
          line-height: 1.5;
          margin: 0 0 18px;
        }
        .choice-list, .multi-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .choice-card {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          background: rgba(13, 17, 15, 0.8);
          color: #e2e5df;
          font-size: 14px;
          font-weight: 550;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .choice-card:hover {
          border-color: rgba(199, 164, 91, 0.6);
          background: rgba(30, 38, 33, 0.9);
        }
        .choice-card.active {
          border-color: #dfbf77;
          background: rgba(199, 164, 91, 0.18);
          color: #ffffff;
          box-shadow: inset 0 0 0 1px #dfbf77, 0 0 18px rgba(223, 191, 119, 0.18);
        }
        .choice-dot, .choice-square {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #6d7569;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .choice-card.active .choice-dot {
          background: #dfbf77;
          border-color: #dfbf77;
          color: #0c100e;
        }
        .choice-card.multi .choice-square {
          border-radius: 4px;
        }
        .choice-card.multi.active .choice-square {
          background: #dfbf77;
          border-color: #dfbf77;
          color: #0c100e;
        }
        .assessment-textarea {
          width: 100%;
          border: 1px solid rgba(199, 164, 91, 0.25);
          border-radius: 10px;
          padding: 13px 15px;
          font-size: 14.5px;
          color: #f7f5ed;
          background: rgba(11, 15, 13, 0.88);
          outline: none;
          font-family: inherit;
        }
        .assessment-textarea:focus, .assessment-input:focus {
          border-color: #dfbf77;
          box-shadow: 0 0 0 3px rgba(223, 191, 119, 0.2);
        }
        .assessment-input {
          height: 46px;
          width: 100%;
          border: 1px solid rgba(199, 164, 91, 0.25);
          border-radius: 10px;
          padding: 0 15px;
          font-size: 14.5px;
          color: #f7f5ed;
          background: rgba(11, 15, 13, 0.88);
          outline: none;
        }
        .imported-display-card {
          background: rgba(13, 17, 15, 0.85);
          border: 1px solid rgba(199, 164, 91, 0.25);
          border-radius: 12px;
          padding: 20px 22px;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .imported-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .imported-row:last-of-type {
          border-bottom: none;
          padding-bottom: 0;
        }
        .imported-label {
          font-size: 12px;
          font-weight: 600;
          color: #9ba398;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
        .imported-value-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .imported-value {
          font-size: 14px;
          color: #f7f5ed;
          font-weight: 600;
          font-family: inherit;
        }
        .verified-pill {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #dfbf77;
          background: rgba(199, 164, 91, 0.16);
          border: 1px solid rgba(199, 164, 91, 0.35);
          padding: 3px 8px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
        }
        .imported-subtext {
          font-size: 12px;
          color: #8c9489;
          margin: 4px 0 0;
          line-height: 1.5;
        }
        .rating-row {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }
        .rating-btn {
          width: 44px;
          height: 44px;
          border-radius: 9px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          background: rgba(13, 17, 15, 0.8);
          color: #dce0d9;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
        }
        .rating-btn:hover {
          border-color: #dfbf77;
          background: rgba(30, 38, 33, 0.9);
        }
        .rating-btn.active {
          background: #dfbf77;
          color: #0d110f;
          border-color: #dfbf77;
          box-shadow: 0 0 12px rgba(223, 191, 119, 0.4);
        }
        .checks-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .check-row {
          display: flex;
          gap: 12px;
          align-items: flex-start;
          font-size: 14px;
          color: #d8ddd5;
          line-height: 1.5;
          cursor: pointer;
        }
        .check-row input {
          margin-top: 3px;
          accent-color: #dfbf77;
          width: 18px;
          height: 18px;
        }
        .measurement-row {
          display: flex;
          gap: 10px;
        }
        .measurement-select {
          height: 46px;
          padding: 0 14px;
          border: 1px solid rgba(199, 164, 91, 0.25);
          border-radius: 10px;
          background: rgba(11, 15, 13, 0.88);
          color: #f7f5ed;
          font-weight: 600;
          font-size: 13px;
        }
        .assessment-navigation-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-top: 36px;
          padding-top: 24px;
          border-top: 1px solid rgba(199, 164, 91, 0.2);
        }
        .btn-gold {
          background: linear-gradient(135deg, #dfbf77 0%, #b89855 100%);
          color: #0c100e;
          border: none;
          padding: 14px 28px;
          border-radius: 10px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(223, 191, 119, 0.28);
          transition: filter 0.15s;
        }
        .btn-gold:hover {
          filter: brightness(1.1);
        }
        .btn-secondary {
          background: rgba(255, 255, 255, 0.06);
          color: #d6dbd4;
          border: 1px solid rgba(255, 255, 255, 0.18);
          padding: 14px 22px;
          border-radius: 10px;
          font-weight: 650;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.12);
        }
        .assessment-sidebar {
          background: rgba(16, 21, 19, 0.84);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(199, 164, 91, 0.18);
          border-radius: 16px;
          color: #ece7db;
          padding: 32px 26px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.45);
        }
        .sidebar-sticky-box {
          position: sticky;
          top: 95px;
        }
        .sidebar-overline {
          font-size: 9.5px;
          letter-spacing: 0.2em;
          color: #dfbf77;
          font-weight: 800;
          display: block;
          margin-bottom: 12px;
        }
        .sidebar-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          margin: 0 0 10px;
          color: #f7f5ed;
          font-weight: 500;
        }
        .sidebar-copy {
          color: #9ea69b;
          font-size: 13px;
          line-height: 1.6;
          margin: 0 0 28px;
        }
        .sidebar-stages-list h4 {
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #8c9489;
          margin: 0 0 12px;
        }
        .sidebar-stages-list ol {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .sidebar-stages-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: #828a7f;
          padding: 7px 10px;
          border-radius: 8px;
          cursor: default;
          transition: all 0.15s ease;
        }
        .sidebar-stages-list li.done {
          color: #d1d6ce;
          cursor: pointer;
        }
        .sidebar-stages-list li.done:hover {
          background: rgba(255, 255, 255, 0.06);
        }
        .sidebar-stages-list li.current {
          background: rgba(199, 164, 91, 0.18);
          color: #dfbf77;
          font-weight: 700;
        }
        .stage-bullet {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }
        .sidebar-stages-list li.current .stage-bullet {
          border-color: #dfbf77;
          background: #dfbf77;
          color: #0c100e;
          font-weight: 800;
        }
        .sidebar-stages-list li.done .stage-bullet {
          border-color: #7b8e75;
          color: #a8caa0;
        }
        .sidebar-footer {
          margin-top: 36px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          color: #7b8278;
          font-size: 10px;
          letter-spacing: 0.12em;
        }
        .assessment-finished-card {
          max-width: 680px;
          margin: 60px auto;
          background: rgba(20, 26, 23, 0.88);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(199, 164, 91, 0.24);
          border-radius: 16px;
          padding: 44px 40px;
          box-shadow: 0 18px 50px rgba(0, 0, 0, 0.5);
          color: #f7f5ed;
          position: relative;
          z-index: 10;
        }
        .finished-badge {
          display: inline-block;
          font-size: 10px;
          letter-spacing: 0.15em;
          font-weight: 800;
          color: #0c100e;
          background: #dfbf77;
          padding: 6px 14px;
          border-radius: 20px;
          margin-bottom: 16px;
        }
        .assessment-finished-card h1 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 36px;
          margin: 0 0 12px;
          color: #f7f5ed;
        }
        .finished-lede {
          font-size: 15px;
          color: #b0b8ad;
          line-height: 1.65;
          margin: 0 0 26px;
        }
        .safety-alert-banner {
          background: rgba(199, 164, 91, 0.15);
          border: 1px solid rgba(199, 164, 91, 0.35);
          color: #f2cb85;
          padding: 14px 18px;
          border-radius: 10px;
          font-size: 13.5px;
          line-height: 1.55;
          margin-bottom: 26px;
        }
        .stage-review-grid {
          background: rgba(12, 16, 14, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 20px 22px;
          margin-bottom: 30px;
        }
        .stage-review-grid h3 {
          margin: 0 0 14px;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #dfbf77;
        }
        .stage-review-grid ul {
          list-style: none;
          padding: 0;
          margin: 0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .stage-review-grid li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
        }
        .stage-check {
          color: #79c8a8;
          font-weight: 800;
        }
        .stage-review-grid strong {
          color: #f0f2ed;
        }
        .stage-review-grid small {
          color: #8c9489;
          margin-left: 4px;
        }
        .finished-actions {
          display: flex;
          gap: 12px;
        }

        @media (max-width: 900px) {
          .assessment-layout {
            grid-template-columns: 1fr;
            padding: 18px 16px 45px;
          }
          .assessment-sidebar {
            display: none;
          }
          .assessment-main {
            padding: 12px 0 35px;
          }
          .stage-review-grid ul {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
