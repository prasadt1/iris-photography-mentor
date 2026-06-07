import { IrisMark } from './IrisMark';
import { useThemeMode } from '../lib/ThemeContext';

/** Mark cap height ≈ 1.4× wordmark size for horizontal lockups. */
const MARK_SCALE = 1.4;

export type LogoDirection = 'current' | 'simplified' | 'typography-led';

const HORIZONTAL_PRESETS: Record<
  LogoDirection,
  { size: number; markSize?: number; fontWeight: number; gap: string; letterSpacing: string }
> = {
  current: { size: 24, fontWeight: 600, gap: '0.38em', letterSpacing: '-0.01em' },
  simplified: { size: 22, fontWeight: 600, gap: '0.44em', letterSpacing: '0.01em' },
  'typography-led': { size: 27, markSize: 20, fontWeight: 500, gap: '0.52em', letterSpacing: '0.05em' },
};

export function BrandLogo({
  size,
  variant = 'horizontal',
  direction = 'simplified',
  markSize,
  markScale = MARK_SCALE,
  extraBold = false,
  animate = false,
  className = '',
}: {
  size?: number;
  variant?: 'horizontal' | 'tittle' | 'mark';
  direction?: LogoDirection;
  markSize?: number;
  markScale?: number;
  extraBold?: boolean;
  animate?: boolean;
  className?: string;
}) {
  const theme = useThemeMode();
  const isLight = theme === 'light';
  const markColor = isLight ? '#b45309' : '#f5a623';
  const markRim = isLight ? '#b45309' : '#fbbf24';
  const textColor = isLight ? '#292524' : '#e8e0d6';
  const preset = HORIZONTAL_PRESETS[direction];

  const markProps = {
    color: markColor,
    pupilRim: markRim,
    extraBold,
    animate,
  };

  if (variant === 'mark') {
    const soloMark = markSize ?? Math.round((size ?? 28) * markScale);
    return (
      <span className={`inline-flex items-center leading-none ${className}`}>
        <IrisMark size={soloMark} {...markProps} />
        <span className="sr-only">Iris</span>
      </span>
    );
  }

  if (variant === 'tittle') {
    const tittleSize = size ?? 48;
    const mergedMarkSize = markSize ?? Math.round(tittleSize * 0.72);
    const markBottom = tittleSize * 0.6;
    const markOverhang = Math.max(0, markBottom + mergedMarkSize - tittleSize);
    const wordmarkStyle = {
      fontFamily: "'Newsreader', Georgia, serif",
      fontWeight: 600,
      fontSize: tittleSize,
      color: textColor,
      letterSpacing: '-0.01em' as const,
    };

    return (
      <span
        className={`inline-flex items-end leading-none ${className}`}
        style={{ ...wordmarkStyle, paddingTop: markOverhang }}
      >
        <span className="relative inline-block leading-none" style={{ width: `${tittleSize * 0.34}px` }}>
          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              bottom: `${markBottom}px`,
            }}
          >
            <IrisMark size={mergedMarkSize} {...markProps} />
          </span>
          <span aria-hidden>&#x131;</span>
        </span>
        <span>ris</span>
        <span className="sr-only">Iris</span>
      </span>
    );
  }

  const resolvedSize = size ?? preset.size;
  const resolvedMarkSize =
    markSize ?? preset.markSize ?? Math.round(resolvedSize * markScale);

  return (
    <span
      className={`inline-flex items-center leading-none ${className}`}
      style={{ gap: preset.gap }}
    >
      <IrisMark size={resolvedMarkSize} {...markProps} />
      <span
        style={{
          fontFamily: "'Newsreader', Georgia, serif",
          fontWeight: preset.fontWeight,
          fontSize: resolvedSize,
          color: textColor,
          letterSpacing: preset.letterSpacing,
        }}
      >
        Iris
      </span>
    </span>
  );
}
