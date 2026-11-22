"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
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

function isAnswered(q: Question, ans: Record<string, any>): boolean {
  const val = ans[q.id];
  if (val === undefined || val === null || val === '') return false;
  if (Array.isArray(val) && val.length === 0) return false;
  if (q.type === 'checks' && q.items) {
    return Array.isArray(val) && q.items.every((it) => val.includes(it));
  }
  if (q.type === 'measurement') {
    const num = typeof val === 'object' ? val?.value : val;
    return Boolean(num && !isNaN(Number(num)));
  }
  return true;
}

export default function NineStageAssessment({ onBackToEntrance, prefillProfile }: NineStageAssessmentProps) {
  // Current question index in the visibleQuestions array
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isStageMenuOpen, setIsStageMenuOpen] = useState(false);
  const stageMenuRef = useRef<HTMLDivElement>(null);

  const [answers, setAnswers] = useState<Record<string, any>>(() => {
    try {
      const saved = localStorage.getItem('ascend_assessment_answers');
      if (saved) return JSON.parse(saved);
    } catch {}
    // Initial answers start clean with only verified registration details imported
    return {
      'FT-01': {
        name: prefillProfile?.fullName || 'Athlete',
        email: prefillProfile?.email || 'athlete@ascend.fitness',
        whatsapp: prefillProfile?.whatsapp || '+234 800 000 0000',
        goal: prefillProfile?.goal || 'Build muscle and lose fat',
      },
    };
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close stage dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (stageMenuRef.current && !stageMenuRef.current.contains(e.target as Node)) {
        setIsStageMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load existing assessment from server if available
  useEffect(() => {
    let ignore = false;
    async function loadSavedAssessment() {
      try {
        const res = await fetch('/api/assessment');
        if (!res.ok) return;
        const data = await res.json();
        if (ignore || !data.assessment) return;

        if (
          data.assessment.status === 'SUBMITTED' ||
          data.assessment.status === 'APPROVED' ||
          data.assessment.status === 'SAFETY_HELD'
        ) {
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

  // Questions visible based on dynamic dependencies
  const visibleQuestions = useMemo(() => {
    return questions.filter((q) => isQuestionVisible(q, answers));
  }, [answers]);

  // Clamp current question index safely
  const safeIndex = Math.min(
    Math.max(0, currentQuestionIndex),
    Math.max(0, visibleQuestions.length - 1)
  );
  const currentQuestion = visibleQuestions[safeIndex] || questions[0];
  const currentStageIndex = currentQuestion ? currentQuestion.stage : 0;
  const currentStage = stages[currentStageIndex];

  const updateAnswer = (questionId: string, value: any) => {
    setAnswers((prev) => {
      const next = { ...prev, [questionId]: value };
      // When BS-02 is toggled to No, clear all downstream pain questions and BS-03
      if (questionId === 'BS-02' && value === 'No') {
        delete next['BS-02A'];
        delete next['BS-02B'];
        delete next['BS-02C'];
        delete next['BS-02D'];
        delete next['BS-02E'];
        delete next['BS-02F'];
        delete next['BS-03'];
      }
      return next;
    });
    setError(null);
  };

  const validateCurrentQuestion = (): string | null => {
    if (!currentQuestion || !currentQuestion.required) return null;
    const val = answers[currentQuestion.id];
    if (val === undefined || val === null || val === '') {
      return `Please provide an answer before continuing.`;
    }
    if (Array.isArray(val) && val.length === 0) {
      return `Please select at least one option to continue.`;
    }
    if (currentQuestion.type === 'checks' && currentQuestion.items) {
      const checked = Array.isArray(val) ? val : [];
      if (!currentQuestion.items.every((item) => checked.includes(item))) {
        return `Please confirm all required statements to proceed.`;
      }
    }
    if (currentQuestion.type === 'measurement') {
      const num = typeof val === 'object' ? val?.value : val;
      if (!num || isNaN(Number(num))) {
        return `Please enter a valid numeric measurement.`;
      }
    }
    return null;
  };

  const fillSampleAnswers = () => {
    setAnswers({
      'FT-01': {
        name: prefillProfile?.fullName || 'Athlete',
        email: prefillProfile?.email || 'athlete@ascend.fitness',
        whatsapp: prefillProfile?.whatsapp || '+234 800 000 0000',
        goal: prefillProfile?.goal || 'Build muscle and lose fat',
      },
      'FT-02': '26',
      'FT-05': [
        'I have read the ASCEND privacy notice.',
        'I understand that ASCEND coaching does not provide medical care or emergency support.',
      ],
      'BS-02': 'No',
      'BS-04': 'No',
      'BS-05': 'No',
      'BS-07': 'No',
      'FS-02': ['Chest & shoulders', 'Arms'],
      'FS-03': 'Build visible muscular definition and lose lower abdomen body fat.',
      'FS-04': { value: '178', unit: 'cm' },
      'FS-05': { value: '78', unit: 'kg' },
      'FS-06': 'Staying about the same',
      'FS-07': 'Male baseline',
      'FS-10': 'No specific date',
      'TC-01': '6 to 24 months',
      'TC-03': 'Training regularly without a written plan',
      'TC-04': 4,
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
    const err = validateCurrentQuestion();
    if (err) {
      setError(err);
      return;
    }
    setError(null);

    const isLastQuestion = safeIndex >= visibleQuestions.length - 1;
    if (!isLastQuestion) {
      setCurrentQuestionIndex(safeIndex + 1);
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
    if (safeIndex > 0) {
      setCurrentQuestionIndex(safeIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (onBackToEntrance) {
      onBackToEntrance();
    }
  };

  // Check for any safety flags across health questions
  const bs02 = answers['BS-02'];
  const bs03 = answers['BS-03'];
  const bs04 = answers['BS-04'];
  const bs05 = answers['BS-05'];
  const bs06 = answers['BS-06'];
  const bs07 = answers['BS-07'];

  const hasSafetyFlag =
    bs02 === 'Yes' ||
    bs02 === 'Unsure' ||
    (bs02 !== 'No' && (bs03 === 'Yes' || bs03 === 'Unsure')) ||
    ['Yes', 'Unsure', 'Prefer private discussion'].includes(bs04) ||
    ['Yes', 'Unsure'].includes(bs05) ||
    bs06 === 'Pregnant' ||
    ['Yes', 'Unsure', 'Prefer private discussion'].includes(bs07);

  if (isSubmitted) {
    return (
      <div className="nine-assessment-wrapper">
        <header className="assessment-topbar">
          <div className="assessment-brand">
            <Link href="/" aria-label="ASCEND home">
              <strong>ASCEND</strong>
            </Link>
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
                setCurrentQuestionIndex(0);
              }}
            >
              Review My Answers
            </button>
          </div>
        </main>
      </div>
    );
  }

  const progressPercent = Math.round(((safeIndex + 1) / visibleQuestions.length) * 100);
  const answeredCount = visibleQuestions.filter((q) => isAnswered(q, answers)).length;
  const isLastQuestion = safeIndex >= visibleQuestions.length - 1;

  return (
    <div className="nine-assessment-wrapper">
      {/* Top Bar with Brand, Progress, and Compact Top-Right Stage Indicator */}
      <header className="assessment-topbar">
        <div className="assessment-brand">
          <Link href="/" aria-label="ASCEND home">
            <strong>ASCEND</strong>
          </Link>
          <span>BY SAHMI EL</span>
        </div>

        <div className="assessment-progress-indicator">
          <span>QUESTION {safeIndex + 1} OF {visibleQuestions.length}</span>
          <div className="assessment-progress-bar">
            <div style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Compact Stage Indicator in the Top Right Corner */}
        <div className="top-right-stage-wrapper" ref={stageMenuRef}>
          <button
            type="button"
            className="stage-pill-btn"
            onClick={() => setIsStageMenuOpen((prev) => !prev)}
            aria-expanded={isStageMenuOpen}
            aria-label="Toggle stage menu"
          >
            <span className="stage-pill-kicker">STAGE {currentStageIndex + 1}/9</span>
            <span className="stage-pill-name">{currentStage.name}</span>
            <span className="stage-pill-chevron">{isStageMenuOpen ? '▲' : '▼'}</span>
          </button>

          {isStageMenuOpen && (
            <div className="stage-dropdown-menu" role="menu">
              <div className="dropdown-header">
                <strong>THE 9 STAGES</strong>
                <small>{answeredCount} of {visibleQuestions.length} answered</small>
              </div>
              <ol className="dropdown-stages-list">
                {stages.map((st, idx) => {
                  const isCurrent = idx === currentStageIndex;
                  const stageQs = visibleQuestions.filter((q) => q.stage === idx);
                  const isComplete = stageQs.length > 0 && stageQs.every((q) => !q.required || isAnswered(q, answers));
                  return (
                    <li
                      key={st.code}
                      className={`dropdown-stage-item ${isCurrent ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                      onClick={() => {
                        const targetIdx = visibleQuestions.findIndex((q) => q.stage === idx);
                        if (targetIdx !== -1) {
                          setCurrentQuestionIndex(targetIdx);
                          setIsStageMenuOpen(false);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                      }}
                      role="menuitem"
                    >
                      <span className="dropdown-stage-badge">
                        {isComplete ? '✓' : idx + 1}
                      </span>
                      <div className="dropdown-stage-info">
                        <span className="dropdown-stage-title">{st.name}</span>
                        <span className="dropdown-stage-desc">{st.short}</span>
                      </div>
                      {isCurrent && <span className="dropdown-active-dot">●</span>}
                    </li>
                  );
                })}
              </ol>
            </div>
          )}
        </div>
      </header>

      {/* Main Single-Question Layout */}
      <div className="assessment-layout">
        <main className="assessment-main">
          {error && <div className="assessment-error-banner" role="alert">{error}</div>}

          {currentQuestion && (
            <div className="single-question-container">
              {/* Stage Context Eyebrow */}
              <div className="question-stage-eyebrow">
                <span className="stage-code-pill">{currentStage.code}</span>
                <span className="stage-eyebrow-text">STAGE {currentStageIndex + 1}: {currentStage.name}</span>
              </div>

              {/* Single Question Card */}
              <div className="question-item-card">
                <div className="question-header">
                  <span className="question-id">{currentQuestion.id}</span>
                  {currentQuestion.required ? (
                    <span className="req-pill">Required</span>
                  ) : (
                    <span className="opt-pill">Optional</span>
                  )}
                </div>

                <h1 className="question-prompt">{currentQuestion.prompt}</h1>
                {currentQuestion.help && <p className="question-help">{currentQuestion.help}</p>}

                {/* Render Question Controls */}
                <div className="question-control-wrap">
                  {/* Choice (Single Select) */}
                  {currentQuestion.type === 'choice' && currentQuestion.options && (
                    <div className="choice-list">
                      {currentQuestion.options.map((opt) => {
                        const selected = answers[currentQuestion.id] === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={`choice-card ${selected ? 'active' : ''}`}
                            onClick={() => {
                              updateAnswer(currentQuestion.id, opt);
                            }}
                          >
                            <span className="choice-dot">{selected ? '✓' : ''}</span>
                            <span className="choice-label">{opt}</span>
                          </button>
                        );
                      })}

                      {/* Detail When active */}
                      {currentQuestion.detailWhen &&
                        currentQuestion.detailWhen.includes(answers[currentQuestion.id]) && (
                          <div className="detail-input-wrap">
                            <label className="detail-label">
                              {currentQuestion.detailLabel || 'Additional details:'}
                            </label>
                            <textarea
                              className="assessment-textarea"
                              rows={3}
                              placeholder="Type details here..."
                              value={answers[`${currentQuestion.id}_detail`] || ''}
                              onChange={(e) => updateAnswer(`${currentQuestion.id}_detail`, e.target.value)}
                            />
                          </div>
                        )}
                    </div>
                  )}

                  {/* Multi Select */}
                  {currentQuestion.type === 'multi' && currentQuestion.options && (
                    <div className="multi-list">
                      {currentQuestion.maxSelect && (
                        <div className="multi-limit-hint">
                          Choose up to {currentQuestion.maxSelect} options
                        </div>
                      )}
                      {currentQuestion.options.map((opt) => {
                        const currentVals: string[] = Array.isArray(answers[currentQuestion.id])
                          ? answers[currentQuestion.id]
                          : [];
                        const selected = currentVals.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            className={`choice-card multi ${selected ? 'active' : ''}`}
                            onClick={() => {
                              if (selected) {
                                updateAnswer(
                                  currentQuestion.id,
                                  currentVals.filter((v) => v !== opt)
                                );
                              } else {
                                if (currentQuestion.maxSelect && currentVals.length >= currentQuestion.maxSelect) {
                                  updateAnswer(currentQuestion.id, [...currentVals.slice(1), opt]);
                                } else {
                                  updateAnswer(currentQuestion.id, [...currentVals, opt]);
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

                  {/* Textarea */}
                  {currentQuestion.type === 'textarea' && (
                    <textarea
                      className="assessment-textarea"
                      rows={4}
                      placeholder={currentQuestion.placeholder || 'Type your answer here...'}
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                      autoFocus
                    />
                  )}

                  {/* Number Input */}
                  {currentQuestion.type === 'number' && (
                    <div className="input-with-enter">
                      <input
                        type="number"
                        className="assessment-input"
                        placeholder={currentQuestion.placeholder || '0'}
                        min={currentQuestion.min}
                        max={currentQuestion.max}
                        value={answers[currentQuestion.id] || ''}
                        onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        autoFocus
                      />
                    </div>
                  )}

                  {/* Rating 1-5 or 0-10 */}
                  {currentQuestion.type === 'rating' && (
                    <div className="rating-row-container">
                      <div className="rating-row">
                        {Array.from(
                          { length: (currentQuestion.max || 5) - (currentQuestion.min || 1) + 1 },
                          (_, idx) => (currentQuestion.min || 1) + idx
                        ).map((num) => {
                          const selected = Number(answers[currentQuestion.id]) === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              className={`rating-btn ${selected ? 'active' : ''}`}
                              onClick={() => updateAnswer(currentQuestion.id, num)}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                      {currentQuestion.labels && (
                        <div className="rating-labels-row">
                          <span>{currentQuestion.labels[0]}</span>
                          <span>{currentQuestion.labels[currentQuestion.labels.length - 1]}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Checkbox Statements */}
                  {currentQuestion.type === 'checks' && currentQuestion.items && (
                    <div className="checks-list">
                      {currentQuestion.items.map((item) => {
                        const checkedItems: string[] = Array.isArray(answers[currentQuestion.id])
                          ? answers[currentQuestion.id]
                          : [];
                        const isChecked = checkedItems.includes(item);
                        return (
                          <label key={item} className="check-row">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  updateAnswer(currentQuestion.id, [...checkedItems, item]);
                                } else {
                                  updateAnswer(
                                    currentQuestion.id,
                                    checkedItems.filter((i) => i !== item)
                                  );
                                }
                              }}
                            />
                            <span>{item}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* Measurement with Unit Switcher */}
                  {currentQuestion.type === 'measurement' && (
                    <div className="measurement-row">
                      <input
                        type="text"
                        className="assessment-input"
                        placeholder="e.g. 78 or 178"
                        value={answers[currentQuestion.id]?.value || answers[currentQuestion.id] || ''}
                        onChange={(e) => {
                          const prevUnit =
                            answers[currentQuestion.id]?.unit || (currentQuestion.id === 'FS-04' ? 'cm' : 'kg');
                          updateAnswer(currentQuestion.id, { value: e.target.value, unit: prevUnit });
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                        autoFocus
                      />
                      <select
                        className="measurement-select"
                        value={
                          answers[currentQuestion.id]?.unit || (currentQuestion.id === 'FS-04' ? 'cm' : 'kg')
                        }
                        onChange={(e) => {
                          const prevVal =
                            answers[currentQuestion.id]?.value || answers[currentQuestion.id] || '';
                          updateAnswer(currentQuestion.id, { value: prevVal, unit: e.target.value });
                        }}
                      >
                        {currentQuestion.id === 'FS-04' ? (
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

                  {/* Imported Registration Record */}
                  {currentQuestion.type === 'imported' && (
                    <div className="imported-display-card">
                      <div className="imported-row">
                        <span className="imported-label">Athlete Name</span>
                        <div className="imported-value-wrap">
                          <strong className="imported-value">
                            {prefillProfile?.fullName || 'Athlete'}
                          </strong>
                          <span className="verified-pill">✓ Confirmed</span>
                        </div>
                      </div>
                      <div className="imported-row">
                        <span className="imported-label">Account Email</span>
                        <div className="imported-value-wrap">
                          <strong className="imported-value">
                            {prefillProfile?.email ||
                              (typeof answers[currentQuestion.id] === 'object' &&
                                answers[currentQuestion.id]?.email) ||
                              answers[currentQuestion.id] ||
                              'athlete@ascend.fitness'}
                          </strong>
                          <span className="verified-pill">✓ Verified</span>
                        </div>
                      </div>
                      {prefillProfile?.whatsapp && (
                        <div className="imported-row">
                          <span className="imported-label">WhatsApp Contact</span>
                          <div className="imported-value-wrap">
                            <strong className="imported-value">{prefillProfile.whatsapp}</strong>
                          </div>
                        </div>
                      )}
                      {prefillProfile?.goal && (
                        <div className="imported-row">
                          <span className="imported-label">Primary Goal</span>
                          <div className="imported-value-wrap">
                            <strong className="imported-value">{prefillProfile.goal}</strong>
                          </div>
                        </div>
                      )}
                      {prefillProfile?.experience && (
                        <div className="imported-row">
                          <span className="imported-label">Gym Experience</span>
                          <div className="imported-value-wrap">
                            <strong className="imported-value">{prefillProfile.experience}</strong>
                          </div>
                        </div>
                      )}
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

                  {/* Specialized Open-Ended Field Inputs */}
                  {['equipment', 'exercise', 'meals', 'budget', 'sleep', 'workload', 'recovery', 'emergency'].includes(
                    currentQuestion.type
                  ) && (
                    <textarea
                      className="assessment-textarea"
                      rows={4}
                      placeholder={
                        currentQuestion.placeholder || `Provide details for ${currentQuestion.prompt.toLowerCase()}...`
                      }
                      value={
                        typeof answers[currentQuestion.id] === 'object'
                          ? JSON.stringify(answers[currentQuestion.id], null, 2)
                          : answers[currentQuestion.id] || ''
                      }
                      onChange={(e) => updateAnswer(currentQuestion.id, e.target.value)}
                    />
                  )}
                </div>

                {/* Bottom Navigation Controls for the Active Question */}
                <div className="assessment-navigation-bar">
                  <button type="button" className="btn-secondary" onClick={handleBack}>
                    ← {safeIndex === 0 ? 'Back' : 'Previous'}
                  </button>
                  <button type="button" className="btn-gold" onClick={handleNext}>
                    {isLastQuestion ? 'Submit 9-Stage Assessment' : 'Continue'} →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Discreet Footer Dev Action */}
          <div className="assessment-footer-dev">
            <button type="button" onClick={fillSampleAnswers} className="dev-fill-btn">
              ⚡ Fill Sample Answers (Dev)
            </button>
            <span className="footer-brand-copy">ASCEND BY SAHMI EL · FOUNDING COHORT</span>
          </div>
        </main>
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
          padding: 14px 28px;
          background: rgba(12, 16, 14, 0.92);
          backdrop-filter: blur(14px);
          border-bottom: 1px solid rgba(199, 164, 91, 0.2);
          position: sticky;
          top: 0;
          z-index: 50;
          gap: 16px;
        }
        .assessment-brand strong {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
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
        .assessment-tagline {
          font-size: 10px;
          letter-spacing: 0.18em;
          color: #d4b875;
          font-weight: 700;
        }
        .assessment-progress-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: #b8c0b5;
        }
        .assessment-progress-bar {
          width: 120px;
          height: 5px;
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

        /* Top-Right Stage Indicator Pill & Dropdown */
        .top-right-stage-wrapper {
          position: relative;
        }
        .stage-pill-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(199, 164, 91, 0.12);
          border: 1px solid rgba(199, 164, 91, 0.35);
          border-radius: 999px;
          padding: 6px 14px;
          color: #f7f5ed;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .stage-pill-btn:hover {
          background: rgba(199, 164, 91, 0.2);
          border-color: rgba(199, 164, 91, 0.5);
        }
        .stage-pill-kicker {
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: #dfbf77;
        }
        .stage-pill-name {
          font-size: 12px;
          font-weight: 600;
          color: #f7f5ed;
          max-width: 140px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .stage-pill-chevron {
          font-size: 9px;
          color: #dfbf77;
        }
        .stage-dropdown-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 290px;
          background: #141a17;
          border: 1px solid rgba(199, 164, 91, 0.3);
          border-radius: 12px;
          box-shadow: 0 16px 40px rgba(0, 0, 0, 0.6);
          padding: 12px;
          z-index: 60;
          backdrop-filter: blur(16px);
        }
        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 8px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          margin-bottom: 8px;
        }
        .dropdown-header strong {
          font-size: 10px;
          letter-spacing: 0.12em;
          color: #dfbf77;
        }
        .dropdown-header small {
          font-size: 11px;
          color: #9da69a;
        }
        .dropdown-stages-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 380px;
          overflow-y: auto;
        }
        .dropdown-stage-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .dropdown-stage-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .dropdown-stage-item.active {
          background: rgba(199, 164, 91, 0.15);
          border: 1px solid rgba(199, 164, 91, 0.3);
        }
        .dropdown-stage-badge {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          color: #c0c6bc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          flex-shrink: 0;
        }
        .dropdown-stage-item.complete .dropdown-stage-badge {
          background: #dfbf77;
          color: #0c100e;
        }
        .dropdown-stage-info {
          display: flex;
          flex-direction: column;
          flex: 1;
          min-width: 0;
        }
        .dropdown-stage-title {
          font-size: 12px;
          font-weight: 600;
          color: #f7f5ed;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dropdown-stage-desc {
          font-size: 10px;
          color: #8c9489;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dropdown-active-dot {
          font-size: 10px;
          color: #dfbf77;
        }

        /* Layout & Main Question Presentation */
        .assessment-layout {
          max-width: 740px;
          margin: 0 auto;
          min-height: calc(100vh - 75px);
          position: relative;
          z-index: 10;
          padding: 36px 20px 80px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .assessment-main {
          width: 100%;
        }
        .single-question-container {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .question-stage-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 2px;
        }
        .stage-code-pill {
          background: rgba(199, 164, 91, 0.2);
          border: 1px solid rgba(199, 164, 91, 0.4);
          color: #dfbf77;
          font-size: 10px;
          font-weight: 800;
          padding: 2px 7px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .stage-eyebrow-text {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.1em;
          color: #dfbf77;
          text-transform: uppercase;
        }
        .question-item-card {
          background: rgba(20, 26, 23, 0.88);
          backdrop-filter: blur(18px);
          border: 1px solid rgba(199, 164, 91, 0.25);
          border-radius: 18px;
          padding: 34px 36px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
        }
        .question-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
        }
        .question-id {
          font-size: 11px;
          font-weight: 800;
          color: #dfbf77;
          letter-spacing: 0.12em;
        }
        .req-pill {
          font-size: 9.5px;
          font-weight: 700;
          color: #dfbf77;
          background: rgba(199, 164, 91, 0.14);
          border: 1px solid rgba(199, 164, 91, 0.35);
          padding: 2px 8px;
          border-radius: 10px;
        }
        .opt-pill {
          font-size: 9.5px;
          font-weight: 600;
          color: #8c9489;
          background: rgba(255, 255, 255, 0.06);
          padding: 2px 8px;
          border-radius: 10px;
        }
        .question-prompt {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: clamp(26px, 3.2vw, 34px);
          font-weight: 500;
          line-height: 1.25;
          margin: 0 0 10px;
          color: #f7f5ed;
        }
        .question-help {
          color: #adb6a9;
          font-size: 14.5px;
          line-height: 1.6;
          margin: 0 0 24px;
        }
        .question-control-wrap {
          margin-bottom: 30px;
        }

        /* Choice Buttons */
        .choice-list, .multi-list {
          display: grid;
          gap: 11px;
        }
        .multi-limit-hint {
          font-size: 11.5px;
          color: #dfbf77;
          font-weight: 600;
          margin-bottom: 2px;
        }
        .choice-card {
          width: 100%;
          min-height: 52px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 10px;
          padding: 12px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          color: #e5e8e2;
          font-size: 15px;
          text-align: left;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .choice-card:hover {
          background: rgba(255, 255, 255, 0.07);
          border-color: rgba(199, 164, 91, 0.35);
        }
        .choice-card.active {
          background: rgba(199, 164, 91, 0.15);
          border-color: #dfbf77;
          color: #ffffff;
        }
        .choice-dot {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 1.5px solid rgba(199, 164, 91, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: #dfbf77;
          flex-shrink: 0;
        }
        .choice-card.active .choice-dot {
          border-color: #dfbf77;
          background: #dfbf77;
          color: #0c100e;
        }
        .choice-square {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          border: 1.5px solid rgba(199, 164, 91, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 800;
          color: #dfbf77;
          flex-shrink: 0;
        }
        .choice-card.active .choice-square {
          border-color: #dfbf77;
          background: #dfbf77;
          color: #0c100e;
        }
        .choice-label {
          flex: 1;
        }
        .detail-input-wrap {
          margin-top: 14px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .detail-label {
          font-size: 12px;
          color: #c8d0c4;
          font-weight: 600;
        }

        /* Inputs & Textareas */
        .assessment-input {
          width: 100%;
          min-height: 52px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 0 16px;
          color: #f7f5ed;
          font-size: 16px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .assessment-input:focus {
          border-color: #dfbf77;
          box-shadow: 0 0 0 3px rgba(223, 191, 119, 0.2);
        }
        .assessment-textarea {
          width: 100%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          padding: 14px 16px;
          color: #f7f5ed;
          font-size: 15px;
          line-height: 1.6;
          outline: none;
          resize: vertical;
          transition: border-color 0.15s ease;
        }
        .assessment-textarea:focus {
          border-color: #dfbf77;
          box-shadow: 0 0 0 3px rgba(223, 191, 119, 0.2);
        }

        /* Measurement Row */
        .measurement-row {
          display: flex;
          gap: 12px;
        }
        .measurement-select {
          min-height: 52px;
          background: #19201d;
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 10px;
          color: #dfbf77;
          padding: 0 16px;
          font-weight: 700;
          font-size: 14px;
          outline: none;
          cursor: pointer;
        }

        /* Rating Row */
        .rating-row-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .rating-row {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .rating-btn {
          flex: 1;
          min-width: 38px;
          min-height: 48px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 8px;
          color: #e5e8e2;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .rating-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(199, 164, 91, 0.4);
        }
        .rating-btn.active {
          background: #dfbf77;
          border-color: #dfbf77;
          color: #0c100e;
        }
        .rating-labels-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          color: #8c9489;
          padding: 0 2px;
        }

        /* Check Rows */
        .checks-list {
          display: grid;
          gap: 12px;
        }
        .check-row {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 14px 16px;
          cursor: pointer;
          font-size: 14.5px;
          line-height: 1.5;
          color: #e5e8e2;
        }
        .check-row input {
          width: 18px;
          height: 18px;
          margin-top: 2px;
          accent-color: #dfbf77;
          flex-shrink: 0;
        }

        /* Imported Display Card */
        .imported-display-card {
          background: rgba(199, 164, 91, 0.08);
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
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .imported-label {
          font-size: 12px;
          color: #aeb6ac;
          font-weight: 600;
        }
        .imported-value-wrap {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .imported-value {
          font-size: 13.5px;
          color: #f7f5ed;
        }
        .verified-pill {
          font-size: 10px;
          font-weight: 700;
          color: #79c8a8;
          background: rgba(121, 200, 168, 0.15);
          padding: 2px 7px;
          border-radius: 6px;
        }
        .imported-subtext {
          margin: 0;
          font-size: 12px;
          color: #8c9489;
          line-height: 1.5;
        }

        /* Navigation Bar */
        .assessment-navigation-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 14px;
          padding-top: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }
        .btn-gold {
          background: #dfbf77;
          color: #0c100e;
          border: none;
          border-radius: 9px;
          padding: 13px 28px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-gold:hover {
          background: #ebd292;
        }
        .btn-secondary {
          background: transparent;
          color: #dfbf77;
          border: 1px solid rgba(199, 164, 91, 0.4);
          border-radius: 9px;
          padding: 13px 22px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s ease;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-secondary:hover {
          background: rgba(199, 164, 91, 0.1);
        }

        /* Error Banner */
        .assessment-error-banner {
          background: rgba(156, 51, 37, 0.2);
          border: 1px solid rgba(238, 203, 196, 0.4);
          color: #ff9d91;
          padding: 14px 18px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 13.5px;
          font-weight: 600;
        }

        /* Footer Dev Tool */
        .assessment-footer-dev {
          margin-top: 36px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 4px;
        }
        .dev-fill-btn {
          background: transparent;
          color: #8c9489;
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
          transition: color 0.15s ease, border-color 0.15s ease;
        }
        .dev-fill-btn:hover {
          color: #dfbf77;
          border-color: #dfbf77;
        }
        .footer-brand-copy {
          font-size: 10px;
          letter-spacing: 0.15em;
          color: #687165;
          font-weight: 600;
        }

        /* Finished Card Screen */
        .assessment-finished-card {
          max-width: 680px;
          margin: 60px auto;
          background: rgba(20, 26, 23, 0.88);
          border: 1px solid rgba(199, 164, 91, 0.3);
          border-radius: 20px;
          padding: 40px;
          text-align: center;
          position: relative;
          z-index: 10;
          box-shadow: 0 24px 70px rgba(0, 0, 0, 0.6);
        }
        .finished-badge {
          display: inline-block;
          font-size: 10.5px;
          font-weight: 800;
          letter-spacing: 0.18em;
          color: #dfbf77;
          background: rgba(199, 164, 91, 0.15);
          border: 1px solid rgba(199, 164, 91, 0.4);
          padding: 4px 14px;
          border-radius: 999px;
          margin-bottom: 20px;
        }
        .assessment-finished-card h1 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 40px;
          font-weight: 500;
          margin: 0 0 14px;
          color: #f7f5ed;
        }
        .finished-lede {
          font-size: 16px;
          line-height: 1.6;
          color: #adb6a9;
          margin: 0 0 28px;
        }
        .safety-alert-banner {
          background: rgba(199, 164, 91, 0.12);
          border-left: 3px solid #dfbf77;
          padding: 14px 18px;
          text-align: left;
          font-size: 13.5px;
          line-height: 1.6;
          color: #f0f1ec;
          border-radius: 6px;
          margin-bottom: 28px;
        }
        .stage-review-grid {
          text-align: left;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 12px;
          padding: 20px 24px;
          margin-bottom: 32px;
        }
        .stage-review-grid h3 {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: #dfbf77;
          margin: 0 0 16px;
          text-transform: uppercase;
        }
        .stage-review-grid ul {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }
        .stage-review-grid li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13.5px;
        }
        .stage-check {
          color: #dfbf77;
          font-weight: 800;
        }
        .stage-review-grid strong {
          color: #f7f5ed;
        }
        .stage-review-grid small {
          color: #8c9489;
          margin-left: auto;
        }
        .finished-actions {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }

        @media (max-width: 640px) {
          .assessment-topbar {
            padding: 12px 16px;
          }
          .assessment-progress-indicator {
            display: none;
          }
          .stage-pill-name {
            display: none;
          }
          .question-item-card {
            padding: 24px 20px;
          }
          .assessment-finished-card {
            padding: 28px 20px;
            margin: 24px 12px;
          }
        }
      `}</style>
    </div>
  );
}
