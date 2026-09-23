/**
 * The console's single icon component.
 *
 * Replaces the Material Symbols webfont. That font was loaded from
 * fonts.googleapis.com with `display=block`, and because its glyphs are
 * ligatures the browser renders the LITERAL LIGATURE TEXT until the ~200 KB
 * file arrives — on a slow connection the UI showed the words "search" and
 * "notifications" where icons belong. These are real SVG elements, bundled at
 * build time, so there is nothing to fetch and nothing to fall back to.
 *
 * Icons are keyed by their old Material Symbols name so every existing call
 * site — including the ones that pass a name from data (`{link.icon}`) —
 * keeps working untouched.
 */
import {
  ArrowRight, ArrowLeft, Check, X, MapPin, BadgeCheck, ShieldCheck, Plus,
  SquarePlus, HousePlus, Camera, ImagePlus, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, CircleAlert, CircleCheck, CircleCheckBig, Send,
  Phone, Download, Trash, Image, LogOut, LogIn, Share2, Save, MessageCircle,
  MessageSquare, MessagesSquare, Upload, CloudUpload, Mail, MailCheck, Forward,
  MailX, Reply, RefreshCw, LoaderCircle, Users, UserPlus, CircleUser,
  UserSearch, UserCheck, UserCog, Handshake, Search, SearchX, FileText, Pencil,
  PenLine, FilePen, Megaphone, MousePointerClick, ChartColumn, BuildingComplex,
  Building, House, Briefcase, Landmark, Copy, Award, Sparkles, Star, Heart,
  EllipsisVertical, Bell, BellOff, BellRing, Smartphone, Monitor, Menu,
  LayoutDashboard, LayoutGrid, SlidersHorizontal, Settings, Lock, KeyRound,
  Key, Info, Clock, Inbox, CirclePause, Eye, EyeOff, TrendingUp, TrendingDown,
  CircleMinus, Minus, Circle, Moon, Sun, Ruler, Gavel, Tag, Sofa, Palette,
  CreditCard, Banknote, Globe, IdCard, CircleDot, ExternalLink, TriangleAlert,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/** Old Material Symbols name → the SVG that replaces it. */
const ICONS: Record<string, LucideIcon> = {
  // navigation & chrome
  arrow_forward: ArrowRight,
  arrow_back: ArrowLeft,
  chevron_left: ChevronLeft,
  chevron_right: ChevronRight,
  expand_more: ChevronDown,
  expand_less: ChevronUp,
  menu: Menu,
  close: X,
  more_vert: EllipsisVertical,
  open_in_new: ExternalLink,
  launch: ExternalLink,
  search: Search,
  search_off: SearchX,
  dashboard: LayoutDashboard,
  space_dashboard: LayoutDashboard,
  grid_view: LayoutGrid,
  category: LayoutGrid,
  tune: SlidersHorizontal,
  settings: Settings,

  // status
  check: Check,
  check_circle: CircleCheck,
  task_alt: CircleCheckBig,
  approval: CircleCheckBig,
  error: CircleAlert,
  /* Distinct from `error`: a warning is something to look at, an error is
     something that failed. The payment screens use both in the same column. */
  warning: TriangleAlert,
  info: Info,
  schedule: Clock,
  pause_circle: CirclePause,
  do_not_disturb_on: CircleMinus,
  remove: Minus,
  radio_button_unchecked: Circle,
  progress_activity: LoaderCircle,
  sync: RefreshCw,
  trending_up: TrendingUp,
  trending_down: TrendingDown,

  // people
  person: CircleUser,
  group: Users,
  group_add: UserPlus,
  person_add: UserPlus,
  person_search: UserSearch,
  person_check: UserCheck,
  how_to_reg: UserCheck,
  person_edit: UserCog,
  manage_accounts: UserCog,
  admin_panel_settings: ShieldCheck,
  real_estate_agent: Handshake,
  handshake: Handshake,
  verified: BadgeCheck,
  verified_user: ShieldCheck,
  badge: IdCard,

  // messaging
  call: Phone,
  mail: Mail,
  mail_outline: Mail,
  mark_email_read: MailCheck,
  forward_to_inbox: Forward,
  unsubscribe: MailX,
  inbox: Inbox,
  reply: Reply,
  send: Send,
  chat: MessageCircle,
  chat_bubble: MessageSquare,
  forum: MessagesSquare,
  notifications: Bell,
  notifications_off: BellOff,
  notifications_active: BellRing,

  // property & places
  location_on: MapPin,
  apartment: BuildingComplex,
  domain: Building,
  home_work: House,
  add_home: HousePlus,
  weekend: Sofa,
  distance: Ruler,
  business_center: Briefcase,
  account_balance: Landmark,

  // content
  article: FileText,
  description: FileText,
  edit: Pencil,
  edit_note: PenLine,
  edit_document: FilePen,
  save: Save,
  content_copy: Copy,
  image: Image,
  add_a_photo: Camera,
  photo_camera: Camera,
  camera_enhance: Camera,
  add_photo_alternate: ImagePlus,
  vignette: Palette,
  upload: Upload,
  upload_file: CloudUpload,
  download: Download,
  delete: Trash,
  share: Share2,
  add: Plus,
  add_box: SquarePlus,

  // commerce & marketing
  campaign: Megaphone,
  ads_click: MousePointerClick,
  analytics: ChartColumn,
  sell: Tag,
  tag: Tag,
  payment: CreditCard,
  payments: Banknote,
  workspace_premium: Award,
  stars: Sparkles,
  star: Star,
  favorite: Heart,
  gavel: Gavel,

  // access & device
  login: LogIn,
  logout: LogOut,
  lock: Lock,
  key: KeyRound,
  vpn_key: Key,
  visibility: Eye,
  visibility_off: EyeOff,
  smartphone: Smartphone,
  computer: Monitor,
  web: Globe,
  dark_mode: Moon,
  light_mode: Sun,
};

export interface IconProps {
  /** Material Symbols name, e.g. "arrow_forward". */
  name: string;
  /** Rendered pixel size. Matches the old font-size the call site used. */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Only set this when the icon is the sole content of its control. */
  title?: string;
}

export default function Icon({ name, size = 20, className, style, title }: IconProps) {
  const Glyph = ICONS[name];

  if (!Glyph) {
    // A missing mapping must not blank out the UI; render a neutral mark and
    // make the gap visible while developing.
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Icon] no SVG mapped for "${name}" — add it to src/components/ui/Icon.tsx`);
    }
    return (
      <CircleDot
        size={size}
        strokeWidth={1.75}
        className={className}
        style={style}
        aria-hidden="true"
        focusable="false"
      />
    );
  }

  return (
    <Glyph
      size={size}
      strokeWidth={1.75}
      className={className}
      style={style}
      aria-hidden={title ? undefined : 'true'}
      aria-label={title}
      role={title ? 'img' : undefined}
      focusable="false"
    />
  );
}
