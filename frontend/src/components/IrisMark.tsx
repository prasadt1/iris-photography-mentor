/**
 * Iris mark — committed aperture icon (amber circle + 6 blade lines).
 * Shared with /favicon.svg; scales cleanly in sidebar, chat, and lockups.
 */
export function IrisMark({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      fill="none"
      stroke="#f59e0b"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="Iris"
    >
      <circle cx="50" cy="50" r="42" />
      <line x1="50" y1="8" x2="66.94" y2="41.4" />
      <line x1="86.37" y1="29" x2="65.92" y2="60.38" />
      <line x1="86.37" y1="71" x2="48.97" y2="68.97" />
      <line x1="50" y1="92" x2="33.06" y2="58.6" />
      <line x1="13.63" y1="71" x2="34.08" y2="39.62" />
      <line x1="13.63" y1="29" x2="51.03" y2="31.03" />
    </svg>
  );
}
