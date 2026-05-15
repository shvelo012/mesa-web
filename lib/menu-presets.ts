import { LayoutStyle } from "@/types";

export interface MenuPreset {
  id: string;
  name: string;
  groups: string[];
}

export const MENU_PRESETS: MenuPreset[] = [
  { id: "dinner", name: "Dinner Menu", groups: ["Starters", "Soups & Salads", "Mains", "Desserts", "Drinks"] },
  { id: "lunch", name: "Lunch Menu", groups: ["Starters", "Mains", "Sandwiches", "Sides", "Drinks"] },
  { id: "cafe", name: "Café Menu", groups: ["Hot Drinks", "Cold Drinks", "Pastries", "Light Bites"] },
  { id: "drinks", name: "Drinks Menu", groups: ["Cocktails", "Wine", "Beer", "Soft Drinks", "Mocktails"] },
  { id: "custom", name: "Custom", groups: ["Section 1"] },
];

export interface LayoutOption {
  id: LayoutStyle;
  name: string;
  description: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: "LIST", name: "List", description: "Single column, minimal" },
  { id: "CARD_GRID", name: "Card Grid", description: "Two-column card layout" },
  { id: "TWO_COLUMN", name: "Two Column", description: "Side-by-side columns" },
];

export const DIETARY_TAG_LABELS: Record<string, string> = {
  vegan: "Vegan",
  vegetarian: "Vegetarian",
  "gluten-free": "Gluten-Free",
  "dairy-free": "Dairy-Free",
  spicy: "Spicy",
  nuts: "Contains Nuts",
};

export const ALL_DIETARY_TAGS = Object.keys(DIETARY_TAG_LABELS);
