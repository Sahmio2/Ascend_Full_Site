import type { SVGProps, ReactNode } from "react";

export type GetDivineIconName =
  | "today"
  | "plan"
  | "nutrition"
  | "workout"
  | "progress"
  | "arrow-up-right"
  | "chevron-right"
  | "check"
  | "alert"
  | "lock";

interface IconProps extends SVGProps<SVGSVGElement> {
  name: GetDivineIconName;
  width?: number | string;
  height?: number | string;
}

const icons: Record<GetDivineIconName, ReactNode> = {
  today: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  plan: (
    <>
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="9" y="3" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 12h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  nutrition: (
    <>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  workout: (
    <>
      <path d="M6 5v14M18 5v14M2 9v6M22 9v6M6 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </>
  ),
  progress: (
    <>
      <path d="M3 17l6-6 4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 7h4v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  "arrow-up-right": (
    <path d="M7 17L17 7M7 7h10v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  "chevron-right": (
    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  check: (
    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  ),
  alert: (
    <>
      <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" />
    </>
  ),
};

export function GetDivineIcon({ name, width = 18, height = 18, fill = "none", ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill={fill}
      aria-hidden="true"
      {...props}
    >
      {icons[name]}
    </svg>
  );
}

export default GetDivineIcon;
