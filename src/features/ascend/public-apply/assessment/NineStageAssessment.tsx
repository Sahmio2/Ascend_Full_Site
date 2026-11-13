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
      'BS-01': 'No flagged medical conditions',
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
    } else {
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

                {['parq', 'imported', 'equipment', 'exercise', 'meals', 'budget', 'sleep', 'workload', 'recovery', 'emergency'].includes(q.type) && (
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
                        if (isDone || isCurrent) {
                          setCurrentStageIndex(idx);
                        }
                      }}
                    >
                      <span className="stage-bullet">{isDone ? '✓' : idx + 1}</span>
                      <span>{st.name}</span>
                    </li>
                  );
                })}
              </ol>
            </div>

            <div className="sidebar-footer">
              <small>ASCEND BY SAHMI EL · FOUNDING COHORT</small>
            </div>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .nine-assessment-wrapper {
          min-height: 100vh;
          background: #f7f5f0;
          color: #242821;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .assessment-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 28px;
          background: #fffefa;
          border-bottom: 1px solid #e5e2da;
          position: sticky;
          top: 0;
          z-index: 20;
        }
        .assessment-brand strong {
          font-family: Georgia, serif;
          font-size: 22px;
          letter-spacing: 0.15em;
          color: #171816;
        }
        .assessment-brand span {
          display: block;
          font-size: 8px;
          letter-spacing: 0.2em;
          color: #9b8156;
          font-weight: 700;
        }
        .assessment-progress-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #697066;
        }
        .assessment-progress-bar {
          width: 140px;
          height: 6px;
          background: #e2ded5;
          border-radius: 999px;
          overflow: hidden;
        }
        .assessment-progress-bar div {
          height: 100%;
          background: #a98f5a;
          transition: width 0.3s ease;
        }
        .assessment-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 340px;
          max-width: 1260px;
          margin: 0 auto;
          min-height: calc(100vh - 65px);
        }
        .assessment-main {
          padding: 36px 40px 60px;
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
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ede6d8;
          border: 1px solid #d4c6aa;
          color: #695839;
          font-weight: 800;
          font-size: 14px;
          flex-shrink: 0;
        }
        .stage-overline {
          font-size: 11px;
          letter-spacing: 0.12em;
          font-weight: 800;
          color: #9b8156;
          text-transform: uppercase;
        }
        .stage-title {
          font-family: Georgia, serif;
          font-size: 32px;
          font-weight: 400;
          margin: 4px 0 6px;
          color: #171816;
          line-height: 1.15;
        }
        .stage-desc {
          color: #626960;
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
        }
        .assessment-error-banner {
          background: #fdf2ef;
          border: 1px solid #eecbc4;
          color: #9c3325;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 22px;
          font-size: 13px;
          font-weight: 600;
        }
        .question-item-card {
          background: #fffefa;
          border: 1px solid #e1ded6;
          border-radius: 14px;
          padding: 22px 24px;
          margin-bottom: 22px;
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.02);
        }
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .question-id {
          font-size: 11px;
          font-weight: 800;
          color: #9b8156;
          letter-spacing: 0.08em;
        }
        .req-pill {
          font-size: 9px;
          font-weight: 700;
          color: #795d32;
          background: #f4ecdc;
          padding: 2px 7px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .opt-pill {
          font-size: 9px;
          font-weight: 700;
          color: #7d8479;
          background: #ebebe5;
          padding: 2px 7px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .question-prompt {
          font-size: 17px;
          font-weight: 650;
          color: #1f241d;
          line-height: 1.35;
          margin: 0 0 6px;
        }
        .question-help {
          font-size: 12.5px;
          color: #6c7368;
          line-height: 1.45;
          margin: 0 0 16px;
        }
        .choice-list, .multi-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .choice-card {
          display: flex;
          align-items: center;
          gap: 13px;
          padding: 13px 15px;
          border: 1px solid #dad6cb;
          border-radius: 9px;
          background: #fffefa;
          color: #272d24;
          font-size: 14px;
          font-weight: 550;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s ease;
        }
        .choice-card:hover {
          border-color: #b59f74;
          background: #fcf9f2;
        }
        .choice-card.active {
          border-color: #9d8252;
          background: #f8f2e4;
          color: #151814;
          box-shadow: inset 0 0 0 1px #9d8252;
        }
        .choice-dot, .choice-square {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 1.5px solid #b8b3a7;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 800;
          flex-shrink: 0;
        }
        .choice-card.active .choice-dot {
          background: #9d8252;
          border-color: #9d8252;
          color: #fff;
        }
        .choice-card.multi .choice-square {
          border-radius: 4px;
        }
        .choice-card.multi.active .choice-square {
          background: #9d8252;
          border-color: #9d8252;
          color: #fff;
        }
        .assessment-textarea {
          width: 100%;
          border: 1px solid #dcd8cf;
          border-radius: 8px;
          padding: 12px 14px;
          font-size: 14px;
          color: #242921;
          background: #fffefa;
          outline: none;
          font-family: inherit;
        }
        .assessment-textarea:focus, .assessment-input:focus {
          border-color: #9d8252;
          box-shadow: 0 0 0 2px rgba(157, 130, 82, 0.15);
        }
        .assessment-input {
          height: 44px;
          width: 100%;
          border: 1px solid #dcd8cf;
          border-radius: 8px;
          padding: 0 14px;
          font-size: 14px;
          color: #242921;
          background: #fffefa;
          outline: none;
        }
        .rating-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rating-btn {
          width: 44px;
          height: 44px;
          border-radius: 8px;
          border: 1px solid #d6d1c4;
          background: #fffefa;
          color: #2c3228;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
        }
        .rating-btn:hover {
          border-color: #b59f74;
          background: #fbf8f0;
        }
        .rating-btn.active {
          background: #9d8252;
          color: #fff;
          border-color: #9d8252;
        }
        .checks-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }
        .check-row {
          display: flex;
          gap: 11px;
          align-items: flex-start;
          font-size: 13.5px;
          color: #3b4237;
          line-height: 1.45;
          cursor: pointer;
        }
        .check-row input {
          margin-top: 2px;
          accent-color: #9d8252;
          width: 17px;
          height: 17px;
        }
        .measurement-row {
          display: flex;
          gap: 10px;
        }
        .measurement-select {
          height: 44px;
          padding: 0 14px;
          border: 1px solid #dcd8cf;
          border-radius: 8px;
          background: #fffefa;
          color: #242921;
          font-weight: 600;
          font-size: 13px;
        }
        .assessment-navigation-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          margin-top: 32px;
          padding-top: 20px;
          border-top: 1px solid #e2ded5;
        }
        .btn-gold {
          background: #171816;
          color: #fff;
          border: 1px solid #171816;
          padding: 13px 24px;
          border-radius: 8px;
          font-weight: 700;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        }
        .btn-gold:hover {
          background: #3a3a34;
        }
        .btn-secondary {
          background: transparent;
          color: #555b51;
          border: 1px solid #d2cdc2;
          padding: 13px 20px;
          border-radius: 8px;
          font-weight: 650;
          font-size: 14px;
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .btn-secondary:hover {
          background: #ebe6dc;
        }
        .assessment-sidebar {
          background: #171917;
          color: #ece7db;
          padding: 38px 30px;
          border-left: 1px solid #282c28;
        }
        .sidebar-sticky-box {
          position: sticky;
          top: 85px;
        }
        .sidebar-overline {
          font-size: 9.5px;
          letter-spacing: 0.18em;
          color: #c9af7e;
          font-weight: 800;
          display: block;
          margin-bottom: 12px;
        }
        .sidebar-title {
          font-family: Georgia, serif;
          font-size: 24px;
          margin: 0 0 10px;
          color: #fff;
          font-weight: 400;
        }
        .sidebar-copy {
          color: #aaa599;
          font-size: 13px;
          line-height: 1.6;
          margin: 0 0 28px;
        }
        .sidebar-stages-list h4 {
          font-size: 11px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #928b7e;
          margin: 0 0 12px;
        }
        .sidebar-stages-list ol {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 9px;
        }
        .sidebar-stages-list li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 12.5px;
          color: #8c877b;
          padding: 6px 8px;
          border-radius: 6px;
          cursor: default;
        }
        .sidebar-stages-list li.done {
          color: #d8d2c3;
          cursor: pointer;
        }
        .sidebar-stages-list li.done:hover {
          background: #252a25;
        }
        .sidebar-stages-list li.current {
          background: #2a2e2a;
          color: #e8c891;
          font-weight: 700;
        }
        .stage-bullet {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1px solid #4a4f48;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          flex-shrink: 0;
        }
        .sidebar-stages-list li.current .stage-bullet {
          border-color: #d6ba83;
          background: #d6ba83;
          color: #171917;
        }
        .sidebar-stages-list li.done .stage-bullet {
          border-color: #7b8e75;
          color: #a8caa0;
        }
        .sidebar-footer {
          margin-top: 36px;
          padding-top: 20px;
          border-top: 1px solid #282c28;
          color: #7b7569;
          font-size: 10px;
          letter-spacing: 0.1em;
        }
        .assessment-finished-card {
          max-width: 680px;
          margin: 60px auto;
          background: #fffefa;
          border: 1px solid #dfdbd1;
          border-radius: 16px;
          padding: 44px 40px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.04);
        }
        .finished-badge {
          display: inline-block;
          font-size: 10px;
          letter-spacing: 0.15em;
          font-weight: 800;
          color: #70582d;
          background: #f6ecdc;
          padding: 5px 12px;
          border-radius: 20px;
          margin-bottom: 16px;
        }
        .assessment-finished-card h1 {
          font-family: Georgia, serif;
          font-size: 34px;
          margin: 0 0 12px;
          color: #171816;
        }
        .finished-lede {
          font-size: 15px;
          color: #555d51;
          line-height: 1.6;
          margin: 0 0 26px;
        }
        .safety-alert-banner {
          background: #fdf5e8;
          border: 1px solid #ebd3a6;
          color: #8c5b1b;
          padding: 14px 16px;
          border-radius: 8px;
          font-size: 13px;
          line-height: 1.5;
          margin-bottom: 26px;
        }
        .stage-review-grid {
          background: #f7f5ef;
          border-radius: 10px;
          padding: 18px 20px;
          margin-bottom: 30px;
        }
        .stage-review-grid h3 {
          margin: 0 0 14px;
          font-size: 13px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #6a7165;
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
          color: #497843;
          font-weight: 800;
        }
        .stage-review-grid strong {
          color: #272d24;
        }
        .stage-review-grid small {
          color: #7e8579;
          margin-left: 4px;
        }
        .finished-actions {
          display: flex;
          gap: 12px;
        }

        @media (max-width: 900px) {
          .assessment-layout {
            grid-template-columns: 1fr;
          }
          .assessment-sidebar {
            display: none;
          }
          .assessment-main {
            padding: 24px 18px 45px;
          }
          .stage-review-grid ul {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
