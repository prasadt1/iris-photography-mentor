import { useEffect, useRef, useState } from 'react';

export function IrisMark({
  size = 48,
  color = '#f5a623',
  pupilRim = '#fbbf24',
  simple = false,
  animate = false,
  className = '',
}: {
  size?: number;
  color?: string;
  pupilRim?: string;
  simple?: boolean;
  animate?: boolean;
  className?: string;
}) {
  const C = 50;
  const R1 = 47;
  const R2 = 43;
  const Rc = 27;
  const pR = 11;
  const lines = simple ? 22 : 48;
  const fiberW = simple ? 1.1 : 0.55;
  const bladeW = simple ? 2.2 : 1.4;
  const ringW = simple ? 2.0 : 1.5;

  const t = Math.sqrt(R2 * R2 - Rc * Rc);
  const blades = Array.from({ length: 6 }, (_, i) => {
    const phi = ((60 * i) * Math.PI) / 180;
    const px = C + Rc * Math.cos(phi);
    const py = C + Rc * Math.sin(phi);
    const dx = -Math.sin(phi);
    const dy = Math.cos(phi);
    return { x1: px, y1: py, x2: px + t * dx, y2: py + t * dy };
  });

  const fibers = Array.from({ length: lines }, (_, i) => {
    const a = (i / lines) * Math.PI * 2;
    return {
      x1: C + (pR + 2) * Math.cos(a),
      y1: C + (pR + 2) * Math.sin(a),
      x2: C + (Rc - 2.5) * Math.cos(a),
      y2: C + (Rc - 2.5) * Math.sin(a),
    };
  });

  const groupRef = useRef<SVGGElement>(null);
  const [settled, setSettled] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
      setSettled(true);
      return;
    }
    const id = requestAnimationFrame(() =>
      requestAnimationFrame(() => setSettled(true)),
    );
    return () => cancelAnimationFrame(id);
  }, [animate]);

  const transform = settled ? 'rotate(0deg) scale(1)' : 'rotate(-35deg) scale(0.92)';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="Iris"
    >
      <g
        ref={groupRef}
        style={{
          transformOrigin: '50% 50%',
          transform,
          transition: 'transform 620ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <circle cx={C} cy={C} r={R1} stroke={color} strokeWidth={ringW} />
        <circle cx={C} cy={C} r={R2} stroke={color} strokeWidth={ringW * 0.7} opacity={0.75} />
        {blades.map((b, i) => (
          <line
            key={`b${i}`}
            x1={b.x1}
            y1={b.y1}
            x2={b.x2}
            y2={b.y2}
            stroke={color}
            strokeWidth={bladeW}
            strokeLinecap="round"
          />
        ))}
        <circle cx={C} cy={C} r={Rc} stroke={color} strokeWidth={bladeW} />
        {fibers.map((f, i) => (
          <line
            key={`f${i}`}
            x1={f.x1}
            y1={f.y1}
            x2={f.x2}
            y2={f.y2}
            stroke={color}
            strokeWidth={fiberW}
            strokeLinecap="round"
            opacity={0.8}
          />
        ))}
        <circle cx={C} cy={C} r={pR} fill="#0d0d0d" stroke={pupilRim} strokeWidth={bladeW} />
        <circle cx={46.7} cy={46.7} r={3.5} fill={pupilRim} />
        <circle cx={53.1} cy={49.5} r={1.5} fill={pupilRim} />
      </g>
    </svg>
  );
}
