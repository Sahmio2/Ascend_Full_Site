"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import styles from './NineStageAssessment.module.css';
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
  const [loadState, setLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const controller = new AbortController();
    async function loadSavedAssessment() {
      try {
        const res = await fetch('/api/assessment', { signal: controller.signal });
        if (res.status === 401 || res.status === 403) {
          window.location.replace('/account');
          return;
        }
        if (!res.ok) throw new Error('Assessment unavailable');
        const data = await res.json();
        if (controller.signal.aborted) return;

        const saved = data.answers as Record<string, unknown> | undefined;
        if (saved && Object.keys(saved).length) {
          setAnswers(previous => ({ ...previous, ...saved }));
          const next = questions.filter(q => isQuestionVisible(q, saved)).findIndex(q => !isAnswered(q, saved));
          setCurrentQuestionIndex(Math.max(0, next));
        }
        setIsSubmitted(Boolean(data.assessment?.isSubmitted));
        setLoadState('ready');
      } catch {
        if (!controller.signal.aborted) setLoadState('error');
      }
    }
    void loadSavedAssessment();
    return () => controller.abort();
  }, []);

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

  const handleNext = async () => {
    if (saving) return;
    const err = validateCurrentQuestion();
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setSaving(true);
    const isLastQuestion = safeIndex >= visibleQuestions.length - 1;

    try {
      const response = await fetch('/api/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, isSubmitted: isLastQuestion }),
      });
      if (response.status === 401 || response.status === 403) {
        window.location.replace('/account');
        return;
      }
      if (!response.ok) throw new Error('Assessment could not be saved');
      if (isLastQuestion) setIsSubmitted(true);
      else setCurrentQuestionIndex(safeIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setError('We couldn’t save your answers. Try again to continue.');
    } finally {
      setSaving(false);
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

  if (loadState !== 'ready') {
    return (
      <main className={styles.wrapper}>
        <section className="assessment-finished-card">
          <h1>Private assessment</h1>
          <p role="status">
            {loadState === 'loading' ? 'Loading your assessment…' : 'We couldn’t load your assessment. Please try again.'}
          </p>
          {loadState === 'error' && <button type="button" className="btn-gold" onClick={() => window.location.reload()}>Try again</button>}
        </section>
      </main>
    );
  }

  if (isSubmitted) {
    return (
      <div className={styles.wrapper}>
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
    <div className={styles.wrapper}>
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
                  <button type="button" className="btn-secondary" onClick={handleBack} disabled={saving}>
                    ← {safeIndex === 0 ? 'Back' : 'Previous'}
                  </button>
                  <button type="button" className="btn-gold" onClick={handleNext} disabled={saving}>
                    {saving ? 'Saving…' : isLastQuestion ? 'Submit 9-Stage Assessment' : 'Continue'} →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Discreet Footer Dev Action */}
          <div className="assessment-footer-dev">
            {process.env.NODE_ENV !== 'production' && (
              <button type="button" onClick={fillSampleAnswers} className="dev-fill-btn">
                ⚡ Fill Sample Answers (Dev)
              </button>
            )}
            <span className="footer-brand-copy">ASCEND BY SAHMI EL · FOUNDING COHORT</span>
          </div>
        </main>
      </div>
    </div>
  );
}
