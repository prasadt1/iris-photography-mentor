/**
 * Iris mark — approved raster (eye + mechanical aperture + tick arcs).
 * SVG blade attempts read as flower petals at sidebar size; PNG matches the comp.
 * Use srcSet for crisp rendering on retina displays.
 */
export function IrisMark({
  size = 48,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <img
      src="/iris-icon.png"
      srcSet="/iris-icon.png 1x, /iris-icon-512.png 2x"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 object-contain ${className}`}
      style={{ maxWidth: size, maxHeight: size }}
      aria-hidden
      decoding="async"
    />
  );
}
