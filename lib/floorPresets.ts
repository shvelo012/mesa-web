import { SectionType } from "@/types";

export interface FloorPreset {
  name: string;
  sectionType: SectionType;
  width: number;
  height: number;
  tables: Array<{
    label: string;
    shape: "RECTANGLE" | "CIRCLE" | "SQUARE";
    x: number;
    y: number;
    width: number;
    height: number;
    rotation: number;
    capacity: number;
    minCapacity?: number;
    isWindowSeat?: boolean;
    isActive?: boolean;
  }>;
  walls: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }>;
}

export const FLOOR_PRESETS: FloorPreset[] = [
  {
    name: "Small Indoor Room",
    sectionType: "INDOOR",
    width: 600,
    height: 400,
    tables: [
      { label: "T1", shape: "RECTANGLE", x: 80, y: 80, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T2", shape: "RECTANGLE", x: 260, y: 80, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T3", shape: "RECTANGLE", x: 80, y: 240, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T4", shape: "RECTANGLE", x: 260, y: 240, width: 80, height: 80, rotation: 0, capacity: 4 },
    ],
    walls: [],
  },
  {
    name: "Standard Dining Room",
    sectionType: "INDOOR",
    width: 1000,
    height: 800,
    tables: [
      { label: "T1", shape: "RECTANGLE", x: 120, y: 120, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T2", shape: "RECTANGLE", x: 320, y: 120, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T3", shape: "RECTANGLE", x: 520, y: 120, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T4", shape: "RECTANGLE", x: 720, y: 120, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T5", shape: "RECTANGLE", x: 120, y: 360, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T6", shape: "RECTANGLE", x: 320, y: 360, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T7", shape: "RECTANGLE", x: 520, y: 360, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T8", shape: "RECTANGLE", x: 720, y: 360, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T9", shape: "RECTANGLE", x: 120, y: 600, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T10", shape: "RECTANGLE", x: 320, y: 600, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T11", shape: "RECTANGLE", x: 520, y: 600, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "T12", shape: "RECTANGLE", x: 720, y: 600, width: 80, height: 80, rotation: 0, capacity: 4 },
    ],
    walls: [],
  },
  {
    name: "Large Dining Hall",
    sectionType: "INDOOR",
    width: 1600,
    height: 1200,
    tables: (function () {
      const arr: FloorPreset["tables"] = [];
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 5; col++) {
          arr.push({
            label: `T${row * 5 + col + 1}`,
            shape: "RECTANGLE",
            x: 150 + col * 280,
            y: 150 + row * 260,
            width: 100,
            height: 100,
            rotation: 0,
            capacity: 6,
          });
        }
      }
      return arr;
    })(),
    walls: [],
  },
  {
    name: "Small Patio",
    sectionType: "OUTDOOR",
    width: 800,
    height: 600,
    tables: [
      { label: "P1", shape: "CIRCLE", x: 150, y: 150, width: 80, height: 80, rotation: 0, capacity: 2 },
      { label: "P2", shape: "CIRCLE", x: 400, y: 150, width: 80, height: 80, rotation: 0, capacity: 2 },
      { label: "P3", shape: "CIRCLE", x: 150, y: 400, width: 80, height: 80, rotation: 0, capacity: 2 },
      { label: "P4", shape: "CIRCLE", x: 400, y: 400, width: 80, height: 80, rotation: 0, capacity: 2 },
    ],
    walls: [],
  },
  {
    name: "Large Patio",
    sectionType: "OUTDOOR",
    width: 1200,
    height: 1000,
    tables: [
      { label: "P1", shape: "CIRCLE", x: 150, y: 150, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P2", shape: "CIRCLE", x: 400, y: 150, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P3", shape: "CIRCLE", x: 650, y: 150, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P4", shape: "CIRCLE", x: 900, y: 150, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P5", shape: "CIRCLE", x: 150, y: 450, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P6", shape: "CIRCLE", x: 400, y: 450, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P7", shape: "CIRCLE", x: 650, y: 450, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P8", shape: "CIRCLE", x: 900, y: 450, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P9", shape: "CIRCLE", x: 150, y: 750, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P10", shape: "CIRCLE", x: 400, y: 750, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P11", shape: "CIRCLE", x: 650, y: 750, width: 80, height: 80, rotation: 0, capacity: 4 },
      { label: "P12", shape: "CIRCLE", x: 900, y: 750, width: 80, height: 80, rotation: 0, capacity: 4 },
    ],
    walls: [],
  },
  {
    name: "Bar Counter",
    sectionType: "BAR",
    width: 600,
    height: 300,
    tables: [
      { label: "B1", shape: "RECTANGLE", x: 40, y: 100, width: 60, height: 60, rotation: 0, capacity: 2 },
      { label: "B2", shape: "RECTANGLE", x: 130, y: 100, width: 60, height: 60, rotation: 0, capacity: 2 },
      { label: "B3", shape: "RECTANGLE", x: 220, y: 100, width: 60, height: 60, rotation: 0, capacity: 2 },
      { label: "B4", shape: "RECTANGLE", x: 310, y: 100, width: 60, height: 60, rotation: 0, capacity: 2 },
      { label: "B5", shape: "RECTANGLE", x: 400, y: 100, width: 60, height: 60, rotation: 0, capacity: 2 },
      { label: "B6", shape: "RECTANGLE", x: 490, y: 100, width: 60, height: 60, rotation: 0, capacity: 2 },
    ],
    walls: [{ x1: 20, y1: 180, x2: 580, y2: 180 }],
  },
  {
    name: "Private Room",
    sectionType: "PRIVATE",
    width: 600,
    height: 500,
    tables: [
      { label: "VIP", shape: "SQUARE", x: 200, y: 150, width: 120, height: 120, rotation: 0, capacity: 10, minCapacity: 6 },
    ],
    walls: [
      { x1: 0, y1: 0, x2: 600, y2: 0 },
      { x1: 600, y1: 0, x2: 600, y2: 500 },
      { x1: 600, y1: 500, x2: 0, y2: 500 },
      { x1: 0, y1: 500, x2: 0, y2: 0 },
    ],
  },
];
