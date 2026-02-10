export function KingIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <line x1="12" y1="2" x2="12" y2="6" />
      <line x1="10" y1="4" x2="14" y2="4" />
      <path d="M8 8l-2 8h12l-2-8z" />
      <path d="M5 18h14" />
      <path d="M6 22h12" />
      <path d="M5 18l1 4" />
      <path d="M19 18l-1 4" />
    </svg>
  );
}

export function QueenIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="3" r="1.5" />
      <circle cx="5" cy="5" r="1" />
      <circle cx="19" cy="5" r="1" />
      <path d="M5 6l2 10h10l2-10" />
      <path d="M12 4.5v2" />
      <path d="M5 18h14" />
      <path d="M6 22h12" />
      <path d="M5 18l1 4" />
      <path d="M19 18l-1 4" />
    </svg>
  );
}

export function KnightIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M9 22h6" />
      <path d="M8 18h8l1-4-3-1 2-4-3 1-2-5-4 3v6l-2 1z" />
      <circle cx="10" cy="10" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function BishopIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="4" r="1.5" />
      <path d="M9 7c0 0-2 3-2 7s2 4 2 4h6s2 0 2-4-2-7-2-7" />
      <line x1="12" y1="7" x2="12" y2="14" />
      <path d="M8 20h8" />
      <path d="M7 22h10" />
    </svg>
  );
}

export function RookIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect x="6" y="3" width="2" height="3" />
      <rect x="11" y="3" width="2" height="3" />
      <rect x="16" y="3" width="2" height="3" />
      <path d="M5 6h14v2H5z" />
      <path d="M7 8l1 10h8l1-10" />
      <path d="M5 20h14" />
      <path d="M6 22h12" />
    </svg>
  );
}

export function PawnIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="6" r="3" />
      <path d="M10 9l-2 9h8l-2-9" />
      <path d="M6 20h12" />
      <path d="M7 22h10" />
    </svg>
  );
}
