export type Role = "USER" | "RESTAURANT_OWNER";
export type TableShape = "RECTANGLE" | "CIRCLE" | "SQUARE";
export type SectionType = "INDOOR" | "OUTDOOR" | "BAR" | "PRIVATE";
export type ReservationStatus = "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW";

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: Role;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description?: string;
  address: string;
  phone: string;
  email: string;
  cuisine?: string;
  openTime: string;
  closeTime: string;
  ownerId: string;
  floors?: Floor[];
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

export interface Reservation {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
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
