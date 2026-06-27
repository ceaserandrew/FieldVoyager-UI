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

// Calculate 3D height elevation for a given tile coordinate (c, r) in pixels
export function getElevation(c: number, r: number): number {
  if (c < 0 || c >= MAP_COLS || r < 0 || r >= MAP_ROWS) return 0;
  
  // Water channels stay at 0
  const info = getRiverInfo(c, r);
  if (info.dist <= 3.2 && !info.isBridgeRow) {
    return 0;
  }

  // Outer border water
  if (c <= 3 || c >= MAP_COLS - 4 || r <= 3 || r >= MAP_ROWS - 4) {
    return 0;
  }

  // Centers of our 3 core islands:
  const distLogic = Math.hypot(c - 20, r - 24);
  const distEcon = Math.hypot(c - 80, r - 24);
  const distPhil = Math.hypot(c - 50, r - 61);

  const minDist = Math.min(distLogic, distEcon, distPhil);

  if (minDist === distPhil) {
    if (distPhil < 8) return 56;  // Lyceum high peaks
    if (distPhil < 16) return 38; // Sanctuary terraces
    if (distPhil < 24) return 18; // Philosophical grass footholds
    return 8;
  } else if (minDist === distLogic) {
    if (distLogic < 10) return 32; // Core logic hexagonal platform
    if (distLogic < 18) return 16; // Binary math plateaus
    return 8;
  } else {
    if (distEcon < 12) return 24;  // Economic agora plateau
    if (distEcon < 20) return 16;  // Pumpkin farming terraces
    return 8;
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
  tiles: Record<TileType, HTMLCanvasElement[]>;
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

  const tiles: Record<TileType, HTMLCanvasElement[]> = {} as any;
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
    tiles[type] = [];
    for (let variant = 0; variant < 4; variant++) {
      const canvas = document.createElement("canvas");
      canvas.width = TILE_SIZE;
      canvas.height = TILE_SIZE;
      const ctx = canvas.getContext("2d")!;

      // Compile each individual custom tile texture
      switch (type) {
        case "deep_water": {
          // Warm Stardew marine indigo-teal gradient
          const oceanGrad = ctx.createLinearGradient(0, 0, TILE_SIZE, TILE_SIZE);
          if (variant === 1) {
            oceanGrad.addColorStop(0, "#08162d");
            oceanGrad.addColorStop(1, "#0c2040");
          } else {
            oceanGrad.addColorStop(0, "#0c2040");
            oceanGrad.addColorStop(1, "#122b54");
          }
          ctx.fillStyle = oceanGrad;
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

          // Subtle, wavy water currents
          ctx.strokeStyle = "rgba(43, 85, 145, 0.22)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (variant === 0 || variant === 2) {
            ctx.moveTo(2, 6);
            ctx.quadraticCurveTo(8, 10, 14, 6);
            ctx.moveTo(18, 20);
            ctx.quadraticCurveTo(24, 24, 30, 20);
          } else if (variant === 1) {
            ctx.moveTo(6, 4);
            ctx.quadraticCurveTo(12, 7, 18, 4);
            ctx.moveTo(10, 25);
            ctx.quadraticCurveTo(16, 28, 22, 25);
          } else {
            ctx.arc(16, 16, 10, 0, Math.PI * 2);
          }
          ctx.stroke();

          // Smooth low-contrast sun highlights
          ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
          ctx.fillRect(10, 8, 2, 2);
          ctx.fillRect(22, 22, 2, 2);
          break;
        }

        case "river_water": {
          // Bright cozy mountain river turquoise-teal flow gradient
          const riverGrad = ctx.createLinearGradient(0, 0, TILE_SIZE, TILE_SIZE);
          riverGrad.addColorStop(0, "#1a4c73");
          riverGrad.addColorStop(0.5, "#226496");
          riverGrad.addColorStop(1, "#3c8ab8");
          ctx.fillStyle = riverGrad;
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

          // Soft river ripples
          ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          if (variant === 0 || variant === 2) {
            ctx.moveTo(0, 8);
            ctx.quadraticCurveTo(10, 4, 20, 10);
            ctx.quadraticCurveTo(26, 14, TILE_SIZE, 8);
            ctx.moveTo(0, 22);
            ctx.quadraticCurveTo(12, 26, 22, 18);
            ctx.quadraticCurveTo(28, 14, TILE_SIZE, 22);
          } else if (variant === 1) {
            ctx.moveTo(8, 12);
            ctx.quadraticCurveTo(16, 16, 24, 12);
          } else { // Shallow river pebbles under water
            ctx.fillStyle = "rgba(139, 92, 26, 0.12)";
            ctx.beginPath();
            ctx.arc(8, 10, 3, 0, Math.PI * 2);
            ctx.arc(24, 18, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.moveTo(2, 16);
            ctx.lineTo(14, 16);
          }
          ctx.stroke();

          // Gentle glint
          ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
          ctx.fillRect(4, 14, 1.5, 1.5);
          ctx.fillRect(20, 6, 1.5, 1.5);
          break;
        }

        case "sand": {
          // Cozy warm pastel golden sand beach
          ctx.fillStyle = "#f6ebd0";
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

          // Soft sandy breeze waves
          ctx.strokeStyle = "#e8dab8";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, 12);
          ctx.quadraticCurveTo(8, 8, 16, 16);
          ctx.quadraticCurveTo(24, 24, TILE_SIZE, 12);
          ctx.stroke();

          // Soft organic beach debris (shells / pebbles / starfish)
          if (variant === 1) {
            // Little pink seashells
            ctx.fillStyle = "#f3a3b0";
            ctx.beginPath();
            ctx.moveTo(14, 14); ctx.lineTo(17, 11); ctx.lineTo(16, 16); ctx.closePath(); ctx.fill();
          } else if (variant === 2) {
            // Little smooth warm grey pebbles
            ctx.fillStyle = "#b4a895";
            ctx.beginPath();
            ctx.arc(10, 8, 2, 0, Math.PI * 2);
            ctx.arc(22, 18, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (variant === 3) {
            // Starfish
            ctx.fillStyle = "#e07a5f";
            ctx.beginPath();
            const cx = 16, cy = 16, r = 3.5;
            for (let i = 0; i < 5; i++) {
              const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
              ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
              const innerAngle = angle + Math.PI / 5;
              ctx.lineTo(cx + Math.cos(innerAngle) * (r * 0.4), cy + Math.sin(innerAngle) * (r * 0.4));
            }
            ctx.closePath();
            ctx.fill();
          }
          break;
        }

        case "cyber_grass": {
          // Lush autumn orange-gold forest floor
          const grad = ctx.createLinearGradient(0, 0, 0, TILE_SIZE);
          grad.addColorStop(0, "#c27a30");
          grad.addColorStop(1, "#ad621f");
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

          // Golden grass blade clusters
          ctx.fillStyle = "#dca15c";
          ctx.beginPath();
          ctx.moveTo(4, 14); ctx.quadraticCurveTo(3, 8, 1, 6); ctx.lineTo(2, 14); ctx.closePath();
          ctx.moveTo(22, 22); ctx.quadraticCurveTo(20, 16, 18, 14); ctx.lineTo(19, 22); ctx.closePath();
          ctx.fill();

          // Dark maple brown shadow blades
          ctx.fillStyle = "#8a4816";
          ctx.beginPath();
          ctx.moveTo(3, 14); ctx.lineTo(1, 9); ctx.lineTo(4, 14);
          ctx.fill();

          // Elegant fallen autumn maple leaves
          if (variant === 1) {
            // Cozy deep red leaf
            ctx.fillStyle = "#b91c1c";
            ctx.beginPath();
            ctx.arc(12, 10, 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#ea580c";
            ctx.fillRect(11, 9, 2, 2);
          } else if (variant === 2) {
            // Little golden acorn / orange leaf
            ctx.fillStyle = "#ea580c";
            ctx.beginPath();
            ctx.arc(24, 16, 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (variant === 3) {
            // Autumn wild mushrooms
            ctx.fillStyle = "#b45309"; // brown cap
            ctx.beginPath();
            ctx.arc(14, 18, 3, Math.PI, 0, false);
            ctx.fill();
            ctx.fillStyle = "#fef3c7"; // cream stem
            ctx.fillRect(13, 18, 2, 3);
          }
          break;
        }

        case "agrarian_grass": {
          // Lush warm spring-green meadow
          const grassGrad = ctx.createLinearGradient(0, 0, 0, TILE_SIZE);
          grassGrad.addColorStop(0, "#3d8c40");
          grassGrad.addColorStop(1, "#2a692d");
          ctx.fillStyle = grassGrad;
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

          // Soft green grass blades
          ctx.fillStyle = "#5cb860";
          ctx.beginPath();
          ctx.moveTo(6, 12); ctx.quadraticCurveTo(5, 6, 2, 4); ctx.lineTo(3, 12); ctx.closePath();
          ctx.moveTo(7, 12); ctx.quadraticCurveTo(8, 5, 11, 3); ctx.lineTo(8, 12); ctx.closePath();
          ctx.moveTo(22, 24); ctx.quadraticCurveTo(20, 18, 17, 16); ctx.lineTo(18, 24); ctx.closePath();
          ctx.fill();

          // Cozy pasture shadow grass
          ctx.fillStyle = "#1b4d1e";
          ctx.beginPath();
          ctx.moveTo(5, 12); ctx.lineTo(3, 7); ctx.lineTo(6, 12);
          ctx.moveTo(23, 24); ctx.lineTo(20, 19); ctx.lineTo(24, 24);
          ctx.fill();

          if (variant === 1) {
            // Little yellow dandelions / field daisies
            ctx.fillStyle = "#facc15"; // center
            ctx.fillRect(14, 8, 1.5, 1.5);
            ctx.fillStyle = "#ffffff"; // petals
            ctx.fillRect(12.5, 8, 1, 1.5);
            ctx.fillRect(15.5, 8, 1, 1.5);
            ctx.fillRect(14, 6.5, 1.5, 1);
            ctx.fillRect(14, 9.5, 1.5, 1);
          } else if (variant === 2) {
            // Clover patches
            ctx.fillStyle = "#73e082";
            ctx.beginPath();
            ctx.arc(12, 18, 1.5, 0, Math.PI * 2);
            ctx.arc(14.5, 18, 1.5, 0, Math.PI * 2);
            ctx.arc(13.2, 16.5, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (variant === 3) {
            // Red wild berries / forage mushrooms
            ctx.fillStyle = "#ef4444"; // cap
            ctx.beginPath();
            ctx.arc(24, 14, 2.5, Math.PI, 0, false);
            ctx.fill();
            ctx.fillStyle = "#f1f5f9"; // stem
            ctx.fillRect(23, 14, 2, 3);
          }
          break;
        }

        case "slate_stone": {
          // Soft slate grey cobblestone pathway
          ctx.fillStyle = "#2d3748";
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

          // Rounded flagstone masonry blocks
          ctx.fillStyle = "#4a5568";
          ctx.fillRect(1, 1, 14, 14);
          ctx.fillRect(17, 1, 14, 14);
          ctx.fillRect(1, 17, 14, 14);
          ctx.fillRect(17, 17, 14, 14);

          // Subtle stone top-bevel highlight
          ctx.fillStyle = "#718096";
          ctx.fillRect(1, 1, 14, 1.5); ctx.fillRect(1, 1, 1.5, 14);
          ctx.fillRect(17, 1, 14, 1.5); ctx.fillRect(17, 1, 1.5, 14);
          ctx.fillRect(1, 17, 14, 1.5); ctx.fillRect(1, 17, 1.5, 14);
          ctx.fillRect(17, 17, 14, 1.5); ctx.fillRect(17, 17, 1.5, 14);

          // Mossy stone crevices
          ctx.fillStyle = "#22543d";
          ctx.fillRect(0, 15, TILE_SIZE, 2);
          ctx.fillRect(15, 0, 2, TILE_SIZE);
          ctx.fillStyle = "#2f855a"; // moss spots
          ctx.fillRect(6, 15, 3, 1.5);
          ctx.fillRect(15, 9, 1.5, 4);

          if (variant === 1) {
            // Tiny stone cracks
            ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(3, 4); ctx.lineTo(7, 8); ctx.lineTo(11, 4);
            ctx.stroke();
          } else if (variant === 2) {
            // Little clover leaf on stone
            ctx.fillStyle = "#48bb78";
            ctx.beginPath();
            ctx.arc(22, 6, 1.5, 0, Math.PI * 2);
            ctx.arc(24, 6, 1.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (variant === 3) {
            // Earthy stone carving
            ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(8, 8, 3, 0, Math.PI * 2);
            ctx.stroke();
          }
          break;
        }

        case "bridge": {
          // Warm, gorgeous mahogany redwood planks
          ctx.fillStyle = "#4a2411";
          ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);

          const plankColors = ["#633118", "#723b1f", "#6b371b", "#7c4324"];
          for (let i = 0; i < 4; i++) {
            const py = 1 + i * 8;
            ctx.fillStyle = plankColors[i];
            ctx.fillRect(0, py, TILE_SIZE, 6.5);

            // Wood grain graining
            ctx.fillStyle = "rgba(0, 0, 0, 0.08)";
            ctx.fillRect(4, py + 2, 18, 1);
            ctx.fillRect(12, py + 4, 10, 1);

            // Light sheen highlight
            ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
            ctx.fillRect(0, py, TILE_SIZE, 1);

            if (variant === 1 && i === 3) {
              // Little green moss creepers on wood edge
              ctx.fillStyle = "#276749";
              ctx.fillRect(2, py + 1, 4, 2);
              ctx.fillRect(TILE_SIZE - 5, py + 1, 3, 2);
            }

            // Weathered wooden structural bolts
            ctx.fillStyle = "#4a5568";
            ctx.beginPath();
            ctx.arc(4, py + 3.5, 1, 0, Math.PI * 2);
            ctx.arc(TILE_SIZE - 4, py + 3.5, 1, 0, Math.PI * 2);
            ctx.fill();
          }
          break;
        }
      }

      tiles[type].push(canvas);
    }
  });

  // Pre-render rich Landscape Props
  // 1. Wizard Obelisk (Ancient stone carved tower pillar)
  const cyberSpire = document.createElement("canvas");
  cyberSpire.width = 48;
  cyberSpire.height = 72;
  const csCtx = cyberSpire.getContext("2d")!;
  
  // Shadow beneath obelisk
  const spireShadow = csCtx.createRadialGradient(24, 64, 2, 24, 64, 20);
  spireShadow.addColorStop(0, "rgba(0, 0, 0, 0.45)");
  spireShadow.addColorStop(1, "rgba(0, 0, 0, 0)");
  csCtx.fillStyle = spireShadow;
  csCtx.beginPath();
  csCtx.ellipse(24, 64, 18, 6, 0, 0, Math.PI * 2);
  csCtx.fill();

  // Ancient mossy stone brick pedestal base
  csCtx.fillStyle = "#2d3748"; // Dark slate foundation
  csCtx.fillRect(12, 54, 24, 10);
  csCtx.fillStyle = "#4a5568"; // Middle block
  csCtx.fillRect(14, 52, 20, 4);

  // Ivy creepers wrapping base
  csCtx.fillStyle = "#1c4530"; // Ivy dark green
  csCtx.fillRect(11, 56, 3, 8);
  csCtx.fillRect(34, 58, 3, 6);
  csCtx.fillStyle = "#38a169"; // Bright green ivy leaf spots
  csCtx.fillRect(10, 58, 2, 2);
  csCtx.fillRect(13, 55, 3, 2);
  csCtx.fillRect(33, 56, 2, 3);

  // Tapering Obelisk main shaft
  const spGrad = csCtx.createLinearGradient(16, 20, 32, 20);
  spGrad.addColorStop(0, "#4a5568");
  spGrad.addColorStop(0.3, "#718096"); // Highlights
  spGrad.addColorStop(0.7, "#4a5568");
  spGrad.addColorStop(1, "#2d3748");
  csCtx.fillStyle = spGrad;
  csCtx.beginPath();
  csCtx.moveTo(18, 16);
  csCtx.lineTo(30, 16);
  csCtx.lineTo(34, 52);
  csCtx.lineTo(14, 52);
  csCtx.closePath();
  csCtx.fill();

  // Carved golden runes flashing on shaft
  csCtx.strokeStyle = "#ecc94b"; // Golden light
  csCtx.lineWidth = 1.5;
  csCtx.beginPath();
  csCtx.moveTo(24, 22);
  csCtx.lineTo(24, 46);
  csCtx.moveTo(20, 30);
  csCtx.lineTo(28, 30);
  csCtx.moveTo(21, 38);
  csCtx.lineTo(27, 42);
  csCtx.stroke();

  // Floating Golden/Emerald Magic Core Star (Stardew wizard power)
  const coreGrad = csCtx.createRadialGradient(24, 12, 1, 24, 12, 14);
  coreGrad.addColorStop(0, "#ffffff");
  coreGrad.addColorStop(0.3, "#ecc94b"); // Warm gold
  coreGrad.addColorStop(0.7, "#b7791f"); // Amber
  coreGrad.addColorStop(1, "rgba(183, 121, 31, 0)");
  csCtx.fillStyle = coreGrad;
  csCtx.beginPath();
  csCtx.arc(24, 12, 12, 0, Math.PI * 2);
  csCtx.fill();

  // Star facets
  csCtx.fillStyle = "#fffbeb";
  csCtx.beginPath();
  csCtx.moveTo(24, 4);
  csCtx.lineTo(28, 12);
  csCtx.lineTo(24, 20);
  csCtx.lineTo(20, 12);
  csCtx.closePath();
  csCtx.fill();

  csCtx.fillStyle = "rgba(236, 201, 75, 0.6)";
  csCtx.beginPath();
  csCtx.moveTo(24, 4);
  csCtx.lineTo(24, 20);
  csCtx.lineTo(20, 12);
  csCtx.closePath();
  csCtx.fill();

  // 2. Cozy Cottage with Red Roof
  const cozyCottage = document.createElement("canvas");
  cozyCottage.width = 64;
  cozyCottage.height = 48;
  const ccCtx = cozyCottage.getContext("2d")!;
  
  // Soft ambient shadow under cottage
  ccCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ccCtx.beginPath();
  ccCtx.ellipse(32, 42, 28, 5, 0, 0, Math.PI * 2);
  ccCtx.fill();

  // Foundation: Rustic river-stone wall base (bottom part)
  ccCtx.fillStyle = "#4b5563"; // slate gray foundation
  ccCtx.fillRect(6, 32, 52, 10);
  
  // Draw mortar gaps
  ccCtx.strokeStyle = "#1f2937";
  ccCtx.lineWidth = 1;
  ccCtx.beginPath();
  for (let sx = 12; sx < 56; sx += 8) {
    ccCtx.moveTo(sx, 32);
    ccCtx.lineTo(sx, 42);
  }
  ccCtx.stroke();

  // Main walls: Cedarwood horizontal logs
  const woodShades = ["#d97706", "#b45309", "#92400e"];
  for (let r = 0; r < 4; r++) {
    ccCtx.fillStyle = woodShades[r % woodShades.length];
    ccCtx.fillRect(8, 18 + r * 3.5, 48, 3.5);
    // Draw fine separation line between logs
    ccCtx.fillStyle = "rgba(0,0,0,0.15)";
    ccCtx.fillRect(8, 18 + r * 3.5 + 3.0, 48, 0.5);
  }

  // Elegant stone chimney stack on the left side
  ccCtx.fillStyle = "#374151"; // dark graphite blocks
  ccCtx.fillRect(10, 2, 8, 18);
  ccCtx.fillStyle = "#111827"; // brick details
  ccCtx.fillRect(10, 2, 8, 2);
  ccCtx.fillRect(12, 8, 4, 3);

  // Beautiful Red-Orange Terracotta Clay Shingle Roof
  ccCtx.fillStyle = "#b91c1c"; // base crimson
  ccCtx.beginPath();
  ccCtx.moveTo(2, 18);
  ccCtx.lineTo(62, 18);
  ccCtx.lineTo(32, 2);
  ccCtx.closePath();
  ccCtx.fill();

  // Roof scale shingles overlay (gorgeous game-art effect)
  ccCtx.strokeStyle = "#7f1d1d";
  ccCtx.lineWidth = 1;
  ccCtx.beginPath();
  for (let ry = 6; ry < 18; ry += 3) {
    const rxStart = 2 + (ry - 2) * 1.5;
    const rxEnd = 62 - (ry - 2) * 1.5;
    for (let rx = rxStart; rx < rxEnd; rx += 5) {
      ccCtx.moveTo(rx, ry);
      ccCtx.quadraticCurveTo(rx + 2.5, ry + 2, rx + 5, ry);
    }
  }
  ccCtx.stroke();

  // Highlight on roof crest
  ccCtx.strokeStyle = "#f87171";
  ccCtx.lineWidth = 1.5;
  ccCtx.beginPath();
  ccCtx.moveTo(32, 2);
  ccCtx.lineTo(4, 18);
  ccCtx.moveTo(32, 2);
  ccCtx.lineTo(60, 18);
  ccCtx.stroke();

  // Arched Mahogany Entryway Door
  ccCtx.fillStyle = "#451a03";
  ccCtx.beginPath();
  ccCtx.arc(32, 33, 6, Math.PI, 0, false);
  ccCtx.fillRect(26, 33, 12, 9);
  ccCtx.fill();

  ccCtx.strokeStyle = "#78350f";
  ccCtx.lineWidth = 1;
  ccCtx.stroke();

  // Golden doorknob
  ccCtx.fillStyle = "#fbbf24";
  ccCtx.beginPath();
  ccCtx.arc(35, 36, 1, 0, Math.PI * 2);
  ccCtx.fill();

  // Circular glowing cottage window
  ccCtx.fillStyle = "rgba(0,0,0,0.3)";
  ccCtx.beginPath();
  ccCtx.arc(16, 26, 4.5, 0, Math.PI * 2);
  ccCtx.fill();

  // Warm amber lantern light spill
  const windowGlow = ccCtx.createRadialGradient(16, 26, 1, 16, 26, 4.5);
  windowGlow.addColorStop(0, "#ffffff");
  windowGlow.addColorStop(0.5, "#facc15");
  windowGlow.addColorStop(1, "#b45309");
  ccCtx.fillStyle = windowGlow;
  ccCtx.beginPath();
  ccCtx.arc(16, 26, 4, 0, Math.PI * 2);
  ccCtx.fill();

  // Window wooden frame cross
  ccCtx.strokeStyle = "#271104";
  ccCtx.lineWidth = 1;
  ccCtx.beginPath();
  ccCtx.moveTo(16, 22); ccCtx.lineTo(16, 30);
  ccCtx.moveTo(12, 26); ccCtx.lineTo(20, 26);
  ccCtx.stroke();

  // Same window on right side
  ccCtx.fillStyle = "rgba(0,0,0,0.3)";
  ccCtx.beginPath();
  ccCtx.arc(48, 26, 4.5, 0, Math.PI * 2);
  ccCtx.fill();
  ccCtx.fillStyle = windowGlow;
  ccCtx.beginPath();
  ccCtx.arc(48, 26, 4, 0, Math.PI * 2);
  ccCtx.fill();
  ccCtx.strokeStyle = "#271104";
  ccCtx.lineWidth = 1;
  ccCtx.beginPath();
  ccCtx.moveTo(48, 22); ccCtx.lineTo(48, 30);
  ccCtx.moveTo(44, 26); ccCtx.lineTo(52, 26);
  ccCtx.stroke();

  // 3. Classical Olympian Temple
  const classicalTemple = document.createElement("canvas");
  classicalTemple.width = 80;
  classicalTemple.height = 64;
  const ctCtx = classicalTemple.getContext("2d")!;
  
  // Ambient drop shadow under temple
  ctCtx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ctCtx.beginPath();
  ctCtx.ellipse(40, 56, 36, 6, 0, 0, Math.PI * 2);
  ctCtx.fill();

  // Marble base steps (3 layers for 3D depth)
  const stepColors = ["#cbd5e1", "#e2e8f0", "#f1f5f9"];
  for (let s = 0; s < 3; s++) {
    ctCtx.fillStyle = stepColors[s];
    ctCtx.fillRect(6 + s * 3, 44 + s * 4, 68 - s * 6, 4);
    // Draw steps shadow line
    ctCtx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctCtx.fillRect(6 + s * 3, 44 + s * 4 + 3, 68 - s * 6, 1);
  }

  // Ornate Corinthian Pillars (5 pillars)
  for (let p = 0; p < 5; p++) {
    const px = 14 + p * 12.5;

    // Pillar Shadow behind it
    ctCtx.fillStyle = "rgba(0, 0, 0, 0.18)";
    ctCtx.fillRect(px + 4, 18, 3, 26);

    // Pillar body: Marble gradient
    const pillarGrad = ctCtx.createLinearGradient(px, 18, px + 5, 18);
    pillarGrad.addColorStop(0, "#cbd5e1");
    pillarGrad.addColorStop(0.3, "#f8fafc");
    pillarGrad.addColorStop(0.7, "#e2e8f0");
    pillarGrad.addColorStop(1, "#cbd5e1");
    ctCtx.fillStyle = pillarGrad;
    ctCtx.fillRect(px, 18, 5, 26);

    // Pillar base and capital (detailed architectural caps)
    ctCtx.fillStyle = "#cbd5e1";
    ctCtx.fillRect(px - 1, 16, 7, 2); // Capital
    ctCtx.fillRect(px - 1, 42, 7, 2); // Base
  }

  // Heavy marble architrave beam
  const beamGrad = ctCtx.createLinearGradient(10, 10, 70, 10);
  beamGrad.addColorStop(0, "#cbd5e1");
  beamGrad.addColorStop(0.5, "#f1f5f9");
  beamGrad.addColorStop(1, "#cbd5e1");
  ctCtx.fillStyle = beamGrad;
  ctCtx.fillRect(10, 12, 60, 4);

  // Golden Greek Meander/Fret pattern on the frieze
  ctCtx.fillStyle = "#fbbf24";
  ctCtx.fillRect(12, 13, 56, 1);

  // Grand triangular pediment gable top
  ctCtx.fillStyle = "#cbd5e1";
  ctCtx.beginPath();
  ctCtx.moveTo(8, 12);
  ctCtx.lineTo(72, 12);
  ctCtx.lineTo(40, 2);
  ctCtx.closePath();
  ctCtx.fill();

  // Pediment heavy border trim
  ctCtx.strokeStyle = "#e2e8f0";
  ctCtx.lineWidth = 1.5;
  ctCtx.stroke();

  // Cast-shadow on the inner pediment triangle
  ctCtx.fillStyle = "rgba(0,0,0,0.15)";
  ctCtx.beginPath();
  ctCtx.moveTo(11, 11);
  ctCtx.lineTo(69, 11);
  ctCtx.lineTo(40, 4);
  ctCtx.closePath();
  ctCtx.fill();

  // Ornate glowing golden sun disc / medal medallion in center
  const goldGrad = ctCtx.createRadialGradient(40, 7.5, 0.5, 40, 7.5, 3.5);
  goldGrad.addColorStop(0, "#ffffff");
  goldGrad.addColorStop(0.4, "#facc15");
  goldGrad.addColorStop(1, "#b45309");
  ctCtx.fillStyle = goldGrad;
  ctCtx.beginPath();
  ctCtx.arc(40, 7.5, 3, 0, Math.PI * 2);
  ctCtx.fill();

  // 4. Tree Assets (with shadows and highlight tiers)
  // Oak Tree (Warm green foliage)
  const oakTree = document.createElement("canvas");
  oakTree.width = 36;
  oakTree.height = 48;
  const otCtx = oakTree.getContext("2d")!;
  
  // Organic drop shadow footprint
  otCtx.fillStyle = "rgba(0, 0, 0, 0.28)";
  otCtx.beginPath();
  otCtx.ellipse(18, 44, 11, 4, 0, 0, Math.PI * 2);
  otCtx.fill();

  // Trunk: Aged rustic Oak bark with natural splits
  const trunkGrad = otCtx.createLinearGradient(15, 26, 21, 26);
  trunkGrad.addColorStop(0, "#451a03");
  trunkGrad.addColorStop(0.5, "#78350f");
  trunkGrad.addColorStop(1, "#451a03");
  otCtx.fillStyle = trunkGrad;
  otCtx.fillRect(15, 26, 6, 16);

  // Moss on trunk base
  otCtx.fillStyle = "#15803d";
  otCtx.fillRect(15, 38, 2, 4);
  otCtx.fillRect(19, 40, 2, 2);

  // Foliage: Multiple organically overlapping rich green puffs with spherical volume shading
  // Layer 1: Dark base background puff
  otCtx.fillStyle = "#14532d";
  otCtx.beginPath();
  otCtx.arc(18, 16, 15, 0, Math.PI * 2);
  otCtx.arc(11, 22, 10, 0, Math.PI * 2);
  otCtx.arc(25, 21, 10, 0, Math.PI * 2);
  otCtx.fill();

  // Layer 2: Medium warm green body
  otCtx.fillStyle = "#15803d";
  otCtx.beginPath();
  otCtx.arc(17, 14, 12, 0, Math.PI * 2);
  otCtx.arc(12, 18, 8, 0, Math.PI * 2);
  otCtx.arc(23, 17, 8, 0, Math.PI * 2);
  otCtx.fill();

  // Layer 3: Vibrant lime highlights on top left (sun direction)
  otCtx.fillStyle = "#22c55e";
  otCtx.beginPath();
  otCtx.arc(14, 11, 9, 0, Math.PI * 2);
  otCtx.arc(9, 15, 6, 0, Math.PI * 2);
  otCtx.arc(20, 12, 6, 0, Math.PI * 2);
  otCtx.fill();

  // Layer 4: Bright yellow-green sun tipping
  otCtx.fillStyle = "#86efac";
  otCtx.beginPath();
  otCtx.arc(12, 9, 5, 0, Math.PI * 2);
  otCtx.arc(8, 13, 3.5, 0, Math.PI * 2);
  otCtx.fill();

  // Little ripe red forest apples/berries nesting in branches
  otCtx.fillStyle = "#ef4444";
  otCtx.beginPath();
  otCtx.arc(11, 16, 1.5, 0, Math.PI * 2);
  otCtx.arc(22, 21, 1.5, 0, Math.PI * 2);
  otCtx.arc(18, 11, 1.5, 0, Math.PI * 2);
  otCtx.arc(26, 14, 1.5, 0, Math.PI * 2);
  otCtx.fill();

  // Pine Tree (Nordic pointy triangle)
  const pineTree = document.createElement("canvas");
  pineTree.width = 32;
  pineTree.height = 48;
  const ptCtx = pineTree.getContext("2d")!;
  
  // Drop shadow footprint
  ptCtx.fillStyle = "rgba(0, 0, 0, 0.25)";
  ptCtx.beginPath();
  ptCtx.ellipse(16, 44, 9, 3.5, 0, 0, Math.PI * 2);
  ptCtx.fill();

  // Strong textured pine trunk
  const ptTrunkGrad = ptCtx.createLinearGradient(14, 30, 18, 30);
  ptTrunkGrad.addColorStop(0, "#271104");
  ptTrunkGrad.addColorStop(0.5, "#451a03");
  ptTrunkGrad.addColorStop(1, "#271104");
  ptCtx.fillStyle = ptTrunkGrad;
  ptCtx.fillRect(14, 30, 4, 13);

  // Foliage: Overlapping coniferous tier skirts (Lower, Mid, Crown) with shadow linings
  // Tier 1: Lower broad branches skirt
  ptCtx.fillStyle = "#064e3b"; // absolute deep green shadow
  ptCtx.beginPath();
  ptCtx.moveTo(2, 31);
  ptCtx.lineTo(30, 31);
  ptCtx.lineTo(16, 16);
  ptCtx.closePath();
  ptCtx.fill();

  // Highlight tips on Tier 1
  ptCtx.fillStyle = "#0f766e";
  ptCtx.beginPath();
  ptCtx.moveTo(3, 31);
  ptCtx.lineTo(16, 31);
  ptCtx.lineTo(16, 16);
  ptCtx.moveTo(29, 31);
  ptCtx.lineTo(16, 31);
  ptCtx.lineTo(16, 16);
  ptCtx.fill();

  // Tier 2: Mid-level skirt
  ptCtx.fillStyle = "#0f766e";
  ptCtx.beginPath();
  ptCtx.moveTo(4, 22);
  ptCtx.lineTo(28, 22);
  ptCtx.lineTo(16, 8);
  ptCtx.closePath();
  ptCtx.fill();

  // Mid highlight
  ptCtx.fillStyle = "#14b8a6";
  ptCtx.beginPath();
  ptCtx.moveTo(5, 22); ptCtx.lineTo(16, 22); ptCtx.lineTo(16, 8);
  ptCtx.fill();

  // Tier 3: Crown peak skirt
  ptCtx.fillStyle = "#115e59";
  ptCtx.beginPath();
  ptCtx.moveTo(6, 12);
  ptCtx.lineTo(26, 12);
  ptCtx.lineTo(16, 1);
  ptCtx.closePath();
  ptCtx.fill();

  ptCtx.fillStyle = "#2dd4bf"; // icy cyan/lime peak glint
  ptCtx.beginPath();
  ptCtx.moveTo(7, 12); ptCtx.lineTo(16, 12); ptCtx.lineTo(16, 1);
  ptCtx.fill();

  // Autumn Golden Maple Tree (Stardew-style cozy orange foliage)
  const neonCrystalTree = document.createElement("canvas");
  neonCrystalTree.width = 32;
  neonCrystalTree.height = 48;
  const nctCtx = neonCrystalTree.getContext("2d")!;
  
  // Soft organic shadow under tree
  nctCtx.fillStyle = "rgba(0, 0, 0, 0.35)";
  nctCtx.beginPath();
  nctCtx.ellipse(16, 44, 10, 4, 0, 0, Math.PI * 2);
  nctCtx.fill();

  // Cozy wooden organic trunk with bark shading
  const barkGrad = nctCtx.createLinearGradient(14, 28, 18, 28);
  barkGrad.addColorStop(0, "#4a2411");
  barkGrad.addColorStop(0.5, "#723b1f"); // warm light bark
  barkGrad.addColorStop(1, "#3c1505");
  nctCtx.fillStyle = barkGrad;
  nctCtx.fillRect(14, 28, 4, 15);

  // Tiny moss patches on bark
  nctCtx.fillStyle = "#276749";
  nctCtx.fillRect(14, 34, 1.5, 2);
  nctCtx.fillRect(16.5, 39, 1.5, 2.5);

  // Layered warm maple autumn foliage spheres
  // Base Deep Rust Red Layer
  const folGrad1 = nctCtx.createRadialGradient(16, 18, 2, 16, 18, 14);
  folGrad1.addColorStop(0, "#c2410c"); // fiery orange
  folGrad1.addColorStop(0.6, "#9a3412"); // deep rust
  folGrad1.addColorStop(1, "#7c2d12");   // dark auburn
  nctCtx.fillStyle = folGrad1;
  nctCtx.beginPath();
  nctCtx.arc(16, 18, 14, 0, Math.PI * 2);
  nctCtx.fill();

  // Golden Amber left puff
  const folGrad2 = nctCtx.createRadialGradient(12, 14, 1, 12, 14, 10);
  folGrad2.addColorStop(0, "#fef08a"); // sunlit yellow
  folGrad2.addColorStop(0.4, "#facc15"); // warm amber
  folGrad2.addColorStop(0.8, "#d97706"); // orange shaded
  folGrad2.addColorStop(1, "rgba(217, 119, 6, 0)");
  nctCtx.fillStyle = folGrad2;
  nctCtx.beginPath();
  nctCtx.arc(12, 14, 10, 0, Math.PI * 2);
  nctCtx.fill();

  // Orange Red right puff
  const folGrad3 = nctCtx.createRadialGradient(20, 16, 1, 20, 16, 9);
  folGrad3.addColorStop(0, "#fca5a5"); // light peach blossom cap
  folGrad3.addColorStop(0.3, "#ef4444"); // vibrant red
  folGrad3.addColorStop(0.8, "#b91c1c"); // deep crimson shadow
  folGrad3.addColorStop(1, "rgba(185, 28, 28, 0)");
  nctCtx.fillStyle = folGrad3;
  nctCtx.beginPath();
  nctCtx.arc(20, 16, 9, 0, Math.PI * 2);
  nctCtx.fill();

  // Little golden maple leaves drifting or shimmering around canopy
  nctCtx.fillStyle = "#fbbf24";
  nctCtx.fillRect(6, 11, 1.5, 1.5);
  nctCtx.fillRect(25, 9, 1.5, 1.5);
  nctCtx.fillStyle = "#ea580c";
  nctCtx.fillRect(23, 21, 1.5, 1.5);
  nctCtx.fillRect(7, 21, 1.5, 1.5);

  // 5. Fire Shrines / Braziers (Animated 4 frames)
  const shrineBrazier: HTMLCanvasElement[] = [];
  for (let f = 0; f < 4; f++) {
    const c = document.createElement("canvas");
    c.width = 16;
    c.height = 24;
    const bCtx = c.getContext("2d")!;
    
    // Base drop shadow
    bCtx.fillStyle = "rgba(0, 0, 0, 0.3)";
    bCtx.beginPath();
    bCtx.ellipse(8, 22, 6, 2, 0, 0, Math.PI * 2);
    bCtx.fill();

    // Ornate basalt column pillar (textured stone)
    const stoneGrad = bCtx.createLinearGradient(4, 11, 12, 11);
    stoneGrad.addColorStop(0, "#1e293b"); // slate metal
    stoneGrad.addColorStop(0.5, "#475569"); // highlights
    stoneGrad.addColorStop(1, "#0f172a");
    bCtx.fillStyle = stoneGrad;
    bCtx.fillRect(4, 11, 8, 11);

    // Golden rune etched on the stone pillar
    bCtx.fillStyle = f % 2 === 0 ? "#facc15" : "#eab308";
    bCtx.fillRect(7, 14, 2, 4);
    bCtx.fillRect(6, 15, 4, 1);

    // Metallic iron oil basin bowl
    bCtx.fillStyle = "#0f172a";
    bCtx.fillRect(2, 9, 12, 2);
    bCtx.fillStyle = "#334155";
    bCtx.fillRect(3, 9, 10, 1);

    // Gorgeous animated flame with cozy fire glowing radial gradient
    const flameHeight = 7 + Math.sin(f * 1.5) * 2;
    const flameWidth = 5 + (f % 2);
    const fx = 8 - flameWidth / 2;
    const fy = 9 - flameHeight;

    const fireGlow = bCtx.createRadialGradient(8, 7, 1, 8, 7, 6);
    fireGlow.addColorStop(0, "#ffffff");
    fireGlow.addColorStop(0.3, "#f97316"); // bright orange
    fireGlow.addColorStop(0.8, "#ef4444"); // deep red crown
    fireGlow.addColorStop(1, "rgba(239, 68, 68, 0)");
    bCtx.fillStyle = fireGlow;
    
    bCtx.beginPath();
    bCtx.moveTo(8, fy);
    bCtx.quadraticCurveTo(8 + flameWidth / 2, fy + flameHeight * 0.5, 8 + flameWidth / 2, 9);
    bCtx.lineTo(8 - flameWidth / 2, 9);
    bCtx.quadraticCurveTo(8 - flameWidth / 2, fy + flameHeight * 0.5, 8, fy);
    bCtx.closePath();
    bCtx.fill();

    shrineBrazier.push(c);
  }

  // 6. Fluffy White Cloud Sprite
  const cloud = document.createElement("canvas");
  cloud.width = 96;
  cloud.height = 36;
  const cloudCtx = cloud.getContext("2d")!;
  
  // Create beautiful layered cloud depth (ambient shadow under cloud)
  cloudCtx.fillStyle = "rgba(15, 23, 42, 0.08)";
  cloudCtx.beginPath();
  cloudCtx.arc(28, 24, 12, 0, Math.PI * 2);
  cloudCtx.arc(46, 20, 16, 0, Math.PI * 2);
  cloudCtx.arc(64, 24, 13, 0, Math.PI * 2);
  cloudCtx.fill();

  // White fluffy volume body (base layer)
  const cloudGrad = cloudCtx.createLinearGradient(0, 0, 0, 36);
  cloudGrad.addColorStop(0, "#ffffff");
  cloudGrad.addColorStop(1, "#cbd5e1"); // slightly shaded bottom
  cloudCtx.fillStyle = cloudGrad;
  
  cloudCtx.beginPath();
  cloudCtx.arc(24, 18, 12, 0, Math.PI * 2);
  cloudCtx.arc(42, 14, 16, 0, Math.PI * 2);
  cloudCtx.arc(60, 18, 13, 0, Math.PI * 2);
  cloudCtx.arc(72, 20, 10, 0, Math.PI * 2);
  cloudCtx.closePath();
  cloudCtx.fill();

  // Top highlight cap (bright white sun reflection)
  cloudCtx.fillStyle = "#ffffff";
  cloudCtx.beginPath();
  cloudCtx.arc(22, 16, 10, 0, Math.PI * 2);
  cloudCtx.arc(40, 11, 13, 0, Math.PI * 2);
  cloudCtx.arc(58, 15, 10, 0, Math.PI * 2);
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
      const variants = assets.tiles[type];
      if (variants && variants.length > 0) {
        const variantIdx = (c * 17 + r * 13) % variants.length;
        const tileCanvas = variants[variantIdx];
        ctx.drawImage(tileCanvas, c * TILE_SIZE, r * TILE_SIZE);
      }
    }
  }
}
