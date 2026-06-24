import level1 from "@/assets/puzzles/level-1.jpg";
import level2 from "@/assets/puzzles/level-2.jpg";
import level3 from "@/assets/puzzles/level-3.jpg";
import level4 from "@/assets/puzzles/level-4.jpg";
import level5 from "@/assets/puzzles/level-5.jpg";
import level6 from "@/assets/puzzles/level-6.jpg";

export interface PuzzleLevel {
  level: number;
  name: string;
  grid: number; // NxN
  image: string;
  description: string;
}

export const LEVELS: PuzzleLevel[] = [
  { level: 1, name: "Sunset Shore", grid: 3, image: level1, description: "A gentle warm-up. 9 pieces with rotation." },
  { level: 2, name: "Winter Fox", grid: 4, image: level2, description: "16 pieces. Mind the rotation." },
  { level: 3, name: "Aurora Peaks", grid: 5, image: level3, description: "25 pieces. The sky tells the story." },
  { level: 4, name: "Sky Drifters", grid: 6, image: level4, description: "36 pieces. Float through the colours." },
  { level: 5, name: "Coral Depths", grid: 7, image: level5, description: "49 pieces. Look for the currents." },
  { level: 6, name: "Neon Avenue", grid: 8, image: level6, description: "64 pieces. The ultimate test." },
];

export function getLevel(n: number): PuzzleLevel | undefined {
  return LEVELS.find((l) => l.level === n);
}

// Scoring: base = grid^2 * 100, decay by 1% per second, floor at 10% of base.
export function computeScore(level: PuzzleLevel, timeSeconds: number): number {
  const base = level.grid * level.grid * 100;
  const decayed = Math.round(base * Math.max(0.1, 1 - timeSeconds * 0.01));
  return Math.max(Math.round(base * 0.1), decayed);
}
