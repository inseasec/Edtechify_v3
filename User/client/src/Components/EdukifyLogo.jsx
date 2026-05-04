import React, { useId } from "react";

/**
 * Default marketing wordmark when the tenant has not uploaded an org logo yet.
 */
export default function EdukifyLogo({ className = "", compact = false }) {
  const gradId = `edukifyLogoGrad-${useId().replace(/:/g, "")}`;
  const iconClass = compact ? "h-8 w-8" : "h-9 w-9 md:h-11 md:w-11";
  const textClass = compact
    ? "text-[1.05rem] font-bold tracking-tight"
    : "text-lg font-bold tracking-tight md:text-xl";

  return (
    <span
      className={`inline-flex items-center gap-2.5 text-left ${className}`}
      aria-label="Edukify"
    >
      <svg
        className={`${iconClass} shrink-0 drop-shadow-sm`}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradId} x1="6" y1="4" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gradId})`} />
        <path
          d="M12.5 12.5h12M12.5 20h8.5M12.5 27.5h12M12.5 12.5v15"
          stroke="white"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity="0.96"
        />
      </svg>
      <span
        className={`bg-gradient-to-r from-sky-700 via-sky-600 to-cyan-600 bg-clip-text leading-none text-transparent ${textClass}`}
      >
        Edukify
      </span>
    </span>
  );
}
