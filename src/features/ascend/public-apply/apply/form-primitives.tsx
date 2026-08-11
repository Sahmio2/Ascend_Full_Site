import type { ReactNode, RefObject } from "react";
import AscendIcon, { type AscendIconName } from "../components/AscendIcon";
import type { ErrorMap } from "./assessment-model";

type FieldStatusProps = { required?: boolean };

export function FieldStatus({ required = false }: FieldStatusProps) {
  if (required) return null;
  return <em className="field-status">Optional</em>;
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <span className="field-error" id={id}>
      <AscendIcon name="alert" />
      <span>{message}</span>
    </span>
  );
}

type ChoiceGroupProps = {
  id: string;
  legend: string;
  options: string[];
  value: string | string[];
  onChange: (value: string) => void;
  multiple?: boolean;
  compact?: boolean;
  required?: boolean;
  helper?: string;
  error?: string;
};

export function ChoiceGroup({
  id,
  legend,
  options,
  value,
  onChange,
  multiple = false,
  compact = false,
  required = false,
  helper,
  error,
}: ChoiceGroupProps) {
  const describedBy = [helper ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;

  return (
    <fieldset
      className={`choice-fieldset ${error ? "field-invalid" : ""}`}
      id={id}
      tabIndex={-1}
      aria-describedby={describedBy}
      aria-invalid={error ? true : undefined}
      aria-required={required || undefined}
    >
      <legend><span>{legend}</span><FieldStatus required={required} /></legend>
      {helper && <p className="field-helper" id={`${id}-help`}>{helper}</p>}
      <div className={`choice-grid ${compact ? "compact-grid" : ""} ${multiple ? "choice-grid--multiple" : "choice-grid--single"}`}>
        {options.map((option) => {
          const active = multiple ? (value as string[]).includes(option) : value === option;
          return (
            <label className={active ? "choice active" : "choice"} key={option}>
              <input
                type={multiple ? "checkbox" : "radio"}
                name={multiple ? `${id}[]` : id}
                checked={active}
                onChange={() => onChange(option)}
              />
              <span className={`choice-indicator ${multiple ? "checkbox-indicator" : "radio-indicator"}`} aria-hidden="true" />
              <span className="choice-label">{option}</span>
            </label>
          );
        })}
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </fieldset>
  );
}

type TextFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  helper?: string;
  error?: string;
  type?: "text" | "email" | "tel";
  inputMode?: "text" | "email" | "tel" | "numeric" | "decimal";
  autoComplete?: string;
  placeholder?: string;
  wide?: boolean;
  rows?: number;
  maxLength?: number;
  inputWidth?: "short" | "medium";
};

export function TextField({
  id,
  label,
  value,
  onChange,
  required = false,
  helper,
  error,
  type = "text",
  inputMode,
  autoComplete,
  placeholder,
  wide = false,
  rows,
  maxLength,
  inputWidth,
}: TextFieldProps) {
  const describedBy = [helper ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ") || undefined;
  const fieldClass = `field ${wide ? "field-wide" : ""} ${rows ? "field-textarea" : ""} ${inputWidth ? `field-${inputWidth}` : ""} ${error ? "field-invalid" : ""}`;

  return (
    <div className={fieldClass}>
      <label htmlFor={id}>{label}<FieldStatus required={required} /></label>
      {helper && <small id={`${id}-help`}>{helper}</small>}
      {rows ? (
        <textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          maxLength={maxLength}
        />
      ) : (
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          maxLength={maxLength}
        />
      )}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

type UnitFieldProps = Omit<TextFieldProps, "rows" | "type" | "placeholder"> & {
  unit: string;
  example?: string;
};

export function UnitField({
  id,
  label,
  value,
  onChange,
  unit,
  example,
  required = false,
  helper,
  error,
  wide = false,
}: UnitFieldProps) {
  const describedBy = [`${id}-unit`, helper ? `${id}-help` : "", error ? `${id}-error` : ""].filter(Boolean).join(" ");
  return (
    <div className={`field ${wide ? "field-wide" : ""} ${error ? "field-invalid" : ""}`}>
      <label htmlFor={id}>{label}<FieldStatus required={required} /></label>
      {helper && <small id={`${id}-help`}>{helper}</small>}
      <div className="unit-input">
        <input
          id={id}
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={example}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
        />
        <span id={`${id}-unit`}>{unit}</span>
      </div>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

export function FieldPair({ children }: { children: ReactNode }) {
  return <div className="field-pair field-wide">{children}</div>;
}

export function ScaleField({
  id,
  label,
  value,
  onChange,
  helper,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  helper?: string;
}) {
  return (
    <div className="field range-field scale-card">
      <label htmlFor={id}>{label}<b>{value}/10</b></label>
      {helper && <small id={`${id}-help`}>{helper}</small>}
      <input id={id} type="range" min="1" max="10" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-describedby={helper ? `${id}-help` : undefined} />
      <span className="range-labels" aria-hidden="true"><i>Low</i><i>High</i></span>
    </div>
  );
}

export function ErrorSummary({ errors, summaryRef }: { errors: ErrorMap; summaryRef: RefObject<HTMLDivElement | null> }) {
  const entries = Object.entries(errors);
  if (!entries.length) return null;
  return (
    <div className="error-summary" role="alert" aria-labelledby="error-summary-title" ref={summaryRef}>
      <AscendIcon name="alert" aria-hidden="true" />
      <div>
        <h3 id="error-summary-title">Check the highlighted answer{entries.length === 1 ? "" : "s"}</h3>
        <ul>{entries.map(([id, message]) => <li key={id}><a href={`#${id}`}>{message}</a></li>)}</ul>
      </div>
    </div>
  );
}

export function InlineChoice({
  name,
  option,
  selected,
  onChange,
}: {
  name: string;
  option: string;
  selected: boolean;
  onChange: () => void;
}) {
  return (
    <label className={selected ? "inline-choice active" : "inline-choice"}>
      <input type="radio" name={name} checked={selected} onChange={onChange} />
      <span className="inline-choice-indicator" aria-hidden="true" />
      <span>{option}</span>
    </label>
  );
}

export function StepProgress({
  label,
  icon,
  percentage,
}: {
  label: string;
  icon: AscendIconName;
  percentage: number;
}) {
  const rounded = Math.round(percentage);
  return (
    <header className="intake-progress-shell">
      <p className="intake-form-eyebrow"><span>Coaching intake assessment</span><span>Required unless marked optional.</span></p>
      <div className="intake-status-bar" aria-label={`${label}, assessment ${rounded} percent complete`}>
        <span className="intake-step-icon" aria-hidden="true"><AscendIcon name={icon} /></span>
        <strong>{label}</strong>
        <span className="intake-status-percent">{rounded}%</span>
        <span className="intake-status-track" role="progressbar" aria-label="Assessment progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={rounded}>
          <i style={{ width: `${rounded}%` }} />
        </span>
      </div>
      <p className="sr-only" aria-live="polite">Now showing {label}. The assessment is {rounded} percent complete.</p>
    </header>
  );
}

export function StepActions({
  backLabel,
  onBack,
  onContinue,
  continueLabel = "Continue",
  submit = false,
  sending = false,
}: {
  backLabel: string;
  onBack: () => void;
  onContinue?: () => void;
  continueLabel?: string;
  submit?: boolean;
  sending?: boolean;
}) {
  return (
    <div className="form-actions">
      <button type="button" className="back-button" onClick={onBack}><AscendIcon name="arrow" /> {backLabel}</button>
      {submit ? (
        <button type="submit" className="button button-gold" disabled={sending}>
          {sending ? "Sending assessment…" : "Submit assessment"} <AscendIcon name="arrow-up-right" />
        </button>
      ) : (
        <button type="button" className="button button-gold" onClick={onContinue}>
          {continueLabel} <AscendIcon name="arrow" />
        </button>
      )}
    </div>
  );
}

export function ConditionalPanel({ children, id, className = "" }: { children: ReactNode; id?: string; className?: string }) {
  return <div className={`conditional-panel ${className}`} id={id}>{children}</div>;
}
