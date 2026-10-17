import { useId } from 'react';

export function Likert({
  label,
  value,
  onChange,
  low,
  high,
  points = 7,
}: {
  label: string;
  value: number | null;
  onChange: (v: number) => void;
  low: string;
  high: string;
  points?: number;
}) {
  const name = useId();
  return (
    <fieldset className="likert">
      <legend>{label}</legend>
      <div className="likert-row">
        <span className="likert-end">{low}</span>
        {Array.from({ length: points }, (_, i) => i + 1).map((v) => (
          <label key={v} className={value === v ? 'on' : ''}>
            <input type="radio" name={name} value={v} checked={value === v} onChange={() => onChange(v)} />
            <span>{v}</span>
          </label>
        ))}
        <span className="likert-end">{high}</span>
      </div>
    </fieldset>
  );
}

export function Slider({
  label,
  hint,
  value,
  onChange,
  low,
  high,
  step = 5,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  low: string;
  high: string;
  step?: number;
}) {
  const id = useId();
  return (
    <div className="slider">
      <label htmlFor={id}>
        {label}
        {hint && <span className="slider-hint">{hint}</span>}
      </label>
      <input id={id} type="range" min={0} max={100} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <div className="slider-ends">
        <span>{low}</span>
        <output>{value}</output>
        <span>{high}</span>
      </div>
    </div>
  );
}

export function Choice({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const name = useId();
  return (
    <fieldset className="choice">
      <legend>{label}</legend>
      {options.map((o) => (
        <label key={o} className={value === o ? 'on' : ''}>
          <input type="radio" name={name} checked={value === o} onChange={() => onChange(o)} />
          {o}
        </label>
      ))}
    </fieldset>
  );
}
