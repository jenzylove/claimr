import { useId } from "react";

interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 32, className }: LogoProps) {
  const id = useId();
  const gradId = `claimr-brand-${id}`;

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Claimr"
    >
      <title>Claimr</title>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FF2D7A" />
          <stop offset="1" stopColor="#2D6EFF" />
        </linearGradient>
      </defs>
      <path
        d="M80 16L32 16L16 32L16 64L32 80L80 80L80 64L40 64L28 48L40 32L80 32Z"
        fill={`url(#${gradId})`}
      />
    </svg>
  );
}
