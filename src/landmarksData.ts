import { LandmarkNode } from "./types";

export const LANDMARKS: LandmarkNode[] = [
  {
    id: "paradox-gate",
    name: "The Gate of Paradox",
    discipline: "Logic & Math",
    description: "Ponder on the edges of formal truth.",
    x: 540,
    y: 580,
    solved: false,
    color: "#a855f7", // Purple
    icon: "gate",
    glowingColor: "rgba(168, 85, 247, 0.8)",
    hint: "Solve the riddle of self-reference.",
    details: "A towering gate made of deep amethyst obsidian, pulsing with a mathematical glow. It is inscribed with the statement: 'The sentence you are reading is false.'"
  },
  {
    id: "infinitude",
    name: "The Infinitude Monolith",
    discipline: "Logic & Math",
    description: "Discover Cantor's paradise of transfinite sets.",
    x: 690,
    y: 840,
    solved: false,
    color: "#c084fc", // Light Purple
    icon: "crystal",
    glowingColor: "rgba(192, 132, 252, 0.8)",
    hint: "Learn how some infinities dwarf others.",
    details: "A fractal crystal prism refracting infinite beams of light. Countless tiny equations float around its apex, orbiting the conceptual levels of transfinite numbers."
  },
  {
    id: "invisible-hand",
    name: "The Invisible Hand Bazaar",
    discipline: "Economics",
    description: "Explore the self-regulating forces of self-interest.",
    x: 2580,
    y: 550,
    solved: false,
    color: "#22c55e", // Green
    icon: "coin",
    glowingColor: "rgba(34, 197, 94, 0.8)",
    hint: "Discover how individual choices aggregate.",
    details: "A lively bustling pixel marketplace with trading stalls, governed by a giant golden floating scale that perfectly aligns supply and demand."
  },
  {
    id: "game-arena",
    name: "The Game Theory Arena",
    discipline: "Economics",
    description: "Master strategic interaction and prisoner payoffs.",
    x: 2750,
    y: 850,
    solved: false,
    color: "#4ade80", // Light Green
    icon: "shield",
    glowingColor: "rgba(74, 222, 128, 0.8)",
    hint: "Solve the Prisoner's Dilemma.",
    details: "Two solid titanium cell walls facing each other across a chessboard floor. A mathematical glyph of the payoff matrix orbits overhead, flashing orange and green."
  },
  {
    id: "cave-shadows",
    name: "The Cave of Shadows",
    discipline: "Philosophy",
    description: "Question the true nature of your reality.",
    x: 1320,
    y: 1820,
    solved: false,
    color: "#3b82f6", // Blue / Misty
    icon: "hourglass",
    glowingColor: "rgba(59, 130, 246, 0.8)",
    hint: "Contrast the shadows of perceptions with realities.",
    details: "An archaic cave opening draped in high-density gray fog. Inside, flame shadows of geometric shapes play on a monolithic slate wall."
  },
  {
    id: "golden-mean",
    name: "The Golden Mean Lyceum",
    discipline: "Philosophy",
    description: "Seek alignment between extremes of virtue and vice.",
    x: 1850,
    y: 1880,
    solved: false,
    color: "#60a5fa", // Light Blue
    icon: "scroll",
    glowingColor: "rgba(96, 165, 250, 0.8)",
    hint: "Walk the tightrope of balance in ethical choices.",
    details: "A classical greek marble temple perched on a rocky summit. Behind the rows of columns, a balance pole and scroll float gently, surrounded by glowing wisps of wind."
  }
];
