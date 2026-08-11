import type { ReactNode, SVGProps } from "react";

export type AscendIconName =
  | "applications"
  | "checkins"
  | "progress"
  | "workout"
  | "alert"
  | "arrow"
  | "arrow-up-right";

type IconProps = SVGProps<SVGSVGElement> & {
  name: AscendIconName;
  decorative?: boolean;
  title?: string;
};

const icons: Record<AscendIconName, ReactNode> = {
  applications: (
    <>
      <path d="M4 4h16v16H4z" />
      <path d="M4 13h5l2 3h2l2-3h5" />
    </>
  ),
  checkins: <path d="M3 12h4l2-7 4 14 2-7h6" />,
  progress: <path d="m4 17 5-5 4 3 7-9M16 6h4v4" />,
  workout: <path d="M3 10v4M7 7v10M17 7v10M21 10v4M7 12h10" />,
  alert: (
    <>
      <path d="M12 3 2.8 19h18.4L12 3Z" />
      <path d="M12 8v5M12 16.5h.01" />
    </>
  ),
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  "arrow-up-right": <path d="M7 17 17 7M8 7h9v9" />,
};

/** Exact thin-line icon family used throughout the ASCEND interface. */
export default function AscendIcon({
  name,
  decorative = true,
  title,
  width = 18,
  height = 18,
  ...props
}: IconProps) {
  const accessibleTitle = decorative ? undefined : title ?? name;

  return (
    <svg
      viewBox="0 0 24 24"
      width={width}
      height={height}
      fill="none"
      stroke="currentColor"
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
