export function Wordmark({ className = "", width = 220 }: { className?: string; width?: number }) {
  // The supplied artwork includes large decorative arcs above and below the
  // wordmark. Frame only the lettering so navigation stays crisp at small sizes.
  const height = Math.round(width * 0.215);
  const offset = Math.round(width * 0.12);

  return (
    <span
      role="img"
      aria-label="Kamoura"
      className={`relative block shrink-0 overflow-hidden ${className}`.trim()}
      style={{ width, height }}
    >
      <img
        src="/kamoura-logo.png"
        alt=""
        width={width}
        height={Math.round((width * 282) / 668)}
        decoding="async"
        className="absolute left-0 max-w-none"
        style={{ top: -offset, width }}
      />
    </span>
  );
}
