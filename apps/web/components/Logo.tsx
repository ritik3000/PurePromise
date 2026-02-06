/**
 * PurePromise logo – two hearts representing the warmth of couples.
 * Use with default size (e.g. h-6 w-6) or pass className.
 */
export function Logo({ className = "h-6 w-6" }: { className?: string }) {
  const heartPath =
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {/* Left heart – couple / warmth */}
      <path
        d={heartPath}
        transform="translate(-2, 1) scale(0.55)"
        vectorEffect="non-scaling-stroke"
      />
      {/* Right heart – overlapping */}
      <path
        d={heartPath}
        transform="translate(6, 1) scale(0.55)"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
