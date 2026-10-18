import type { NavScene } from '../types';

interface Props {
  nav: NavScene;
  heading: number;
  hl: Set<string>;
}

const AX = 180; // aircraft position
const AY = 272;
const R = 230; // pixels for the full range

/** Track-up navigation display with route (magenta), ARIA's proposal (dashed cyan) and weather radar. */
export function NavDisplay({ nav, heading, hl }: Props) {
  const k = R / nav.rangeNm;
  const px = (x: number) => AX + x * k;
  const py = (y: number) => AY - y * k;
  const routePath = [`M${AX} ${AY}`, ...nav.route.map((p) => `L${px(p.x)} ${py(p.y)}`)].join(' ');
  const proposed = nav.proposed && nav.proposed.length > 1 ? nav.proposed.map((p, i) => `${i ? 'L' : 'M'}${px(p.x)} ${py(p.y)}`).join(' ') : null;
  const wxFill = { 1: 'var(--wx1)', 2: 'var(--wx2)', 3: 'var(--wx3)' } as const;

  return (
    <svg viewBox="0 0 360 300" className={`display ${hl.has('nav') ? 'hl-display' : ''}`} role="img" aria-label="Navigation display">
      <defs>
        <clipPath id="nd-clip">
          <path d={`M${AX - R} ${AY} A${R} ${R} 0 0 1 ${AX + R} ${AY} L${AX + R} 300 L${AX - R} 300 Z`} />
        </clipPath>
        <filter id="wx-blur">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
      </defs>
      <g clipPath="url(#nd-clip)">
        {nav.weather.map((c) => (
          <g key={c.id} className={hl.has(`nav.${c.id}`) ? 'hl' : undefined} data-ref={`nav.${c.id}`}>
            <circle cx={px(c.x)} cy={py(c.y)} r={c.r * k} fill={wxFill[c.level]} opacity="0.75" filter="url(#wx-blur)" />
            {c.level === 3 && <circle cx={px(c.x)} cy={py(c.y)} r={c.r * k * 0.45} fill="var(--wx4)" opacity="0.8" filter="url(#wx-blur)" />}
            <text x={px(c.x) + c.r * k + 4} y={py(c.y) + 4} className="nd-label nd-dim">
              {c.id}
            </text>
          </g>
        ))}
        <path d={routePath} stroke="var(--magenta)" strokeWidth="2.5" fill="none" />
        {proposed && <path d={proposed} stroke="var(--cyan)" strokeWidth="2" strokeDasharray="7 6" fill="none" />}
        {nav.route.map((p) => (
          <g key={p.name}>
            <path d={`M${px(p.x)} ${py(p.y) - 6} l6 6 l-6 6 l-6 -6 z`} fill="none" stroke="var(--ink)" strokeWidth="1.5" />
            <text x={px(p.x) + 10} y={py(p.y) + 4} className="nd-label">
              {p.name}
            </text>
          </g>
        ))}
      </g>
      {/* Range arcs */}
      <path d={`M${AX - R} ${AY} A${R} ${R} 0 0 1 ${AX + R} ${AY}`} stroke="var(--ink)" strokeWidth="1" fill="none" />
      <path d={`M${AX - R / 2} ${AY} A${R / 2} ${R / 2} 0 0 1 ${AX + R / 2} ${AY}`} stroke="var(--dim)" strokeWidth="1" strokeDasharray="3 5" fill="none" />
      {/* range labels sit on the arcs at 45° left of the nose */}
      <text x={AX - (R / 2) * 0.707 - 6} y={AY - (R / 2) * 0.707} textAnchor="end" className="nd-label nd-cyan">
        {nav.rangeNm / 2}
      </text>
      <text x={AX - R * 0.707 + 4} y={AY - R * 0.707 - 6} className="nd-label nd-cyan">
        {nav.rangeNm}
      </text>
      {/* Track */}
      <text x={AX} y="22" textAnchor="middle" className="nd-head">
        TRK {String(Math.round(heading) % 360).padStart(3, '0')}
      </text>
      <line x1={AX} x2={AX} y1="30" y2="40" stroke="var(--ink)" strokeWidth="2" />
      {/* Aircraft */}
      <path d={`M${AX} ${AY - 14} L${AX - 9} ${AY + 8} L${AX} ${AY + 3} L${AX + 9} ${AY + 8} Z`} fill="none" stroke="var(--symbol)" strokeWidth="2.5" />
      {proposed && (
        <text x="350" y="292" textAnchor="end" className="nd-label nd-cyan">
          ARIA route
        </text>
      )}
    </svg>
  );
}
