export interface Position {
  x: number;
  y: number;
}

export interface LandmarkNode {
  id: string;
  name: string;
  discipline: string;
  description: string;
  x: number; // custom map X
  y: number; // custom map Y
  solved: boolean;
  color: string; // land outline or glowing spot color
  icon: "crystal" | "coin" | "hourglass" | "scroll" | "shield" | "gate";
  glowingColor: string;
  hint: string;
  details: string;
}

export interface Message {
  id: string;
  sender: "ai" | "user" | "system";
  text: string;
  timestamp: Date;
}

export interface PlayerStats {
  level: number;
  xp: number;
  xpNeeded: number;
  energy: number; // Thought Energy flame (0-100)
  activeDials: number; // completed challenges
}
