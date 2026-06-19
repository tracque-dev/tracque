// Tracque brand mark — a rail track in perspective launching into an upward
// electric-blue arrow. Placeholder vector until the final asset is dropped in.
// Props let call sites recolor it (rail = track, node = arrow, badge = bg).
export function Mark({
  className = 'w-7 h-7',
  badge = 'transparent',
  rail = '#08111F',   // track (rails + ties)
  node = '#2D7FF9',   // arrow (electric blue)
}: { className?: string; badge?: string; rail?: string; node?: string }) {
  return (
    <div className={`${className} rounded-[28%] flex items-center justify-center`} style={{ background: badge }}>
      <svg viewBox="0 0 24 24" className="w-[86%] h-[86%]">
        {/* perspective ties — solid bars narrowing toward the vanishing point */}
        <g fill={rail}>
          <rect x="5.6" y="18.7" width="12.8" height="1.7" rx="0.6" />
          <rect x="7.3" y="15.4" width="9.4" height="1.5" rx="0.5" />
          <rect x="8.7" y="12.4" width="6.6" height="1.4" rx="0.5" />
          <rect x="9.9" y="9.7" width="4.2" height="1.3" rx="0.5" />
          {/* rails tapering up toward the vanishing point */}
          <path d="M5.1 20.5 L6.9 20.5 L10.7 9.4 L9.5 9.4 Z" />
          <path d="M18.9 20.5 L17.1 20.5 L13.3 9.4 L14.5 9.4 Z" />
        </g>
        {/* bold arrow launching up-and-to-the-right */}
        <path d="M11.1 12.4 L18 5.3" stroke={node} strokeWidth="2.7" strokeLinecap="round" fill="none" />
        <path d="M20.7 2.9 L15.6 3.6 L20 8 Z" fill={node} />
      </svg>
    </div>
  )
}
