// Meta-Assets Generator & Stitching Engine for FieldVoyager
// Pre-renders high-end pixel-art tiles and scenery props onto offscreen canvas caches.

export type TileType =
  | "deep_water"
  | "river_water"
  | "sand"
  | "cyber_grass"
  | "agrarian_grass"
  | "slate_stone"
  | "bridge";

export interface TileDef {
  type: TileType;
  x: number; // grid x
  y: number; // grid y
}

// 100 col x 80 row matrix for a beautiful massive 3200x2560 overworld (32x32 pixel tiles)
export const TILE_SIZE = 32;
export const MAP_COLS = 100;
export const MAP_ROWS = 80;

// Helper to calculate the river center line and whether it is a bridge row
export function getRiverInfo(c: number, r: number) {
  let riverCenter = 50;
  let isBridgeRow = false;

  if (r >= 35) {
    // South vertical branch
    riverCenter = 50 + Math.sin(r * 0.14) * 2.8;
    isBridgeRow = r >= 54 && r <= 56;
    const dist = Math.abs(c - riverCenter);
    return { dist, isBridgeRow };
  } else {
    // NW or NE branch depending on which side of the center we are on
    const targetNE = c >= 50;
    if (targetNE) {
      // Northeast arm
      riverCenter = 100 - r * (50 / 35) - Math.sin(r * 0.16) * 2.5;
      isBridgeRow = r >= 16 && r <= 18;
    } else {
      // Northwest arm
      riverCenter = r * (50 / 35) + Math.sin(r * 0.16) * 2.5;
      isBridgeRow = r >= 16 && r <= 18;
    }
    const dist = Math.abs(c - riverCenter);
    return { dist, isBridgeRow };
  }
}

// Procedural organic map definition representing the massive triple-continent archipelago
export function generateTileMap(): TileType[][] {
  const map: TileType[][] = [];

  for (let r = 0; r < MAP_ROWS; r++) {
    const row: TileType[] = [];
    for (let c = 0; c < MAP_COLS; c++) {
      // 1. Sea boundary at the absolute very outer edges of the map
      if (c < 2 || c > 97 || r < 2 || r > 77) {
        row.push("deep_water");
        continue;
      }

      // 2. River and Bridges checks
      const info = getRiverInfo(c, r);
      if (info.dist < 1.6) {
        if (info.isBridgeRow) {
          row.push("bridge");
        } else {
          row.push("river_water");
        }
        continue;
      }

      // 3. Sandy riverbanks
      if (info.dist >= 1.6 && info.dist < 2.5) {
        row.push("sand");
        continue;
      }

      // 4. Biome Partition (Voronoi classification using land centers)
      // Center A (Logic): c: 20, r: 24 (approx x: 640, y: 768)
      // Center B (Economics): c: 80, r: 24 (approx x: 2560, y: 768)
      // Center C (Philosophy): c: 50, r: 61 (approx x: 1600, y: 1952)
      const distA = Math.hypot(c - 20, r - 24);
      const distB = Math.hypot(c - 80, r - 24);
      const distC = Math.hypot(c - 50, r - 61);

      const minDist = Math.min(distA, distB, distC);

      if (minDist === distC) {
        row.push("slate_stone");
      } else if (minDist === distA) {
        row.push("cyber_grass");
      } else {
        row.push("agrarian_grass");
      }
    }
    map.push(row);
  }

  return map;
}

// Global asset cache after canvas compilation
export interface MetaAssetsCache {
  tiles: Record<TileType, HTMLCanvasElement>;
  landscapeProps: {
    cyberSpire: HTMLCanvasElement;
    cozyCottage: HTMLCanvasElement;
    classicalTemple: HTMLCanvasElement;
    oakTree: HTMLCanvasElement;
    pineTree: HTMLCanvasElement;
    neonCrystalTree: HTMLCanvasElement;
    shrineBrazier: HTMLCanvasElement[]; // Animated multi-frame fire
    cloud: HTMLCanvasElement;
  };
}

let assetCache: MetaAssetsCache | null = null;

// Initialize and compile all metadata assets on load
export function getMetaAssets(): MetaAssetsCache {
  if (assetCache) return assetCache;

  const tiles: Record<TileType, HTMLCanvasElement> = {} as any;
  const tileTypes: TileType[] = [
    "deep_water",
    "river_water",
    "sand",
    "cyber_grass",
    "agrarian_grass",
    "slate_stone",
    "bridge",
  ];

  tileTypes.forEach((type) => {
    const canvas = document.createElement("canvas");
    canvas.width = TILE_SIZE;
    canvas.height = TILE_SIZE;
    const ctx = canvas.getContext("2d")!;

    // Compile each individual custom tile texture
    switch (type) {
      case "deep_water":
        // Base navy ocean
        ctx.fillStyle = "#0c1524";
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        // Foam grid lines
        ctx.fillStyle = "rgba(22, 40, 64, 0.4)";
        ctx.fillRect(4, 8, 8, 2);
        ctx.fillRect(16, 20, 10, 2);
        ctx.fillRect(2, 26, 6, 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
        ctx.fillRect(10, 10, 4, 1);
        ctx.fillRect(22, 22, 3, 1);
        break;

      case "river_water":
        // Radiant skyblue current
        ctx.fillStyle = "#29b6f6";
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        // Flow ripples
        ctx.fillStyle = "#e0f2fe";
        ctx.fillRect(4, 4, 12, 2);
        ctx.fillRect(16, 16, 8, 2);
        ctx.fillRect(8, 24, 14, 2);
        // Highlight speckles
        ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
        ctx.fillRect(8, 6, 2, 1);
        ctx.fillRect(20, 18, 2, 1);
        ctx.fillRect(12, 26, 2, 1);
        break;

      case "sand":
        // Bright beach sand base
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        // Dynamic tiny speckles
        ctx.fillStyle = "#eab308";
        ctx.fillRect(3, 4, 2, 2);
        ctx.fillRect(18, 12, 1.5, 1.5);
        ctx.fillRect(10, 24, 2, 2);
        ctx.fillRect(24, 20, 1.5, 1.5);
        // Little orange-red seashells
        ctx.fillStyle = "#fb7185";
        ctx.fillRect(14, 8, 3, 2);
        ctx.fillRect(6, 18, 2, 3);
        break;

      case "cyber_grass":
        // Deep amethyst obsidian matrix floor
        ctx.fillStyle = "#1e053a";
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        // Circuit lines
        ctx.fillStyle = "rgba(168, 85, 247, 0.3)";
        ctx.fillRect(0, 8, TILE_SIZE, 1.5);
        ctx.fillRect(12, 0, 1.5, TILE_SIZE);
        ctx.fillRect(12, 20, TILE_SIZE - 12, 1.5);
        // Neon green nodes
        ctx.fillStyle = "#a855f7";
        ctx.fillRect(12, 8, 3, 3);
        ctx.fillRect(24, 20, 3, 3);
        ctx.fillStyle = "#e9d5ff";
        ctx.fillRect(13, 9, 1, 1);
        ctx.fillRect(25, 21, 1, 1);
        break;

      case "agrarian_grass":
        // Lush rich green Stardew grass
        ctx.fillStyle = "#15803d";
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        // Highlight grass blades
        ctx.fillStyle = "#166534";
        ctx.fillRect(4, 6, 2, 5);
        ctx.fillRect(5, 4, 1.5, 4);
        ctx.fillRect(18, 20, 2, 5);
        ctx.fillRect(26, 12, 1.5, 3.5);
        // Little yellow buttercups
        ctx.fillStyle = "#facc15";
        ctx.fillRect(10, 16, 2, 2);
        ctx.fillRect(22, 24, 2, 2);
        break;

      case "slate_stone":
        // Ancient stony gray
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        // Cobble border highlights
        ctx.fillStyle = "#334155";
        ctx.fillRect(0, 0, TILE_SIZE, 3);
        ctx.fillRect(0, 0, 3, TILE_SIZE);
        ctx.fillRect(16, 0, 3, TILE_SIZE);
        ctx.fillRect(0, 16, TILE_SIZE, 3);
        // White marble cracks
        ctx.fillStyle = "rgba(241, 245, 249, 0.15)";
        ctx.fillRect(6, 6, 8, 1);
        ctx.fillRect(10, 6, 1, 6);
        ctx.fillRect(22, 20, 6, 1);
        break;

      case "bridge":
        // Mahogany wooden frame
        ctx.fillStyle = "#451a03";
        ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
        // Plank panels
        ctx.fillStyle = "#7c2d12";
        ctx.fillRect(0, 3, TILE_SIZE, 6);
        ctx.fillRect(0, 12, TILE_SIZE, 6);
        ctx.fillRect(0, 21, TILE_SIZE, 6);
        // Iron nails
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(2, 5, 2, 2);
        ctx.fillRect(TILE_SIZE - 4, 5, 2, 2);
        ctx.fillRect(2, 14, 2, 2);
        ctx.fillRect(TILE_SIZE - 4, 14, 2, 2);
        ctx.fillRect(2, 23, 2, 2);
        ctx.fillRect(TILE_SIZE - 4, 23, 2, 2);
        break;
    }

    tiles[type] = canvas;
  });

  // Pre-render rich Landscape Props
  // 1. Cyber Spire (Futuristic Glass)
  const cyberSpire = document.createElement("canvas");
  cyberSpire.width = 48;
  cyberSpire.height = 72;
  const csCtx = cyberSpire.getContext("2d")!;
  // Draw base shadow
  csCtx.fillStyle = "rgba(0,0,0,0.3)";
  csCtx.beginPath();
  csCtx.ellipse(24, 60, 16, 6, 0, 0, Math.PI * 2);
  csCtx.fill();
  // Main stem (translucent purple shield)
  csCtx.fillStyle = "#3b0764";
  csCtx.fillRect(18, 15, 12, 45);
  // Glass highlight
  csCtx.fillStyle = "#a855f7";
  csCtx.fillRect(18, 15, 4, 45);
  csCtx.fillStyle = "#ff007f";
  csCtx.fillRect(28, 15, 2, 45);
  // Cap + glowing crystal
  csCtx.fillStyle = "#fdf4ff";
  csCtx.fillRect(22, 6, 4, 10);
  csCtx.fillStyle = "#ec4899";
  csCtx.beginPath();
  csCtx.moveTo(24, 0);
  csCtx.lineTo(28, 6);
  csCtx.lineTo(20, 6);
  csCtx.closePath();
  csCtx.fill();

  // 2. Cozy Cottage with Red Roof
  const cozyCottage = document.createElement("canvas");
  cozyCottage.width = 64;
  cozyCottage.height = 48;
  const ccCtx = cozyCottage.getContext("2d")!;
  // Shadow
  ccCtx.fillStyle = "rgba(0,0,0,0.25)";
  ccCtx.fillRect(2, 40, 60, 6);
  // Walls (Oak wood tone)
  ccCtx.fillStyle = "#fef3c7";
  ccCtx.fillRect(8, 20, 48, 22);
  // Horizontal beams
  ccCtx.fillStyle = "#7c2d12";
  ccCtx.fillRect(8, 20, 48, 3);
  ccCtx.fillRect(8, 30, 48, 3);
  // Main Roof (Stardew Red Terracotta Tile)
  ccCtx.fillStyle = "#b91c1c";
  ccCtx.beginPath();
  ccCtx.moveTo(4, 20);
  ccCtx.lineTo(60, 20);
  ccCtx.lineTo(32, 4);
  ccCtx.closePath();
  ccCtx.fill();
  // Roof borders
  ccCtx.fillStyle = "#7f1d1d";
  ccCtx.fillRect(4, 19, 56, 2);
  // Doorway
  ccCtx.fillStyle = "#451a03";
  ccCtx.fillRect(24, 26, 12, 16);
  ccCtx.fillStyle = "#fbbf24"; // Knob
  ccCtx.fillRect(32, 33, 2, 2);
  // Windows with warm glow
  ccCtx.fillStyle = "#facc15";
  ccCtx.fillRect(14, 25, 6, 6);
  ccCtx.fillRect(44, 25, 6, 6);
  ccCtx.fillStyle = "rgba(0,0,0,0.2)";
  ccCtx.fillRect(14, 25, 6, 1.5);
  ccCtx.fillRect(44, 25, 6, 1.5);
  ccCtx.fillRect(17, 25, 1, 6);
  ccCtx.fillRect(47, 25, 1, 6);

  // 3. Classical Olympian Temple
  const classicalTemple = document.createElement("canvas");
  classicalTemple.width = 80;
  classicalTemple.height = 64;
  const ctCtx = classicalTemple.getContext("2d")!;
  // Shadow
  ctCtx.fillStyle = "rgba(0,0,0,0.25)";
  ctCtx.fillRect(4, 54, 72, 6);
  // Stairs base
  ctCtx.fillStyle = "#cbd5e1";
  ctCtx.fillRect(8, 46, 64, 8);
  ctCtx.fillStyle = "#94a3b8";
  ctCtx.fillRect(12, 40, 56, 6);
  // Pillars (Fluted classical lines)
  ctCtx.fillStyle = "#f1f5f9";
  for (let p = 0; p < 5; p++) {
    const px = 16 + p * 11;
    ctCtx.fillRect(px, 18, 5, 22);
    // Shadows on pillars
    ctCtx.fillStyle = "#cbd5e1";
    ctCtx.fillRect(px + 4, 18, 1, 22);
    ctCtx.fillStyle = "#f1f5f9";
  }
  // Architrave block
  ctCtx.fillStyle = "#e2e8f0";
  ctCtx.fillRect(12, 14, 56, 4);
  // Spire Pediment Triangle
  ctCtx.fillStyle = "#cbd5e1";
  ctCtx.beginPath();
  ctCtx.moveTo(10, 14);
  ctCtx.lineTo(70, 14);
  ctCtx.lineTo(40, 1);
  ctCtx.closePath();
  ctCtx.fill();
  // Golden shield seal
  ctCtx.fillStyle = "#facc15";
  ctCtx.beginPath();
  ctCtx.arc(40, 9, 3, 0, Math.PI * 2);
  ctCtx.fill();

  // 4. Tree Assets (with shadows and highlight tiers)
  // Oak Tree (Warm green foliage)
  const oakTree = document.createElement("canvas");
  oakTree.width = 36;
  oakTree.height = 48;
  const otCtx = oakTree.getContext("2d")!;
  // Shadow
  otCtx.fillStyle = "rgba(0,0,0,0.25)";
  otCtx.beginPath();
  otCtx.ellipse(18, 44, 10, 4, 0, 0, Math.PI * 2);
  otCtx.fill();
  // Trunk
  otCtx.fillStyle = "#5c2e0b";
  otCtx.fillRect(16, 28, 4, 14);
  // Branches
  otCtx.fillRect(13, 22, 10, 2);
  // Leaves level 1 (Darker green background)
  otCtx.fillStyle = "#15803d";
  otCtx.beginPath();
  otCtx.arc(18, 18, 14, 0, Math.PI * 2);
  otCtx.fill();
  // Leaves level 2 (Middle lighter green)
  otCtx.fillStyle = "#22c55e";
  otCtx.beginPath();
  otCtx.arc(15, 14, 10, 0, Math.PI * 2);
  otCtx.arc(22, 15, 9, 0, Math.PI * 2);
  otCtx.fill();
  // Highlight blossoms (Golden sparkles)
  otCtx.fillStyle = "#facc15";
  otCtx.fillRect(12, 10, 2, 2);
  otCtx.fillRect(24, 14, 2, 2);

  // Pine Tree (Nordic pointy triangle)
  const pineTree = document.createElement("canvas");
  pineTree.width = 32;
  pineTree.height = 48;
  const ptCtx = pineTree.getContext("2d")!;
  // Shadow
  ptCtx.fillStyle = "rgba(0,0,0,0.25)";
  ptCtx.beginPath();
  ptCtx.ellipse(16, 44, 8, 3.5, 0, 0, Math.PI * 2);
  ptCtx.fill();
  // Trunk
  ptCtx.fillStyle = "#451a03";
  ptCtx.fillRect(14, 32, 4, 11);
  // Foliage tier 1 (Lower shelf)
  ptCtx.fillStyle = "#14532d";
  ptCtx.beginPath();
  ptCtx.moveTo(4, 30);
  ptCtx.lineTo(28, 30);
  ptCtx.lineTo(16, 18);
  ptCtx.closePath();
  ptCtx.fill();
  // Foliage tier 2 (Middle shelf)
  ptCtx.fillStyle = "#166534";
  ptCtx.beginPath();
  ptCtx.moveTo(6, 22);
  ptCtx.lineTo(26, 22);
  ptCtx.lineTo(16, 10);
  ptCtx.closePath();
  ptCtx.fill();
  // Foliage tier 3 (Crown peak)
  ptCtx.fillStyle = "#15803d";
  ptCtx.beginPath();
  ptCtx.moveTo(8, 12);
  ptCtx.lineTo(24, 12);
  ptCtx.lineTo(16, 2);
  ptCtx.closePath();
  ptCtx.fill();

  // Neon Crystal Tree (Logic planet sakura crystal tree)
  const neonCrystalTree = document.createElement("canvas");
  neonCrystalTree.width = 32;
  neonCrystalTree.height = 48;
  const nctCtx = neonCrystalTree.getContext("2d")!;
  // Shadow
  nctCtx.fillStyle = "rgba(0,0,0,0.25)";
  nctCtx.beginPath();
  nctCtx.ellipse(16, 44, 9, 3.5, 0, 0, Math.PI * 2);
  nctCtx.fill();
  // Trunk
  nctCtx.fillStyle = "#3b0764";
  nctCtx.fillRect(15, 30, 3, 13);
  // Crystal core canopy
  nctCtx.fillStyle = "#86198f";
  nctCtx.beginPath();
  nctCtx.arc(16, 18, 12, 0, Math.PI * 2);
  nctCtx.fill();
  // Cyan glowing highlights
  nctCtx.fillStyle = "#22d3ee";
  nctCtx.beginPath();
  nctCtx.arc(12, 14, 8, 0, Math.PI * 2);
  nctCtx.fill();
  nctCtx.fillStyle = "#d946ef";
  nctCtx.beginPath();
  nctCtx.arc(20, 16, 7, 0, Math.PI * 2);
  nctCtx.fill();

  // 5. Fire Shrines / Braziers (Animated 4 frames)
  const shrineBrazier: HTMLCanvasElement[] = [];
  for (let f = 0; f < 4; f++) {
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 24;
    const bCtx = c.getContext("2d")!;
    // Stone base pillar
    bCtx.fillStyle = "#475569";
    bCtx.fillRect(5, 12, 6, 10);
    bCtx.fillStyle = "#334155";
    bCtx.fillRect(4, 10, 8, 2);
    // Real flames! Change height and width according to frame
    const fireHeight = 6 + (f % 2) * 2;
    const fireWidth = 4 + (f % 3);
    const fx = 8 - fireWidth / 2;
    const fy = 10 - fireHeight;
    // Glowing orange coal
    bCtx.fillStyle = "#f97316";
    bCtx.fillRect(fx, fy, fireWidth, fireHeight);
    // Yellow flame heart
    bCtx.fillStyle = "#facc15";
    bCtx.fillRect(fx + 1, fy + 2, fireWidth - 2, fireHeight - 2);
    // Red crown tips
    bCtx.fillStyle = "#ef4444";
    bCtx.fillRect(fx + 1.5, fy, 1, 1.5);

    shrineBrazier.push(c);
  }

  // 6. Fluffy White Cloud Sprite
  const cloud = document.createElement("canvas");
  cloud.width = 96;
  cloud.height = 36;
  const cloudCtx = cloud.getContext("2d")!;
  cloudCtx.fillStyle = "rgba(255, 255, 255, 0.55)";
  cloudCtx.beginPath();
  cloudCtx.arc(24, 20, 12, 0, Math.PI * 2);
  cloudCtx.arc(42, 16, 16, 0, Math.PI * 2);
  cloudCtx.arc(60, 20, 13, 0, Math.PI * 2);
  cloudCtx.arc(72, 22, 10, 0, Math.PI * 2);
  cloudCtx.closePath();
  cloudCtx.fill();

  assetCache = {
    tiles,
    landscapeProps: {
      cyberSpire,
      cozyCottage,
      classicalTemple,
      oakTree,
      pineTree,
      neonCrystalTree,
      shrineBrazier,
      cloud,
    },
  };

  return assetCache;
}

// Global drawing helpers to sew these parts onto active target canvases (with Spatial View Culling)
export function drawTileBackground(
  ctx: CanvasRenderingContext2D,
  mapMatrix: TileType[][],
  startX?: number,
  startY?: number,
  endX?: number,
  endY?: number
) {
  const assets = getMetaAssets();

  const startCol = startX !== undefined ? Math.max(0, Math.floor(startX / TILE_SIZE)) : 0;
  const endCol = endX !== undefined ? Math.min(MAP_COLS - 1, Math.ceil(endX / TILE_SIZE)) : MAP_COLS - 1;
  const startRow = startY !== undefined ? Math.max(0, Math.floor(startY / TILE_SIZE)) : 0;
  const endRow = endY !== undefined ? Math.min(MAP_ROWS - 1, Math.ceil(endY / TILE_SIZE)) : MAP_ROWS - 1;

  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const type = mapMatrix[r][c];
      const tileCanvas = assets.tiles[type];
      if (tileCanvas) {
        ctx.drawImage(tileCanvas, c * TILE_SIZE, r * TILE_SIZE);
      }
    }
  }
}
