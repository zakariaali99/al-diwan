/** Line icons for the dashboard, on the same 24px stroke grid as the site's. */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

const icon = (paths: string[]) =>
  function Icon({ className = "h-5 w-5" }: IconProps) {
    return (
      <svg {...base} className={className}>
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };

export const OverviewIcon = icon(["M4 4h7v7H4z", "M13 4h7v4h-7z", "M13 10h7v10h-7z", "M4 13h7v7H4z"]);
export const PostsIcon = icon(["M7 3h7l5 5v13H7z", "M14 3v5h5", "M10 13h6", "M10 17h6"]);
export const CommentsIcon = icon(["M4 5h16v11H9l-5 4z", "M8 9.5h8", "M8 12.5h5"]);
export const TagIcon = icon(["M3.5 12.5V4h8.5l8.5 8.5-8.5 8.5z", "M8 8h.01"]);
export const InboxIcon = icon(["M4 13l2.5-8h11l2.5 8v6H4z", "M4 13h4.5l1 2.5h5l1-2.5H20"]);
export const ContactsIcon = icon(["M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z", "M3 20a6 6 0 0 1 12 0", "M16 4.5a3.5 3.5 0 0 1 0 6.5", "M18 14.5a6 6 0 0 1 3 5.5"]);
export const ServicesIcon = icon(["M4 8h16v12H4z", "M9 8V5h6v3", "M4 13h16"]);
export const SettingsIcon = icon([
  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  "M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
]);
export const TextIcon = icon(["M5 6V4h14v2", "M12 4v16", "M9 20h6"]);
export const BadgeIcon = icon(["M12 3l2.5 2 3.2-.3.8 3.1 2.6 1.9-1.4 2.9 1.4 2.9-2.6 1.9-.8 3.1-3.2-.3L12 21l-2.5-2-3.2.3-.8-3.1-2.6-1.9 1.4-2.9-1.4-2.9 2.6-1.9.8-3.1 3.2.3z", "M8.8 12l2.2 2.2 4.2-4.4"]);
export const TeamIcon = icon(["M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z", "M4.5 21a7.5 7.5 0 0 1 15 0"]);
export const ExternalIcon = icon(["M14 4h6v6", "M20 4l-9 9", "M18 14v6H4V6h6"]);
export const LogoutIcon = icon(["M15 4h4v16h-4", "M10 8l-4 4 4 4", "M6 12h10"]);
export const MenuIcon = icon(["M4 7h16", "M4 12h16", "M4 17h16"]);
export const CloseIcon = icon(["M6 6l12 12", "M18 6L6 18"]);
export const PlusIcon = icon(["M12 5v14", "M5 12h14"]);
export const EyeIcon = icon(["M2.5 12S6 5 12 5s9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z", "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"]);
export const EyeOffIcon = icon([
  "M3 3l18 18",
  "M10.6 5.1A9.9 9.9 0 0 1 12 5c6 0 9.5 7 9.5 7a17.6 17.6 0 0 1-2.7 3.6",
  "M6.6 6.6A17.4 17.4 0 0 0 2.5 12s3.5 7 9.5 7a9.6 9.6 0 0 0 5.4-1.6",
  "M9.9 9.9a3 3 0 0 0 4.2 4.2",
]);
export const PaperclipIcon = icon(["M20 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7l-8.5 8.5a1.7 1.7 0 0 1-2.4-2.4l7.8-7.8"]);
