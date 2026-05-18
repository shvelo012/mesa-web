export type Role = "USER" | "RESTAURANT_OWNER";
export type MenuType = "PHOTO" | "STRUCTURED";
export type LayoutStyle = "LIST" | "CARD_GRID" | "TWO_COLUMN";
export type DietaryTag = "vegan" | "vegetarian" | "gluten-free" | "dairy-free" | "spicy" | "nuts";
export type TableShape = "RECTANGLE" | "CIRCLE" | "SQUARE";
export type SectionType = "INDOOR" | "OUTDOOR" | "BAR" | "PRIVATE";
export type ReservationStatus = "PENDING" | "CONFIRMED" | "SEATED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export type Permission =
  | "RESERVATIONS_READ"
  | "RESERVATIONS_WRITE"
  | "FLOOR_PLAN"
  | "MENU_MANAGE"
  | "SETTINGS_READ"
  | "SETTINGS_WRITE"
  | "STAFF_MANAGE"
  | "REPORTS";

export type StaffRole = "MANAGER" | "HOST" | "WAITER" | "CHEF" | "CUSTOM";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
  emailVerified: boolean;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  notificationEmail?: string | null;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpUser?: string | null;
  smtpConfigured?: boolean;
  cuisine?: string;
  openTime: string;
  closeTime: string;
  ownerId: string;
  floors?: Floor[];
  avgStars?: number | null;
  reviewCount?: number;
}

export interface Floor {
  id: string;
  name: string;
  sectionType: SectionType;
  width: number;
  height: number;
  bgColor: string;
  restaurantId: string;
  tables?: TableItem[];
  walls?: Wall[];
}

export interface TableItem {
  id: string;
  label: string;
  shape: TableShape;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  capacity: number;
  minCapacity: number;
  isWindowSeat: boolean;
  isActive: boolean;
  notes?: string;
  imageUrl?: string | null;
  floorId: string;
}

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  floorId: string;
}

export interface MenuPhoto {
  id: string;
  menuId: string;
  url: string;
  order: number;
}

export interface MenuItem {
  id: string;
  groupId: string;
  name: string;
  price: number;
  description?: string | null;
  dietaryTags: DietaryTag[];
  order: number;
}

export interface MenuGroup {
  id: string;
  menuId: string;
  name: string;
  order: number;
  items?: MenuItem[];
}

export interface Menu {
  id: string;
  restaurantId: string;
  name: string;
  type: MenuType;
  layoutStyle?: LayoutStyle | null;
  order: number;
  photos?: MenuPhoto[];
  groups?: MenuGroup[];
}

export interface RestaurantStaff {
  id: string;
  userId: string;
  restaurantId: string;
  role: StaffRole;
  permissions: Permission[];
  isActive: boolean;
  invitedBy?: string | null;
  activationPending?: boolean;
  createdAt?: string;
  email?: string;
  name?: string;
  phone?: string | null;
}

export interface Reservation {
  id: string;
  confirmationToken?: string;
  date: string;
  startTime: string;
  partySize: number;
  status: ReservationStatus;
  notes?: string;
  userId: string | null;
  guestName?: string | null;
  guestEmail?: string | null;
  guestPhone?: string | null;
  tableId: string;
  table?: TableItem;
  user?: User;
}

export type WaitlistStatus = "WAITING" | "NOTIFIED" | "CONFIRMED" | "CANCELLED";

export interface WaitlistEntry {
  id: string;
  restaurantId: string;
  date: string;
  partySize: number;
  guestName: string;
  guestEmail: string;
  guestPhone?: string | null;
  userId?: string | null;
  notes?: string | null;
  status: WaitlistStatus;
  position: number;
  createdAt: string;
}

export interface GuestNote {
  id: string;
  restaurantId: string;
  guestEmail: string;
  note: string;
  authorId?: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  restaurantId: string;
  stars: number;
  text: string | null;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string };
  restaurant?: { id: string; name: string; slug: string };
}
