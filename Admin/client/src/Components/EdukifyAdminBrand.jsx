import React, { useId } from 'react'

/**
 * Edukify mark + wordmark for dark admin chrome (header / sidebar).
 */
export default function EdukifyAdminBrand({ variant = 'header' }) {
  const gid = useId().replace(/:/g, '')
  const gradMark = `eamg-${gid}`
  const isSidebar = variant === 'sidebar'

  return (
    <span
      className={`inline-flex items-center gap-2.5 text-left ${isSidebar ? 'gap-2' : 'gap-3'}`}
      aria-label="Edukify admin"
    >
      <svg
        className={`shrink-0 drop-shadow-md ${isSidebar ? 'h-9 w-9' : 'h-10 w-10'}`}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradMark} x1="6" y1="4" x2="36" y2="38" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0284c7" />
            <stop offset="1" stopColor="#06b6d4" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" rx="11" fill={`url(#${gradMark})`} />
        <path
          d="M12.5 12.5h12M12.5 20h8.5M12.5 27.5h12M12.5 12.5v15"
          stroke="white"
          strokeWidth="2.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          opacity={0.96}
        />
      </svg>
      <span className="flex min-w-0 flex-col leading-tight">
        <span
          className={`font-bold tracking-tight text-white ${isSidebar ? 'text-[0.9375rem]' : 'text-base sm:text-lg'}`}
        >
          Edukify
        </span>
        <span
          className={`font-medium uppercase tracking-[0.12em] text-sky-200/85 ${isSidebar ? 'mt-0.5 text-[9px]' : 'mt-0.5 text-[10px]'}`}
        >
          Admin console
        </span>
      </span>
    </span>
  )
}
