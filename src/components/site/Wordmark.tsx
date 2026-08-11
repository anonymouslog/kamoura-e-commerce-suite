export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col items-center leading-none ${className}`}>
      <svg
        width="46"
        height="12"
        viewBox="0 0 46 12"
        fill="none"
        aria-hidden="true"
        className="mb-1 text-gold"
      >
        <path
          d="M1 10.5C6.5 3.5 15 1 23 1s16.5 2.5 22 9.5"
          stroke="currentColor"
          strokeWidth="0.75"
          strokeLinecap="round"
          opacity="0.8"
        />
        <path
          d="M23 0.5l0.9 1.9 2 0.3-1.5 1.4 0.4 2-1.8-1-1.8 1 0.4-2-1.5-1.4 2-0.3z"
          fill="currentColor"
        />
      </svg>
      <span className="font-display text-ivory">
        <span className="tracking-[0.34em] text-[1.05em]">KAM</span>
        <span className="relative inline-block tracking-[0.34em] text-[1.05em]">
          O
          <svg
            viewBox="0 0 10 10"
            className="absolute left-[0.16em] top-1/2 h-[0.42em] w-[0.42em] -translate-y-1/2 text-gold"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M7.2 7.6A3.4 3.4 0 1 1 6.2 1.2 4 4 0 0 0 7.2 7.6z"
              fill="currentColor"
            />
          </svg>
        </span>
        <span className="tracking-[0.34em] text-[1.05em]">URA</span>
      </span>
    </span>
  );
}
