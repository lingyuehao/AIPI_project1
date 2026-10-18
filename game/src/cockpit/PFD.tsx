import type { AircraftState } from '../types';

interface Props {
  s: AircraftState;
  hl: Set<string>;
}

const CX = 180;
const CY = 140;

export function PFD({ s, hl }: Props) {
  const horizonY = CY + s.pitch * 5;
  const speedTicks = range(Math.floor((s.ias - 40) / 10) * 10, s.ias + 40, 10).filter((v) => v >= 0);
  const altTicks = range(Math.floor((s.altitude - 2000) / 500) * 500, s.altitude + 2000, 500);
  const cls = (ref: string) => (hl.has(ref) ? 'hl' : undefined);
  const raNegative = s.radioAlt !== null && s.radioAlt !== undefined && s.radioAlt < 0;

  return (
    <svg viewBox="0 0 360 300" className="display" role="img" aria-label="Primary flight display">
      <defs>
        <clipPath id="pfd-att">
          <rect x="104" y="50" width="152" height="180" rx="10" />
        </clipPath>
        <clipPath id="pfd-spd">
          <rect x="22" y="50" width="66" height="180" />
        </clipPath>
        <clipPath id="pfd-alt">
          <rect x="272" y="50" width="70" height="180" />
        </clipPath>
      </defs>

      <g clipPath="url(#pfd-att)" data-ref="pfd.att">
        <rect x="80" y={horizonY - 400} width="200" height="400" fill="var(--sky)" />
        <rect x="80" y={horizonY} width="200" height="400" fill="var(--ground)" />
        <line x1="80" x2="280" y1={horizonY} y2={horizonY} stroke="var(--ink)" strokeWidth="1.5" />
        {[-10, -5, 5, 10, 15].map((p) => (
          <g key={p}>
            <line x1={CX - (p % 10 === 0 ? 24 : 12)} x2={CX + (p % 10 === 0 ? 24 : 12)} y1={horizonY - p * 5} y2={horizonY - p * 5} stroke="var(--ink)" strokeWidth="1" />
            {p % 10 === 0 && (
              <text x={CX + 30} y={horizonY - p * 5 + 4} className="pfd-small">
                {Math.abs(p)}
              </text>
            )}
          </g>
        ))}
      </g>
      <g stroke="var(--symbol)" strokeWidth="4" fill="none">
        <path d={`M${CX - 46} ${CY} h28 l8 8`} />
        <path d={`M${CX + 46} ${CY} h-28 l-8 8`} />
        <rect x={CX - 3} y={CY - 3} width="6" height="6" fill="var(--symbol)" stroke="none" />
      </g>

      <rect x="22" y="50" width="66" height="180" fill="var(--tape)" />
      <g clipPath="url(#pfd-spd)">
        {speedTicks.map((v) => {
          const y = CY - (v - s.ias) * 2;
          return (
            <g key={v}>
              <line x1="76" x2="88" y1={y} y2={y} stroke="var(--ink)" />
              {v % 20 === 0 && (
                <text x="70" y={y + 4} textAnchor="end" className="pfd-small">
                  {v}
                </text>
              )}
            </g>
          );
        })}
      </g>
      <g className={cls('pfd.ias')} data-ref="pfd.ias">
        <rect x="16" y={CY - 15} width="64" height="30" fill="var(--screen)" stroke="var(--ink)" />
        <text x="72" y={CY + 7} textAnchor="end" className="pfd-big">
          {Math.round(s.ias)}
        </text>
      </g>
      {s.mach !== undefined && s.altitude > 20000 && (
        <text x="55" y="250" textAnchor="middle" className="pfd-med">
          M.{Math.round(s.mach * 100)}
        </text>
      )}

      <rect x="272" y="50" width="70" height="180" fill="var(--tape)" />
      <g clipPath="url(#pfd-alt)">
        {altTicks.map((a) => {
          const y = CY - (a - s.altitude) * 0.04;
          return (
            <g key={a}>
              <line x1="272" x2="282" y1={y} y2={y} stroke="var(--ink)" />
              {a % 1000 === 0 && (
                <text x="288" y={y + 4} className="pfd-small">
                  {a}
                </text>
              )}
            </g>
          );
        })}
      </g>
      <g className={cls('pfd.alt')} data-ref="pfd.alt">
        <rect x="270" y={CY - 15} width="84" height="30" fill="var(--screen)" stroke="var(--ink)" />
        <text x="348" y={CY + 7} textAnchor="end" className="pfd-big">
          {Math.round(s.altitude)}
        </text>
      </g>
      <text x="307" y="250" textAnchor="middle" className="pfd-med" fill={s.vs < -1500 ? 'var(--amber)' : undefined}>
        {s.vs > 0 ? '+' : ''}
        {Math.round(s.vs)} fpm
      </text>

      <g className={cls('pfd.gs')} data-ref="pfd.gs">
        <text x="22" y="30" className="pfd-med">
          GS <tspan className="pfd-green">{Math.round(s.gs)}</tspan>
        </text>
      </g>

      {s.radioAlt !== null && s.radioAlt !== undefined && s.radioAlt <= 2500 && (
        <g className={cls('pfd.ra')} data-ref="pfd.ra">
          <text x={CX} y="222" textAnchor="middle" className="pfd-med" fill={raNegative ? 'var(--amber)' : 'var(--ink)'}>
            RA {Math.round(s.radioAlt)}
          </text>
        </g>
      )}

      <g data-ref="pfd.hdg">
        <rect x={CX - 40} y="262" width="80" height="26" fill="var(--screen)" stroke="var(--ink)" />
        <text x={CX} y="281" textAnchor="middle" className="pfd-med">
          {String(Math.round(s.heading) % 360).padStart(3, '0')}°
        </text>
      </g>
    </svg>
  );
}

function range(start: number, end: number, step: number) {
  const out: number[] = [];
  for (let v = start; v <= end; v += step) out.push(v);
  return out;
}
