/**
 * Custom line icons, replacing the generic clipart the old site used for
 * vision/goal/milestones. Stroke-based on a 24px grid, inheriting
 * currentColor so they take the surrounding text colour.
 */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const MedicalIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M9 3h6v4.2a3 3 0 0 0 .5 1.7l3.2 4.9A4 4 0 0 1 15.4 21H8.6a4 4 0 0 1-3.3-7.2l3.2-4.9A3 3 0 0 0 9 7.2Z" />
    <path d="M6.6 15h10.8" /><path d="M12 11.5v3" /><path d="M10.5 13h3" />
  </svg>
);

export const IndustrialIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 21V10l5 3.2V10l5 3.2V10l5 3.2V21z" />
    <path d="M18 10V4.5a1 1 0 0 0-1-1h-1.6a1 1 0 0 0-1 1V8" />
    <path d="M7 17.5h2M13 17.5h2" />
  </svg>
);

export const FoodIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 21V9" />
    <path d="M12 12c0-2.5-1.6-4.5-4-5 0 2.5 1.6 4.5 4 5Z" />
    <path d="M12 12c0-2.5 1.6-4.5 4-5 0 2.5-1.6 4.5-4 5Z" />
    <path d="M12 17c0-2.2-1.4-4-3.5-4.5 0 2.2 1.4 4 3.5 4.5Z" />
    <path d="M12 17c0-2.2 1.4-4 3.5-4.5 0 2.2-1.4 4-3.5 4.5Z" />
    <path d="M8 21h8" />
  </svg>
);

export const OilIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 3.5s5.5 6 5.5 9.7A5.5 5.5 0 0 1 12 19a5.5 5.5 0 0 1-5.5-5.8C6.5 9.5 12 3.5 12 3.5Z" />
    <path d="M9.7 13.6a2.4 2.4 0 0 0 2.3 2.6" />
  </svg>
);

export const FlaskIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M9.5 3v6.2L4.8 17a2.4 2.4 0 0 0 2 3.6h10.4a2.4 2.4 0 0 0 2-3.6l-4.7-7.8V3" />
    <path d="M8.5 3h7" /><path d="M7 14.5h10" />
  </svg>
);

export const ClipboardIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M9 4H7a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
    <rect x="9" y="2.5" width="6" height="3.5" rx="1" />
    <path d="m9 13.5 2 2 4-4" />
  </svg>
);

export const WarehouseIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 21V8.6a1 1 0 0 1 .6-.9l8-3.5a1 1 0 0 1 .8 0l8 3.5a1 1 0 0 1 .6.9V21" />
    <path d="M7 21v-7h10v7" /><path d="M7 17.5h10" />
  </svg>
);

export const ShipIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3 17.5c1.6 0 1.6 1.5 3.2 1.5s1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5 1.6-1.5 3.2-1.5 1.6 1.5 3.2 1.5" />
    <path d="M4.5 14 12 11l7.5 3-1 3.2H5.5z" />
    <path d="M12 11V5" /><path d="M9 7.5h6" />
  </svg>
);

export const ArrivalIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" />
    <path d="m9.2 10.2 1.9 1.9 3.7-3.7" />
  </svg>
);

export const ShieldCheckIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-3.2 7-9V5.6l-7-2.6-7 2.6V12c0 5.8 7 9 7 9Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={2.2} className={className}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export const ArrowIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={1.8} className={className}>
    <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
  </svg>
);

export const MailIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 6.5 8.5 6 8.5-6" />
  </svg>
);

export const WhatsAppIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M3.5 20.5 5 16.4A8 8 0 1 1 8.1 19.4Z" />
    <path d="M9 9.2c0 3 2.4 5.4 5.3 5.4.5 0 .9-.4.9-.9v-.9l-1.8-.8-.9 1a6 6 0 0 1-2.2-2.2l1-.9-.8-1.8h-.9c-.5 0-.9.4-.9.9Z" />
  </svg>
);

export const PinIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <path d="M12 21s7-5.4 7-11a7 7 0 1 0-14 0c0 5.6 7 11 7 11Z" /><circle cx="12" cy="10" r="2.6" />
  </svg>
);

export const FacebookIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M14 8.5V7c0-.7.3-1 1-1h1.5V3.2h-2.3C11.7 3.2 11 4.8 11 6.8v1.7H9V11h2v9.8h3V11h2.2l.3-2.5Z" />
  </svg>
);

export const InstagramIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="4.6" />
    <circle cx="12" cy="12" r="3.6" />
    <circle cx="17" cy="7" r="1" fill="currentColor" stroke="none" />
  </svg>
);

export const XIcon = ({ className }: IconProps) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
    <path d="M17.2 3.5h3l-6.6 7.5 7.7 10.2h-6l-4.7-6.2-5.4 6.2H2.2l7-8-7.4-9.7h6.2l4.3 5.7ZM16 19.4h1.7L7.6 5.3H5.8Z" />
  </svg>
);

export const GlobeIcon = ({ className }: IconProps) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a15 15 0 0 1 0 18a15 15 0 0 1 0-18Z" />
  </svg>
);

export const MenuIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={1.8} className={className}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);

export const CloseIcon = ({ className }: IconProps) => (
  <svg {...base} strokeWidth={1.8} className={className}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);

/** Picks an icon for a service category from its (translated) name. */
const ICON_HINTS: [string[], (props: IconProps) => JSX.Element][] = [
  [["الطبي", "Medical"], MedicalIcon],
  [["الصناعي", "Industrial"], IndustrialIcon],
  [["الأغذية", "Food"], FoodIcon],
  [["الزيوت", "Oil"], OilIcon],
  [["العينات", "Sampling"], FlaskIcon],
  [["ما قبل التصنيع", "Pre-manufacturing"], ClipboardIcon],
  [["ما قبل الشحن", "Pre-shipment"], WarehouseIcon],
  [["أثناء", "during"], ShipIcon],
  [["الوصول", "arrival"], ArrivalIcon],
];

export function iconForCategory(name: string) {
  for (const [hints, Icon] of ICON_HINTS) {
    if (hints.some((hint) => name.includes(hint))) return Icon;
  }
  return ClipboardIcon;
}
