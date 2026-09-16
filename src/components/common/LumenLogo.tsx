import React from 'react';

interface LumenLogoProps {
  className?: string;
  size?: number | string;
  variant?: 'full' | 'crest' | 'compact' | 'stacked';
  theme?: 'light' | 'dark';
  showText?: boolean;
  showTagline?: boolean;
  onClick?: () => void;
}

/**
 * Official Lumen Academy Logo
 * Displays the authentic school crest:
 * - 24 Radiating golden-yellow sunburst rays
 * - Central circular crest with snow-capped mountain peaks & winding golden road
 * - Graduation cap (mortarboard) with gold tassel at the mountain summit
 * - "LUMEN ACADEMY" bold typography with "Empowering Futures through Learning" motto
 */
export const LumenLogo: React.FC<LumenLogoProps> = ({
  className = '',
  size = 48,
  variant = 'full',
  theme = 'light',
  showText = true,
  showTagline = true,
  onClick,
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const isDark = theme === 'dark';
  const isStacked = variant === 'stacked';
  const isCrestOnly = variant === 'crest' || !showText;

  return (
    <div
      onClick={onClick}
      className={`inline-flex select-none ${
        isStacked ? 'flex-col items-center text-center gap-2' : 'items-center gap-3'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={{ minWidth: isCrestOnly ? pixelSize : undefined }}
    >
      <picture className="shrink-0">
        <source srcSet="/lumen-academy-logo.webp" type="image/webp" />
        <source srcSet="/lumen-academy-logo.png" type="image/png" />
        <img
          src="/lumen-academy-logo.svg"
          alt="Lumen Academy Crest"
          referrerPolicy="no-referrer"
          className="shrink-0 object-contain drop-shadow-xs transition-transform hover:scale-105 duration-200"
          style={{ width: pixelSize, height: pixelSize }}
        />
      </picture>

      {!isCrestOnly && (
        <div className={`flex flex-col justify-center leading-tight ${isStacked ? 'items-center' : ''}`}>
          <div className="flex items-center gap-1.5">
            <span
              className={`font-display font-extrabold tracking-tight text-base leading-none ${
                isDark ? 'text-white' : 'text-[#082b3d]'
              }`}
            >
              LUMEN <span className="text-[#f59e0b]">ACADEMY</span>
            </span>
          </div>
          {(showTagline && variant !== 'compact') && (
            <span
              className={`text-[10px] font-medium tracking-wide mt-0.5 ${
                isDark ? 'text-slate-300' : 'text-[#587282]'
              }`}
            >
              Empowering Futures through Learning
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default LumenLogo;

