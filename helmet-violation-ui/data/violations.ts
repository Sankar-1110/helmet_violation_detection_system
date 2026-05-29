export interface Violation {
  id: string;
  plate: string;
  helmet: "helmet" | "no_helmet";
  ocrStatus: "readable" | "unreadable";
  confidence: number;
  image: string;
  time: string;
}

export const violations: Violation[] = [
  {
    id: "1",
    plate: "KA05MK3334",
    helmet: "no_helmet",
    ocrStatus: "readable",
    confidence: 0.87,
    image: "/sample.jpg",
    time: "10:23 AM",
  },
  {
    id: "2",
    plate: "TN10AP4501",
    helmet: "no_helmet",
    ocrStatus: "readable",
    confidence: 0.81,
    image: "/sample.jpg",
    time: "10:20 AM",
  },
  {
    id: "3",
    plate: "—",
    helmet: "no_helmet",
    ocrStatus: "unreadable",
    confidence: 0.52,
    image: "/sample.jpg",
    time: "10:15 AM",
  },
  {
    id: "4",
    plate: "MH12XY5678",
    helmet: "helmet",
    ocrStatus: "readable",
    confidence: 0.93,
    image: "/sample.jpg",
    time: "10:10 AM",
  },
];
export const chartDataByTime = [
  { time: "10:00", violations: 1 },
  { time: "10:05", violations: 2 },
  { time: "10:10", violations: 1 },
  { time: "10:15", violations: 3 },
  { time: "10:20", violations: 2 },
];

export const chartDataByHelmet = [
  { name: "Helmet", value: 1 },
  { name: "No Helmet", value: 3 },
];

