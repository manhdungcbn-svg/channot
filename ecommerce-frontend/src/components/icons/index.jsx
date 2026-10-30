/**
 * Icon set tự viết — SVG inline, không dùng thư viện icon ngoài.
 * Quy ước chung:
 *  - viewBox "0 0 24 24", stroke-width 2, stroke-linecap/linejoin round
 *  - mặc định `aria-hidden="true"` (icon trang trí)
 *  - nhận `className` và `...props` để ghi đè khi cần
 */

const base = {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
  focusable: 'false',
};

/**
 * Tạo component icon từ nội dung SVG.
 * @param {string} displayName
 * @param {import('react').ReactNode} children
 * @returns {import('react').FC<{className?: string}>}
 */
function createIcon(displayName, children) {
  function Icon({ className, ...props }) {
    return (
      <svg {...base} {...props} className={className}>
        {children}
      </svg>
    );
  }
  Icon.displayName = displayName;
  return Icon;
}

export const Search = createIcon(
  'SearchIcon',
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </>,
);

export const Heart = createIcon(
  'HeartIcon',
  <path d="M20.8 5.6a5 5 0 0 0-7.1 0L12 7.3l-1.7-1.7a5 5 0 1 0-7.1 7.1L12 21.4l8.8-8.7a5 5 0 0 0 0-7.1Z" />,
);

export const Cart = createIcon(
  'CartIcon',
  <>
    <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
    <circle cx="10" cy="20" r="1.2" />
    <circle cx="18" cy="20" r="1.2" />
  </>,
);

export const Shield = createIcon(
  'ShieldIcon',
  <>
    <path d="M12 3 5 6v5.5c0 4.3 2.9 8.2 7 9.5 4.1-1.3 7-5.2 7-9.5V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </>,
);

export const Truck = createIcon(
  'TruckIcon',
  <>
    <path d="M3 7h10v9H3z" />
    <path d="M13 10h4l3 3v3h-7z" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="17" cy="18" r="1.6" />
  </>,
);

export const Refresh = createIcon(
  'RefreshIcon',
  <>
    <path d="M20 11a8 8 0 0 0-14.1-5.2L3 9" />
    <path d="M4 13a8 8 0 0 0 14.1 5.2L21 15" />
    <path d="M3 4v5h5" />
    <path d="M21 20v-5h-5" />
  </>,
);

export const CreditCard = createIcon(
  'CreditCardIcon',
  <>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M2.5 10h19" />
    <path d="M6 15h3" />
  </>,
);

export const Check = createIcon('CheckIcon', <path d="m4.5 12.5 5 5 10-11" />);

export const Star = createIcon(
  'StarIcon',
  <path d="m12 3.5 2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 10l6.1-.9L12 3.5Z" />,
);

export const ChevronDown = createIcon('ChevronDownIcon', <path d="m6 9 6 6 6-6" />);

export const ChevronLeft = createIcon('ChevronLeftIcon', <path d="m15 6-6 6 6 6" />);

export const ChevronRight = createIcon('ChevronRightIcon', <path d="m9 6 6 6-6 6" />);

export const Plus = createIcon('PlusIcon', <path d="M12 5v14M5 12h14" />);

export const Minus = createIcon('MinusIcon', <path d="M5 12h14" />);

export const Close = createIcon('CloseIcon', <path d="M6 6l12 12M18 6 6 18" />);

export const Menu = createIcon('MenuIcon', <path d="M4 7h16M4 12h16M4 17h16" />);

export const Phone = createIcon(
  'PhoneIcon',
  <path d="M5 3.5h3.2l1.6 4-2 1.4a12 12 0 0 0 5.8 5.8l1.4-2 4 1.6V18a2.5 2.5 0 0 1-2.7 2.5A16.5 16.5 0 0 1 2.5 6.2 2.5 2.5 0 0 1 5 3.5Z" />,
);

export const Mail = createIcon(
  'MailIcon',
  <>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </>,
);

export const MapPin = createIcon(
  'MapPinIcon',
  <>
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
    <circle cx="12" cy="10" r="2.6" />
  </>,
);

export const Facebook = createIcon(
  'FacebookIcon',
  <path d="M14.5 8.5V7a1.5 1.5 0 0 1 1.5-1.5H17V2.5h-2.5A4.5 4.5 0 0 0 10 7v1.5H7.5V12H10v9.5h4.5V12h2.8l.7-3.5h-3.5Z" />,
);

export const Zalo = createIcon(
  'ZaloIcon',
  <>
    <path d="M12 3c-5 0-9 3.3-9 7.4 0 2.3 1.3 4.4 3.3 5.7v3l3-1.7c.8.2 1.7.3 2.7.3 5 0 9-3.3 9-7.3S17 3 12 3Z" />
    <path d="M8.4 9.4h4.2M12.6 9.4v4.6" />
  </>,
);

export const Youtube = createIcon(
  'YoutubeIcon',
  <>
    <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
    <path d="m10.5 9.5 4.5 2.5-4.5 2.5z" />
  </>,
);

export const ArrowUp = createIcon('ArrowUpIcon', <path d="M12 20V4m0 0-6 6m6-6 6 6" />);

export const Headset = createIcon(
  'HeadsetIcon',
  <>
    <path d="M4 13v-1a8 8 0 0 1 16 0v1" />
    <path d="M4 13h2.5a1.5 1.5 0 0 1 1.5 1.5v3A1.5 1.5 0 0 1 6.5 19H6a2 2 0 0 1-2-2v-4Z" />
    <path d="M20 13h-2.5a1.5 1.5 0 0 0-1.5 1.5v3a1.5 1.5 0 0 0 1.5 1.5h.5a2 2 0 0 0 2-2v-4Z" />
  </>,
);

export const Fire = createIcon(
  'FireIcon',
  <path d="M12 2.5s4.5 4 4.5 8a4.5 4.5 0 0 1-9 0c0-1.2.4-2.3 1-3.2 0 2 1 3 2 3 0-3 1.5-5.5 1.5-7.8Z" />,
);

export const Filter = createIcon(
  'FilterIcon',
  <path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z" />,
);

export const Logout = createIcon(
  'LogoutIcon',
  <>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" />
    <path d="M10 16l-4-4 4-4" />
    <path d="M6 12h10" />
  </>,
);

export const Grid = createIcon(
  'GridIcon',
  <>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </>,
);

export const Play = createIcon('PlayIcon', <path d="M8 5.5v13l11-6.5-11-6.5Z" />);

export const Pause = createIcon(
  'PauseIcon',
  <>
    <path d="M9 5v14" />
    <path d="M15 5v14" />
  </>,
);

export const Compare = createIcon(
  'CompareIcon',
  <>
    <path d="M12 3v18" />
    <path d="M6.5 7 3 12h7L6.5 7Z" />
    <path d="M17.5 7 14 12h7l-3.5-5Z" />
    <path d="M3 12v5h3.5M21 12v5h-3.5" />
  </>,
);

export const Calendar = createIcon(
  'CalendarIcon',
  <>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4" />
  </>,
);

export const Gift = createIcon(
  'GiftIcon',
  <>
    <rect x="3" y="9" width="18" height="12" rx="2" />
    <path d="M2.5 9h19v4h-19zM12 9v12" />
    <path d="M12 9S9 9 7.5 7.5 8 4 10 4s2 2.5 2 5Z" />
    <path d="M12 9s3 0 4.5-1.5S16 4 14 4s-2 2.5-2 5Z" />
  </>,
);

export const Leaf = createIcon(
  'LeafIcon',
  <>
    <path d="M4 20c0-8 5-14 16-14 0 11-6 15-13 15H4Z" />
    <path d="M4 20c3-5 7-8 11-9" />
  </>,
);

export const Eye = createIcon(
  'EyeIcon',
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
);

export const EyeOff = createIcon(
  'EyeOffIcon',
  <>
    <path d="M4 4l16 16" />
    <path d="M9.9 5.9A9.3 9.3 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-3.2 4.1" />
    <path d="M6.6 7.7A16.7 16.7 0 0 0 2.5 12S6 18.5 12 18.5c1 0 1.9-.2 2.8-.5" />
    <path d="M9.9 10.1a3 3 0 0 0 4.2 4.2" />
  </>,
);

export const User = createIcon(
  'UserIcon',
  <>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </>,
);

export const Wallet = createIcon(
  'WalletIcon',
  <>
    <path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h11a2 2 0 0 1 2 2v1.5" />
    <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" />
    <circle cx="16" cy="13.5" r="1.3" />
  </>,
);

export default {
  ArrowUp,
  Calendar,
  Cart,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Close,
  Compare,
  CreditCard,
  Eye,
  EyeOff,
  Facebook,
  Filter,
  Fire,
  Gift,
  Grid,
  Headset,
  Heart,
  Leaf,
  Logout,
  Mail,
  MapPin,
  Menu,
  Minus,
  Pause,
  Phone,
  Play,
  Plus,
  Refresh,
  Search,
  Shield,
  Star,
  Truck,
  User,
  Wallet,
  Youtube,
  Zalo,
};
