import type { ReactNode, SVGProps } from "react";

export type GetDivineIconName =
  | "today"
  | "plan"
  | "nutrition"
  | "workout"
  | "progress"
  | "overview"
  | "athletes"
  | "applications"
  | "checkins"
  | "programmes"
  | "layers"
  | "search"
  | "bell"
  | "plus"
  | "arrow"
  | "arrow-up-right"
  | "close"
  | "alert";

type IconProps = SVGProps<SVGSVGElement> & {
  name: GetDivineIconName;
  decorative?: boolean;
  title?: string;
};

const icons: Record<GetDivineIconName, ReactNode> = {
  today: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
  plan: <path d="M6 3h12a2 2 0 0 1 2 2v16H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm0 14h14M8 7h8M8 11h6" />,
  nutrition: <path d="M12 21c4-3 6-7 6-11a6 6 0 0 0-12 0c0 4 2 8 6 11Zm0-14v8M8.5 11.5h7" />,
  workout: <path d="M3 10v4M7 7v10M17 7v10M21 10v4M7 12h10" />,
  progress: <path d="m4 17 5-5 4 3 7-9M16 6h4v4" />,
  overview: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <rect x="14" y="14" width="6" height="6" rx="1" />
    </>
  ),
  athletes: (
    <>
      <path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  applications: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M4 13h5l2 3h2l2-3h5" />
    </>
  ),
  checkins: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  programmes: (
    <>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4" />
    </>
  ),
  layers: (
    <>
      <path d="m12 2 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  alert: (
    <>
      <path d="M12 3 2 21h20L12 3Z" />
      <path d="M12 9v5M12 18h.01" />
    </>
  ),
};

/**
 * Exact thin-line icon family used by the published Get Divine site.
 * Default sizing and stroke weight match the live implementation.
 */
export function GetDivineIcon({
  name,
  decorative = true,
  title,
  width = 18,
  height = 18,
  ...props
}: IconProps) {
  const isFilled = name === "today";
  const accessibleTitle = decorative ? undefined : title ?? name;

  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill={isFilled ? "currentColor" : "none"}
      stroke={isFilled ? "none" : "currentColor"}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : "img"}
      {...props}
    >
      {accessibleTitle ? <title>{accessibleTitle}</title> : null}
      {icons[name]}
    </svg>
  );
}

export const clientPortalIcons = {
  dashboard: "today",
  plan: "plan",
  nutrition: "nutrition",
  logger: "workout",
  progress: "progress",
} as const satisfies Record<string, GetDivineIconName>;

export const coachPortalIcons = {
  overview: "overview",
  people: "athletes",
  applications: "applications",
  checkins: "checkins",
  delivery: "programmes",
  workouts: "checkins",
  system: "layers",
} as const satisfies Record<string, GetDivineIconName>;
