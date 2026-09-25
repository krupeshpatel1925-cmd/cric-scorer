"use client";

import React, { useState, useEffect } from "react";

export type LogoVariant = "bat-and-ball" | "stumps-and-ball" | "crossed-bats" | "red-ball";

/* -------------------------------------------------------------
   VARIANT 1: Classic Wooden Cricket Bat & Cherry-Red Leather Ball (Default)
   ------------------------------------------------------------- */
export function ClassicCricketBatBallIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cricket Bat and Ball"
    >
      <defs>
        {/* Real English Willow Wood Gradient */}
        <linearGradient id="willowWood" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="45%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Authentic Cherry Red Leather Cricket Ball */}
        <radialGradient id="cherryRedBall" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="35%" stopColor="#dc2626" />
          <stop offset="80%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#450a0a" />
        </radialGradient>

        {/* Crisp Shadow */}
        <filter id="cricDropShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="1" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* 3 Stumps in background */}
      <g opacity="0.35" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round">
        <line x1="8" y1="12" x2="8" y2="28" />
        <line x1="12" y1="10" x2="12" y2="28" />
        <line x1="16" y1="12" x2="16" y2="28" />
        {/* Bail */}
        <line x1="6.5" y1="9.5" x2="17.5" y2="9.5" strokeWidth="2.2" />
      </g>

      {/* Cricket Bat (Tilted -38deg) */}
      <g transform="rotate(-38 22 20)" filter="url(#cricDropShadow)">
        {/* Handle with rubber grip markings */}
        <rect x="20.5" y="1" width="3" height="9" rx="1.5" fill="#f8fafc" />
        <line x1="20.5" y1="3.5" x2="23.5" y2="3.5" stroke="#94a3b8" strokeWidth="0.8" />
        <line x1="20.5" y1="6" x2="23.5" y2="6" stroke="#94a3b8" strokeWidth="0.8" />

        {/* Handle Collar / Shoulder */}
        <path d="M 19.5 9.5 L 24.5 9.5 L 25.5 12 L 18.5 12 Z" fill="#78350f" />

        {/* Willow Blade */}
        <rect x="18" y="12" width="8" height="22" rx="2" fill="url(#willowWood)" />

        {/* Bat Spine Center Ridge */}
        <line x1="22" y1="13" x2="22" y2="32" stroke="#78350f" strokeWidth="1.2" strokeLinecap="round" />

        {/* Bat Toe Guard */}
        <rect x="18" y="32" width="8" height="2" rx="1" fill="#451a03" />
      </g>

      {/* Cherry Red Cricket Ball (in foreground sweet spot) */}
      <g filter="url(#cricDropShadow)">
        <circle cx="27" cy="25" r="9.5" fill="url(#cherryRedBall)" />

        {/* Real White Cricket Seam */}
        <path
          d="M 18.5 22.5 C 22.5 25.5 29.5 26.5 35.5 27.5"
          stroke="#ffffff"
          strokeWidth="1.8"
          strokeLinecap="round"
        />

        {/* Seam Cross-Stitches */}
        <g stroke="#ffffff" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.95">
          <line x1="20" y1="24.5" x2="21.5" y2="22" />
          <line x1="23" y1="26" x2="24.5" y2="23.5" />
          <line x1="26" y1="27.5" x2="27.5" y2="25" />
          <line x1="29" y1="28.5" x2="30.5" y2="26" />
          <line x1="32" y1="29" x2="33.5" y2="26.5" />
        </g>

        {/* Sunlight Highlight Glint */}
        <circle cx="23.5" cy="21.5" r="1.8" fill="#ffffff" fillOpacity="0.75" />
      </g>
    </svg>
  );
}

/* -------------------------------------------------------------
   VARIANT 2: 3 Wickets & Flying Bail with Red Cricket Ball
   ------------------------------------------------------------- */
export function StumpsAndBallIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Cricket Wickets and Ball"
    >
      <defs>
        <radialGradient id="redBall2" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="40%" stopColor="#dc2626" />
          <stop offset="85%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#450a0a" />
        </radialGradient>
      </defs>

      {/* 3 Wooden Stumps */}
      <rect x="10" y="10" width="3.5" height="23" rx="1.7" fill="#fef08a" stroke="#b45309" strokeWidth="0.8" />
      <rect x="17" y="8" width="3.5" height="25" rx="1.7" fill="#fef08a" stroke="#b45309" strokeWidth="0.8" />
      <rect x="24" y="10" width="3.5" height="23" rx="1.7" fill="#fef08a" stroke="#b45309" strokeWidth="0.8" />

      {/* Resting Bails */}
      <rect x="9" y="6.5" width="9.5" height="2.5" rx="1" fill="#f59e0b" stroke="#78350f" strokeWidth="0.6" />
      <rect x="18.5" y="6.5" width="9.5" height="2.5" rx="1" fill="#f59e0b" stroke="#78350f" strokeWidth="0.6" />

      {/* Red Cricket Ball in foreground */}
      <circle cx="28" cy="26" r="9" fill="url(#redBall2)" stroke="#ffffff" strokeWidth="0.8" />
      <path
        d="M 20 23 C 24 26 31 27 36 29"
        stroke="#ffffff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <circle cx="25" cy="22.5" r="1.5" fill="#ffffff" fillOpacity="0.8" />
    </svg>
  );
}

/* -------------------------------------------------------------
   VARIANT 3: Crossed Cricket Bats Crest
   ------------------------------------------------------------- */
export function CrossedBatsIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Crossed Cricket Bats"
    >
      <defs>
        <linearGradient id="crestWillow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <radialGradient id="centerRedBall" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="40%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>

      {/* Bat 1 */}
      <g transform="rotate(45 20 20)">
        <rect x="18.5" y="2" width="3" height="8" rx="1.5" fill="#ffffff" />
        <rect x="17.5" y="10" width="5" height="24" rx="2" fill="url(#crestWillow)" />
        <line x1="20" y1="10" x2="20" y2="33" stroke="#78350f" strokeWidth="1" />
      </g>

      {/* Bat 2 */}
      <g transform="rotate(-45 20 20)">
        <rect x="18.5" y="2" width="3" height="8" rx="1.5" fill="#ffffff" />
        <rect x="17.5" y="10" width="5" height="24" rx="2" fill="url(#crestWillow)" />
        <line x1="20" y1="10" x2="20" y2="33" stroke="#78350f" strokeWidth="1" />
      </g>

      {/* Center Cherry Red Ball */}
      <circle cx="20" cy="20" r="8" fill="url(#centerRedBall)" stroke="#ffffff" strokeWidth="1.2" />
      <path
        d="M 14 16 C 17 19 23 21 26 24"
        stroke="#ffffff"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="17.5" cy="17.5" r="1.4" fill="#ffffff" fillOpacity="0.8" />
    </svg>
  );
}

/* -------------------------------------------------------------
   VARIANT 4: Bold Cherry-Red Leather Cricket Ball
   ------------------------------------------------------------- */
export function FullRedBallIcon({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Red Leather Cricket Ball"
    >
      <defs>
        <radialGradient id="fullRedBallGrad" cx="30%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="25%" stopColor="#ef4444" />
          <stop offset="65%" stopColor="#b91c1c" />
          <stop offset="100%" stopColor="#450a0a" />
        </radialGradient>
      </defs>

      <circle cx="20" cy="20" r="16.5" fill="url(#fullRedBallGrad)" />

      {/* Bold Curved White Seam */}
      <path
        d="M 7 10 C 13 17 27 23 33 30"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Seam Stitches */}
      <g stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.95">
        <line x1="8.5" y1="13.5" x2="12" y2="10" />
        <line x1="12" y1="17.5" x2="15.5" y2="14" />
        <line x1="16" y1="21" x2="19.5" y2="17.5" />
        <line x1="20.5" y1="24.5" x2="24" y2="21" />
        <line x1="25" y1="27.5" x2="28.5" y2="24" />
        <line x1="29.5" y1="30.5" x2="33" y2="27" />
      </g>

      {/* Sun Glint Highlight */}
      <ellipse cx="14" cy="12" rx="4.5" ry="2.5" transform="rotate(-35 14 12)" fill="#ffffff" fillOpacity="0.7" />
      <circle cx="12" cy="10" r="1.5" fill="#ffffff" />
    </svg>
  );
}

// Export aliases for backward compatibility
export const DynamicBallIcon = ClassicCricketBatBallIcon;
export const CricketBallBatIcon = ClassicCricketBatBallIcon;

interface CricketLogoProps {
  showSubtitle?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function CricketLogo({
  showSubtitle = true,
  size = "md",
  className = "",
}: CricketLogoProps) {
  const [variant, setVariant] = useState<LogoVariant>("bat-and-ball");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cric_logo_variant") as LogoVariant | null;
      if (
        saved &&
        (saved === "bat-and-ball" ||
          saved === "stumps-and-ball" ||
          saved === "crossed-bats" ||
          saved === "red-ball")
      ) {
        setVariant(saved);
      }
    } catch {}
  }, []);

  const cycleVariant = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next: LogoVariant =
      variant === "bat-and-ball"
        ? "stumps-and-ball"
        : variant === "stumps-and-ball"
        ? "crossed-bats"
        : variant === "crossed-bats"
        ? "red-ball"
        : "bat-and-ball";
    setVariant(next);
    try {
      localStorage.setItem("cric_logo_variant", next);
    } catch {}
  };

  const badgeSize =
    size === "sm"
      ? "w-8 h-8 rounded-lg"
      : size === "lg"
      ? "w-12 h-12 rounded-2xl"
      : "w-10 h-10 rounded-xl";

  const iconSize =
    size === "sm"
      ? "w-6 h-6"
      : size === "lg"
      ? "w-9 h-9"
      : "w-8 h-8";

  const titleSize =
    size === "sm"
      ? "text-base"
      : size === "lg"
      ? "text-2xl"
      : "text-lg";

  const subSize =
    size === "sm"
      ? "text-[9px]"
      : size === "lg"
      ? "text-xs"
      : "text-[10px]";

  return (
    <div className={`flex items-center gap-3 group select-none ${className}`}>
      {/* 
        Solid Emerald Pitch Gradient Badge with Cricket Bat & Red Leather Ball
        Clicking the badge cycles through 4 authentic cricket styles!
      */}
      <div
        onClick={cycleVariant}
        title="Click to switch Cricket Logo style"
        className={`${badgeSize} bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-900 shadow-neon flex items-center justify-center cursor-pointer transition-all duration-200 group-hover:scale-105 active:scale-95 shrink-0 border border-emerald-400/40`}
      >
        {variant === "bat-and-ball" && <ClassicCricketBatBallIcon className={iconSize} />}
        {variant === "stumps-and-ball" && <StumpsAndBallIcon className={iconSize} />}
        {variant === "crossed-bats" && <CrossedBatsIcon className={iconSize} />}
        {variant === "red-ball" && <FullRedBallIcon className={iconSize} />}
      </div>

      {/* Brand Typography */}
      <div>
        <span
          className={`${titleSize} font-black tracking-wider text-white flex items-center gap-0.5 leading-none`}
        >
          CRIC<span className="text-emerald-400">SCORER</span>
        </span>
        {showSubtitle && (
          <span
            className={`${subSize} text-slate-400 uppercase tracking-widest block font-mono font-semibold mt-0.5`}
          >
            PRO ENGINE
          </span>
        )}
      </div>
    </div>
  );
}
