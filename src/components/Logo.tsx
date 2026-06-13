// Tracque brand mark — twin rails climbing up-and-to-the-right (Trac-que)
// with a node at the head. One source of truth for the whole app.
export function Mark({
  className = 'w-7 h-7',
  badge = '#0A0A0A',
  rail = '#ffffff',
  node = '#3B82F6',
}: { className?: string; badge?: string; rail?: string; node?: string }) {
  return (
    <div className={`${className} rounded-[28%] flex items-center justify-center`} style={{ background: badge }}>
      <svg viewBox="0 0 24 24" fill="none" className="w-[64%] h-[64%]" stroke={rail} strokeLinecap="round">
        <path d="M5 18.9 L19 8.9" strokeWidth="2.5" />
        <path d="M5 15.1 L19 5.1" strokeWidth="2.5" />
        <circle cx="19" cy="5.1" r="1.6" fill={node} stroke="none" />
      </svg>
    </div>
  )
}
