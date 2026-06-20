import React, { useRef, useEffect, useState } from "react";
import { LandmarkNode, Position } from "../types";
import { LANDMARKS } from "../landmarksData";

interface MapCanvasProps {
  avatarPos: Position;
  setAvatarPos: (pos: Position) => void;
  targetPos: Position;
  setTargetPos: (pos: Position) => void;
  solvedNodeIds: string[];
  activeNodeId: string | null;
  onNearNode: (node: LandmarkNode) => void;
  isDialogueOpen: boolean;
}

export const MapCanvas: React.FC<MapCanvasProps> = ({
  avatarPos,
  setAvatarPos,
  targetPos,
  setTargetPos,
  solvedNodeIds,
  activeNodeId,
  onNearNode,
  isDialogueOpen,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const posRef = useRef<Position>(avatarPos);
  const targetRef = useRef<Position>(targetPos);

  const [hoveredNode, setHoveredNode] = useState<LandmarkNode | null>(null);
  const [direction, setDirection] = useState<"up" | "down" | "left" | "right">("down");
  const [isWalking, setIsWalking] = useState<boolean>(false);
  const [tick, setTick] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<"Morning" | "Noon" | "Sunset" | "Night">("Noon");

  // Sync refs to avoid stale values in requestAnimationFrame closure
  useEffect(() => {
    posRef.current = avatarPos;
  }, [avatarPos]);

  useEffect(() => {
    targetRef.current = targetPos;
  }, [targetPos]);

  // Handle click on canvas to set target position
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDialogueOpen) return; // Freeze movement during dialogue

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    // Calculate click coords relative to canvas size (800x600)
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    
    const clickX = (event.clientX - rect.left) * scaleX;
    const clickY = (event.clientY - rect.top) * scaleY;

    // Boundary restriction
    const clampedX = Math.max(15, Math.min(785, clickX));
    const clampedY = Math.max(15, Math.min(585, clickY));

    setTargetPos({ x: clampedX, y: clampedY });
  };

  // Track mouse move for node tooltips
  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    
    const mouseX = (event.clientX - rect.left) * scaleX;
    const mouseY = (event.clientY - rect.top) * scaleY;

    // Check if close to any node
    let found: LandmarkNode | null = null;
    for (const node of LANDMARKS) {
      const dist = Math.hypot(node.x - mouseX, node.y - mouseY);
      if (dist < 22) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);
    
    // Change cursor
    if (found && !isDialogueOpen) {
      canvas.style.cursor = "pointer";
    } else {
      canvas.style.cursor = isDialogueOpen ? "not-allowed" : "default";
    }
  };

  // Main game loop (tick and update positions)
  useEffect(() => {
    let frameTick = 0;
    
    const updateGame = () => {
      frameTick++;
      setTick(frameTick);

      const dx = targetRef.current.x - posRef.current.x;
      const dy = targetRef.current.y - posRef.current.y;
      const distance = Math.hypot(dx, dy);

      if (distance > 3) {
        setIsWalking(true);
        const speed = 2.8; // pixels per frame
        const angle = Math.atan2(dy, dx);
        
        // Formulate next position
        const nextX = posRef.current.x + Math.cos(angle) * speed;
        const nextY = posRef.current.y + Math.sin(angle) * speed;
        
        setAvatarPos({ x: nextX, y: nextY });

        // Update face direction
        const absDx = Math.abs(dx);
        const absDy = Math.abs(dy);
        if (absDx > absDy) {
          setDirection(dx > 0 ? "right" : "left");
        } else {
          setDirection(dy > 0 ? "down" : "up");
        }

        // Proximity detection for uncompleted nodes
        for (const node of LANDMARKS) {
          const solved = solvedNodeIds.includes(node.id);
          // If we walk near an unsolved node, halt and open dialog
          if (!solved) {
            const distToNode = Math.hypot(node.x - nextX, node.y - nextY);
            if (distToNode < 32 && activeNodeId !== node.id) {
              setTargetPos({ x: nextX, y: nextY }); // Halt
              setIsWalking(false);
              onNearNode(node);
              break;
            }
          }
        }
      } else {
        setIsWalking(false);
      }

      // Perform drawing
      draw();

      animationFrameRef.current = requestAnimationFrame(updateGame);
    };

    // Drawing functions
    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Clear Canvas
      ctx.clearRect(0, 0, 800, 600);

      const isOddTick = Math.floor(frameTick / 15) % 2 === 0;

      // 1. WATER BACKGROUND with deep sea colors & moving waves
      ctx.fillStyle = "#0c1726"; // Vibrant deep sea blue
      ctx.fillRect(0, 0, 800, 600);

      // Draw subtle background water waves (pixel lines)
      ctx.fillStyle = "#162840";
      for (let x = 0; x < 800; x += 60) {
        for (let y = 0; y < 600; y += 60) {
          const waveShift = Math.floor(frameTick / 20) % 4;
          if ((x + y) % 120 === 0) {
            ctx.fillRect(x + waveShift * 2, y, 10, 2);
            ctx.fillRect(x + waveShift * 2 + 4, y + 2.5, 4, 1);
          }
        }
      }

      // Draw travel sea path connections (retro golden sand trails)
      ctx.strokeStyle = "rgba(250, 204, 21, 0.25)";
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      // Logic plain to Philosophy down south
      ctx.moveTo(180, 220);
      ctx.quadraticCurveTo(240, 360, 340, 440);
      // Economics to Philosophy
      ctx.moveTo(580, 220);
      ctx.quadraticCurveTo(550, 370, 480, 460);
      // Logic to Economics directly
      ctx.moveTo(230, 220);
      ctx.lineTo(580, 220);
      ctx.stroke();
      ctx.setLineDash([]); // Reset line dash

      // Helper for drawing various trees with interactive sway
      const drawPixelTree = (tx: number, ty: number, leafColor: string, trunkColor: string = "#713f12") => {
        const treeSwayX = Math.sin(frameTick * 0.035 + tx) * 1.6;

        // Ground shadow
        ctx.fillStyle = "rgba(4, 8, 15, 0.4)";
        ctx.beginPath();
        ctx.ellipse(tx, ty + 10, 9, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Trunk
        ctx.fillStyle = trunkColor;
        ctx.fillRect(tx - 2, ty, 4, 10);

        // Leaves tier 1 (Lower crown)
        ctx.fillStyle = leafColor;
        ctx.beginPath();
        ctx.arc(tx + treeSwayX * 0.6, ty - 2, 8.5, 0, Math.PI * 2);
        ctx.fill();

        // Leaves tier 2 (Upper crown)
        ctx.fillStyle = leafColor;
        ctx.globalAlpha = 0.88;
        ctx.beginPath();
        ctx.arc(tx + treeSwayX, ty - 6, 6.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;

        // Draw shadow rim
        ctx.strokeStyle = "rgba(15, 23, 42, 0.15)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Highlight bud
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = 0.25;
        ctx.fillRect(tx - 2 + treeSwayX, ty - 8, 2, 2);
        ctx.globalAlpha = 1.0;
      };

      // Helper for drawing cozy cottages (Stardew Style)
      const drawCottage = (hx: number, hy: number, roofColor: string, wallColor: string, isClassic: boolean = false) => {
        // shadow
        ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
        ctx.fillRect(hx - 16, hy + 12, 34, 6);

        // Wall
        ctx.fillStyle = wallColor;
        ctx.fillRect(hx - 14, hy - 4, 28, 16);

        // Wood framing lines
        ctx.fillStyle = "rgba(0,0,0,0.12)";
        ctx.fillRect(hx - 14, hy + 2, 28, 2);
        ctx.fillRect(hx - 10, hy + 8, 6, 2);

        // Roof
        ctx.fillStyle = roofColor;
        ctx.beginPath();
        ctx.moveTo(hx - 18, hy - 4);
        ctx.lineTo(hx + 18, hy - 4);
        ctx.lineTo(hx, hy - 18);
        ctx.closePath();
        ctx.fill();

        // Roof trim
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(hx - 18, hy - 5, 36, 2);

        // Chimney
        ctx.fillStyle = "#4b5563";
        ctx.fillRect(hx + 8, hy - 14, 5, 8);
        ctx.fillStyle = "#1f2937";
        ctx.fillRect(hx + 7, hy - 15, 7, 2);

        // Chimney smoke particles
        const smokeOffset = (frameTick % 24) / 4;
        ctx.fillStyle = "rgba(226, 232, 240, 0.45)";
        ctx.fillRect(hx + 9 - smokeOffset * 0.5, hy - 18 - smokeOffset * 1.5, 3, 3);
        ctx.fillRect(hx + 11 - smokeOffset * 0.3, hy - 23 - smokeOffset * 1.8, 4, 4);

        // Door
        ctx.fillStyle = "#78350f"; // Wood door
        ctx.fillRect(hx - 4, hy + 3, 7, 9);
        ctx.fillStyle = "#facc15"; // Gold knob
        ctx.fillRect(hx + 1, hy + 7, 1.5, 1.5);

        // Window with yellow light glowing inside
        ctx.fillStyle = "#facc15";
        ctx.fillRect(hx - 10, hy, 4, 4);
        ctx.fillRect(hx + 6, hy, 4, 4);
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(hx - 10, hy, 4, 1);
        ctx.fillRect(hx + 6, hy, 4, 1);
      };

      // Helper for classical Greek structure (Pillars & Pediment)
      const drawGreekTemple = (tx: number, ty: number) => {
        // Shadow
        ctx.fillStyle = "rgba(15, 23, 42, 0.35)";
        ctx.fillRect(tx - 24, ty + 12, 48, 6);

        // Base stairs
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(tx - 22, ty + 8, 44, 4);
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(tx - 20, ty + 5, 40, 3);

        // Pillars (Draw 4 pillars)
        ctx.fillStyle = "#e2e8f0";
        for (let p = 0; p < 4; p++) {
          const px = tx - 16 + p * 10;
          ctx.fillRect(px, ty - 12, 4, 17);
          ctx.fillStyle = "#64748b";
          ctx.fillRect(px, ty + 4, 4, 1);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(px, ty - 12, 4, 1);
        }

        // Architraves & Arch Pediment
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(tx - 18, ty - 15, 36, 3);

        // Pediment Triangle
        ctx.fillStyle = "#cbd5e1";
        ctx.beginPath();
        ctx.moveTo(tx - 20, ty - 15);
        ctx.lineTo(tx + 20, ty - 15);
        ctx.lineTo(tx, ty - 27);
        ctx.closePath();
        ctx.fill();

        // Triangular gold shield emblem
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(tx, ty - 18, 2, 0, Math.PI * 2);
        ctx.fill();
      };

      // Draw mountain triangles with snowy peaks
      const drawMountain = (mx: number, my: number, size: number) => {
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - size, my + size * 1.5);
        ctx.lineTo(mx + size, my + size * 1.5);
        ctx.closePath();
        ctx.fill();

        // Snowy peak cap
        ctx.fillStyle = "#f1f5f9";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - size * 0.3, my + size * 0.45);
        ctx.lineTo(mx + size * 0.3, my + size * 0.45);
        ctx.closePath();
        ctx.fill();
      };

      // 2. CONTINENT A: Logic & Math Plains (CYBER FUTURISTIC ERA - West, Purple crystal theme)
      // Beach Shoreline
      ctx.fillStyle = "#581c87"; // Vibrant purple shore
      ctx.beginPath();
      ctx.arc(170, 200, 150, 0, Math.PI * 2);
      ctx.fill();

      // Shore wave foam overlay
      ctx.strokeStyle = "rgba(216, 180, 254, 0.3)";
      ctx.lineWidth = 2.5 + Math.sin(frameTick * 0.08) * 1.1;
      ctx.beginPath();
      ctx.arc(170, 200, 151, 0, Math.PI * 2);
      ctx.stroke();

      // Main Landmass
      ctx.fillStyle = "#2e0854"; // Deep amethyst purple soil
      ctx.beginPath();
      ctx.arc(170, 200, 142, 0, Math.PI * 2);
      ctx.fill();

      // Futuristic floor tech matrix overlay lines
      ctx.strokeStyle = "rgba(168, 85, 247, 0.16)";
      ctx.lineWidth = 1.2;
      for (let mx = 40; mx <= 300; mx += 25) {
        ctx.beginPath();
        ctx.moveTo(mx - 20, 60);
        ctx.lineTo(mx + 20, 340);
        ctx.stroke();
      }
      for (let my = 60; my <= 340; my += 25) {
        ctx.beginPath();
        ctx.moveTo(40, my - 20);
        ctx.lineTo(300, my + 20);
        ctx.stroke();
      }

      // Glowing circuit nodes inside soil
      ctx.fillStyle = "#e9d5ff";
      ctx.fillRect(115, 120, 4, 4);
      ctx.fillRect(235, 140, 3, 3);
      ctx.fillRect(80, 250, 3, 3);

      // Cyber Spires
      const drawCyberSpire = (sx: number, sy: number) => {
        ctx.fillStyle = "rgba(168, 85, 247, 0.22)";
        ctx.beginPath();
        ctx.arc(sx, sy + 15, 14, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#581c87";
        ctx.fillRect(sx - 5, sy - 15, 10, 30);
        ctx.fillStyle = "#a855f7";
        ctx.fillRect(sx - 3, sy - 28, 6, 13);
        
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(sx - 1, sy - 34, 2, 6);

        // Core pulsating neon light
        ctx.fillStyle = isOddTick ? "#ec4899" : "#a855f7";
        ctx.fillRect(sx - 2, sy - 3, 4, 6);
      };

      drawCyberSpire(110, 150);
      drawCyberSpire(260, 220);

      // Neon purple crystal trees
      drawPixelTree(90, 220, "#d8b4fe", "#581c87");
      drawPixelTree(140, 270, "#f472b6", "#581c87");
      drawPixelTree(130, 100, "#d8b4fe", "#581c87");

      // Boolean glyph text labels floating on cyber background
      ctx.fillStyle = "rgba(226, 232, 240, 0.32)";
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText("p ∧ q", 80, 130);
      ctx.fillText("¬ p", 230, 150);
      ctx.fillText("∃ x ∈ S", 170, 90);


      // 3. CONTINENT B: Economics Valleys (MEDIEVAL AGRARIAN ERA - East, Green/Gold Stardew Valley theme)
      // Sandy shoreline
      ctx.fillStyle = "#fef08a"; // Beautiful bright Yellow Stardew sandy beach
      ctx.beginPath();
      ctx.arc(620, 200, 150, 0, Math.PI * 2);
      ctx.fill();

      // Sandy wave foam
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2 + Math.sin(frameTick * 0.08 + 2) * 1.0;
      ctx.beginPath();
      ctx.arc(620, 200, 151, 0, Math.PI * 2);
      ctx.stroke();

      // Main soil land
      ctx.fillStyle = "#15803d"; // Rich forest green grass
      ctx.beginPath();
      ctx.arc(620, 200, 142, 0, Math.PI * 2);
      ctx.fill();

      // Detailed pixelated grass clumps to avoid plain colors
      ctx.fillStyle = "#14532d";
      for (let gx = 490; gx <= 750; gx += 20) {
        for (let gy = 70; gy <= 330; gy += 25) {
          if ((gx * 3 + gy) % 7 === 0) {
            ctx.fillRect(gx, gy, 1, 3);
            ctx.fillRect(gx + 2, gy - 1, 1, 4);
            ctx.fillRect(gx + 4, gy, 1, 2);
          }
        }
      }

      // Draw Stardew dirt patches for crops
      ctx.fillStyle = "#78350f"; // Rich brown farm soil
      ctx.fillRect(520, 170, 32, 24);
      ctx.fillRect(560, 230, 48, 16);

      // Ordered rows of tiny pixel crops
      ctx.fillStyle = "#a3e635"; // Young crop sprouts
      for (let cropY = 173; cropY <= 190; cropY += 6) {
        ctx.fillRect(524, cropY, 2, 2);
        ctx.fillRect(534, cropY, 2, 2);
        ctx.fillRect(544, cropY, 2, 2);
      }
      ctx.fillStyle = "#eab308"; // Golden grain crops
      for (let cropX = 564; cropX <= 600; cropX += 8) {
        ctx.fillRect(cropX, 232, 2, 4);
        ctx.fillRect(cropX + 1, 230, 2, 3);
      }

      // Cozy Medieval Farmhouses, trading cottages, and silos
      drawCottage(650, 140, "#991b1b", "#fef3c7"); // Cottage A (red roof)
      drawCottage(550, 110, "#1e3a8a", "#e2e8f0"); // Trading Cottage B (blue roof)

      // Brown JRPG wooden fences
      ctx.fillStyle = "#7c2d12"; // Dark reddish wood
      ctx.fillRect(510, 160, 2, 42);
      ctx.fillRect(510, 170, 45, 2);
      ctx.fillRect(510, 196, 45, 2);

      // Flower patches
      ctx.fillStyle = "#ef4444"; // Red
      ctx.fillRect(680, 250, 2, 2);
      ctx.fillRect(684, 254, 2, 2);
      ctx.fillRect(690, 248, 2, 2);
      ctx.fillStyle = "#eab308"; // Yellow sunflower dots
      ctx.fillRect(682, 252, 2, 2);
      ctx.fillRect(688, 251, 2, 2);

      // Red Stardew mushrooms under the trees
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(725, 112, 3, 3);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(726, 112, 1, 1);

      // Lush forest trees (Stardew style greens)
      drawPixelTree(600, 80, "#22c55e");
      drawPixelTree(680, 210, "#16a34a");
      drawPixelTree(710, 160, "#15803d");
      drawPixelTree(720, 100, "#16a34a");


      // 4. CONTINENT C: Philosophy Peaks (ANCIENT GREEK / PHILOSOPHY PEAKS - South, Blueish Slate & Columns)
      // Chalk shorelines
      ctx.fillStyle = "#cbd5e1"; // Slate white/gray limestone beaches
      ctx.beginPath();
      ctx.arc(420, 480, 150, 0, Math.PI * 2);
      ctx.fill();

      // Limestone wave foam
      ctx.strokeStyle = "rgba(241, 245, 249, 0.35)";
      ctx.lineWidth = 2 + Math.sin(frameTick * 0.08 + 4) * 1.0;
      ctx.beginPath();
      ctx.arc(420, 480, 151, 0, Math.PI * 2);
      ctx.stroke();

      // Main landmass
      ctx.fillStyle = "#1e293b"; // Slate rock gray
      ctx.beginPath();
      ctx.arc(420, 480, 142, 0, Math.PI * 2);
      ctx.fill();

      // Cobblestone ground textures
      ctx.fillStyle = "#334155";
      for (let cx = 290; cx <= 550; cx += 22) {
        for (let cy = 354; cy <= 590; cy += 22) {
          if ((cx + cy * 2) % 9 === 0) {
            ctx.fillRect(cx, cy, 6, 3);
            ctx.fillRect(cx + 3, cy + 2, 3, 3);
          }
        }
      }

      // Classical white marble villas & grand temple columns
      drawGreekTemple(330, 460); // Classical Academy
      drawGreekTemple(520, 440); // Lyceum Forum

      // Snowy classical peak mountains in the high south
      drawMountain(410, 390, 40);
      drawMountain(460, 410, 30);

      // Little stone shrines with flame braziers
      const drawBrazier = (bx: number, by: number) => {
        ctx.fillStyle = "#64748b";
        ctx.fillRect(bx - 3, by, 6, 8);
        ctx.fillStyle = "#334155";
        ctx.fillRect(bx - 4, by - 2, 8, 2);
        // glowing fire block
        ctx.fillStyle = isOddTick ? "#ef4444" : "#f97316";
        ctx.fillRect(bx - 2, by - 5, 4, 4);
      };
      drawBrazier(380, 460);
      drawBrazier(470, 470);

      // Pale cypress & silver olive trees
      drawPixelTree(280, 480, "#475569", "#0f172a");
      drawPixelTree(560, 490, "#475569", "#0f172a");
      drawPixelTree(360, 520, "#64748b", "#0f172a");


      // 5. THE RIVERS, STREAMING CHANNELS, & COSY WOODEN BRIDGES (有河，有水，有桥 🌉)
      // Emerald flowing river dividing Logic/Cyber plains from Middle Tranquil delta
      ctx.fillStyle = "#38bdf8"; // Gorgeous sparkling river blue water
      ctx.strokeStyle = "#0284c7"; // deep blue trim
      ctx.lineWidth = 1;

      // Draw flowing river channels connecting the water borders
      ctx.beginPath();
      ctx.moveTo(330, 0);
      ctx.bezierCurveTo(360, 150, 390, 300, 320, 600);
      ctx.lineTo(352, 600);
      ctx.bezierCurveTo(422, 300, 392, 150, 362, 0);
      ctx.closePath();
      ctx.fill();

      // Central river waves ripples
      ctx.fillStyle = "#e0f2fe";
      const ripplePos = (frameTick * 0.8) % 180;
      ctx.fillRect(350, 80 + (ripplePos % 500), 8, 2);
      ctx.fillRect(370, 160 + (ripplePos % 400), 6, 1.5);
      ctx.fillRect(360, 280 + (ripplePos % 300), 10, 2);

      // Cute little salmon fish swimming inside the river with dynamic tail wags!
      for (let f = 0; f < 3; f++) {
        const fy = (f * 180 + frameTick * 0.6) % 650 - 50;
        const fx = 345 + Math.sin(frameTick * 0.05 + f) * 8;
        ctx.fillStyle = "#f97316"; // Coral salmon
        ctx.fillRect(fx - 2, fy - 4, 4, 8);
        const tailWag = Math.floor(frameTick / 5) % 2 === 0 ? 1.5 : -1.5;
        ctx.fillStyle = "#ea580c";
        ctx.fillRect(fx + tailWag - 0.5, fy + 4, 1.5, 3);
      }

      // A cute rustic wooden Stardew style bridge connecting Cyber plains to Economics across the river!
      ctx.fillStyle = "#7c2d12"; // dark wood frames
      ctx.fillRect(340, 210, 45, 14); // wooden deck
      ctx.fillStyle = "#b45309"; // amber brown plank lines
      for (let bx = 343; bx <= 380; bx += 7) {
        ctx.fillRect(bx, 210, 4, 14);
      }
      ctx.fillStyle = "#facc15"; // gold rivets
      ctx.fillRect(341, 209, 2, 2);
      ctx.fillRect(382, 209, 2, 2);
      ctx.fillRect(341, 223, 2, 2);
      ctx.fillRect(382, 223, 2, 2);


      // 6. SOARING WHITE BIRDS IN THE WIND
      const birdX = (frameTick * 0.8) % 960 - 100;
      const birdY = 110 + Math.sin(frameTick * 0.015) * 20;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const wingSway = Math.sin(frameTick * 0.14) > 0 ? -4 : 4;
      ctx.moveTo(birdX - 7, birdY + wingSway);
      ctx.lineTo(birdX, birdY);
      ctx.lineTo(birdX + 7, birdY + wingSway);
      ctx.stroke();


      // 7. DRAW ALL INTERACTIVE AND GLOWING LANDMARK NODES ON EARTH GRID
      LANDMARKS.forEach((node) => {
        const isSolved = solvedNodeIds.includes(node.id);
        const pulse = 1 + Math.sin(frameTick * 0.08) * 0.08;

        // Draw selection halo if hovered or active
        const isHovered = hoveredNode?.id === node.id;
        const isActive = activeNodeId === node.id;
        if (isHovered || isActive) {
          ctx.strokeStyle = "rgba(255, 251, 235, 0.6)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 22 * pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw node glowing background halo
        const gradient = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, 18 * pulse);
        if (isSolved) {
          gradient.addColorStop(0, node.color);
          gradient.addColorStop(1, "rgba(0,0,0,0)");
        } else {
          gradient.addColorStop(0, "rgba(148, 163, 184, 0.5)"); // grey
          gradient.addColorStop(1, "rgba(0,0,0,0)");
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Node center pin
        ctx.fillStyle = isSolved ? node.color : "#64748b";
        ctx.strokeStyle = isSolved ? "#ffffff" : "#475569";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Draw pixel icons over landmarks
        ctx.save();
        ctx.translate(node.x, node.y - 12);
        
        // Pixel drawings
        if (node.icon === "gate") {
          ctx.fillStyle = isSolved ? "#d8b4fe" : "#94a3b8";
          ctx.fillRect(-6, -4, 3, 10);
          ctx.fillRect(4, -4, 3, 10);
          ctx.fillRect(-6, -6, 13, 3);
          if (isSolved) {
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(-1, -1, 3, 3); // pulsing key orb
          }
        } else if (node.icon === "crystal") {
          ctx.fillStyle = isSolved ? "#ec4899" : "#64748b";
          ctx.beginPath();
          ctx.moveTo(0, -8);
          ctx.lineTo(5, -1);
          ctx.lineTo(0, 6);
          ctx.lineTo(-5, -1);
          ctx.closePath();
          ctx.fill();
        } else if (node.icon === "coin") {
          ctx.fillStyle = isSolved ? "#facc15" : "#64748b";
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isSolved ? "#eab308" : "#475569";
          ctx.font = "bold 7px sans-serif";
          ctx.fillText("$", -2, 3);
        } else if (node.icon === "shield") {
          ctx.fillStyle = isSolved ? "#22c55e" : "#64748b";
          ctx.beginPath();
          ctx.moveTo(-5, -5);
          ctx.lineTo(5, -5);
          ctx.lineTo(5, 0);
          ctx.lineTo(0, 5);
          ctx.lineTo(-5, 0);
          ctx.closePath();
          ctx.fill();
        } else if (node.icon === "hourglass") {
          ctx.fillStyle = isSolved ? "#3b82f6" : "#64748b";
          ctx.fillRect(-4, -5, 9, 2);
          ctx.fillRect(-4, 4, 9, 2);
          ctx.fillStyle = isSolved ? "#e2e8f0" : "#475569";
          ctx.beginPath();
          ctx.moveTo(-2, -3);
          ctx.lineTo(2, -3);
          ctx.lineTo(0, 0);
          ctx.lineTo(2, 3);
          ctx.lineTo(-2, 3);
          ctx.closePath();
          ctx.fill();
        } else { // "scroll"
          ctx.fillStyle = isSolved ? "#fb923c" : "#64748b";
          ctx.fillRect(-6, -3, 13, 7);
          ctx.fillStyle = isSolved ? "#ffedd5" : "#475569";
          ctx.fillRect(-4, -1, 9, 3);
        }
        ctx.restore();
      });

      // 8. DRAW CLICK-DESTINATION FLAG (if exists and moving)
      if (isWalking) {
        ctx.strokeStyle = "#fb7185";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(targetRef.current.x, targetRef.current.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated red cursor cross
        ctx.fillStyle = "#fb7185";
        ctx.fillRect(targetRef.current.x - 1, targetRef.current.y - 5, 2, 10);
        ctx.fillRect(targetRef.current.x - 5, targetRef.current.y - 1, 10, 2);
      }

      // 9. DRAW JRPG PLAYER AVATAR (Voyager character with pixel coat and headband)
      const ax = posRef.current.x;
      const ay = posRef.current.y;
      
      ctx.save();
      ctx.translate(ax, ay);

      // Bob character up and down slightly if walking (Stardew-like bouncy walk cycles)
      const bobY = isWalking ? Math.round(Math.sin(frameTick * 0.3) * 1.5) : 0;
      
      const walkFrame = Math.floor(frameTick / 6) % 4;
      const lfOffset = (isWalking && walkFrame === 0) ? -3 : 0;
      const rfOffset = (isWalking && walkFrame === 2) ? -3 : 0;

      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(0, 14, 11, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Translate bob
      ctx.translate(0, bobY);

      // BackPack box (drawn behind depending on direction)
      if (direction === "up" || direction === "left") {
        ctx.fillStyle = "#b45309"; // Leder gold brown leather backpack
        ctx.fillRect(2, -4, 5, 10);
      } else if (direction === "right") {
        ctx.fillStyle = "#b45309";
        ctx.fillRect(-7, -4, 5, 10);
      }

      // LEGS / BOOTS
      ctx.fillStyle = "#451a03"; // dark leather brown
      ctx.fillRect(-5, 9 + lfOffset, 3, 5); // left boot
      ctx.fillRect(2, 9 + rfOffset, 3, 5);  // right boot

      // CLOTHING/COAT (Tunic body)
      ctx.fillStyle = "#ea580c"; // Vibrant Stardew orange-brown voyager coat
      ctx.fillRect(-6, -2, 12, 11);
      
      // Coat collar details
      ctx.fillStyle = "#ffbe0b";
      ctx.fillRect(-3, -2, 6, 2);

      // SATCHEL SLING STRAP
      ctx.fillStyle = "#ca8a04";
      ctx.fillRect(-6, 2, 12, 2);

      // PEACH SKIN FACE
      ctx.fillStyle = "#fed9b7";
      ctx.fillRect(-5, -9, 10, 7);

      // HAIR
      ctx.fillStyle = "#2563eb"; // Elegant royal blue JRPG dynamic curly hair
      ctx.fillRect(-6, -13, 12, 5); // Top hair
      ctx.fillRect(-6, -9, 2, 6);   // Side hair left
      ctx.fillRect(4, -9, 2, 6);    // Side hair right

      // EYES (Directional)
      ctx.fillStyle = "#0c1020"; // Dark blue eyes
      if (direction === "down") {
        ctx.fillRect(-3, -6, 2, 2);
        ctx.fillRect(1, -6, 2, 2);
        // Headband visor
        ctx.fillStyle = "#ff006e";
        ctx.fillRect(-5, -9, 10, 2);
      } else if (direction === "right") {
        ctx.fillRect(1, -6, 2, 2);
        ctx.fillRect(3, -6, 1, 2);
        ctx.fillStyle = "#ff006e";
        ctx.fillRect(-3, -9, 8, 2);
      } else if (direction === "left") {
        ctx.fillRect(-3, -6, 2, 2);
        ctx.fillRect(-4, -6, 1, 2);
        ctx.fillStyle = "#ff006e";
        ctx.fillRect(-5, -9, 8, 2);
      } else if (direction === "up") {
        // Back of blue hair
        ctx.fillStyle = "#2563eb";
        ctx.fillRect(-5, -9, 10, 7);
        // Headband tie node
        ctx.fillStyle = "#ff006e";
        ctx.fillRect(-2, -6, 4, 2);
      }

      ctx.restore();


      // 10. DRIVEN FALLING PETALS / GOLDEN HARVEST LEAVES WEATHER EFFECTS
      const leafCount = 14;
      for (let i = 0; i < leafCount; i++) {
        const lX = (i * 147 + frameTick * 0.75) % 860 - 30;
        const lY = (i * 89 + frameTick * 1.15) % 660 - 30;
        
        ctx.fillStyle = timeOfDay === "Sunset" ? "#f59e0b" : timeOfDay === "Night" ? "#818cf8" : "#f472b6"; // Orange leaves, twilight blossoms or sakura pink
        ctx.beginPath();
        const leafSway = Math.sin(frameTick * 0.04 + i) * 6;
        ctx.ellipse(lX + leafSway, lY, 5, 2.5, Math.PI / 4 + Math.sin(frameTick * 0.02 + i) * 0.3, 0, Math.PI * 2);
        ctx.fill();
      }


      // 11. WORLD DIURNAL ATMOSPHERE SHADING OVERLAYS
      if (timeOfDay === "Night") {
        ctx.fillStyle = "rgba(15, 26, 48, 0.58)"; // Cozy deep midnight blue
        ctx.globalCompositeOperation = "multiply";
        ctx.fillRect(0, 0, 800, 600);
        ctx.globalCompositeOperation = "source-over";

        // Light bulbs at solved spots
        LANDMARKS.forEach((node) => {
          const isSolved = solvedNodeIds.includes(node.id);
          if (isSolved) {
            const glowGrd = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, 45);
            glowGrd.addColorStop(0, "rgba(253, 224, 71, 0.38)");
            glowGrd.addColorStop(1, "rgba(253, 224, 71, 0)");
            ctx.fillStyle = glowGrd;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 45, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Glowing firefly bugs around the islands of Night time!!
        ctx.fillStyle = "rgba(163, 230, 53, 0.9)"; // lime fireflies
        for (let j = 0; j < 14; j++) {
          const flyX = (j * 117 + Math.sin(frameTick * 0.025 + j) * 50) % 800;
          const flyY = (j * 79 + Math.cos(frameTick * 0.03 + j) * 40) % 600;
          ctx.fillRect(flyX, flyY, 2, 2);
          ctx.fillStyle = "rgba(163, 230, 53, 0.12)";
          ctx.beginPath();
          ctx.arc(flyX + 1, flyY + 1, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "rgba(163, 230, 53, 0.9)";
        }

        // Light globe around player avatar
        const playerGlow = ctx.createRadialGradient(posRef.current.x, posRef.current.y, 1, posRef.current.x, posRef.current.y, 40);
        playerGlow.addColorStop(0, "rgba(254, 240, 138, 0.28)");
        playerGlow.addColorStop(1, "rgba(254, 240, 138, 0)");
        ctx.fillStyle = playerGlow;
        ctx.beginPath();
        ctx.arc(posRef.current.x, posRef.current.y, 40, 0, Math.PI * 2);
        ctx.fill();

      } else if (timeOfDay === "Sunset") {
        ctx.fillStyle = "rgba(249, 115, 22, 0.18)"; // Soft golden sunset flare
        ctx.globalCompositeOperation = "color-burn";
        ctx.fillRect(0, 0, 800, 600);
        ctx.globalCompositeOperation = "source-over";

        ctx.fillStyle = "rgba(124, 58, 237, 0.12)"; // Soft violet shading overlay
        ctx.fillRect(0, 0, 800, 600);
      } else if (timeOfDay === "Morning") {
        ctx.fillStyle = "rgba(253, 224, 71, 0.14)"; // Warm morning peach mist
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
        ctx.fillRect(0, 0, 800, 600);
      }
    };

    updateGame();

    // Clean up
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [solvedNodeIds, activeNodeId, isDialogueOpen, direction, isWalking, hoveredNode, timeOfDay]);

  return (
    <div className="relative border-4 border-[#7c2d12] bg-[#fdf6e2] rounded-xl overflow-hidden shadow-2xl">
      {/* Dynamic Header Overlay - Stardew Wooden Ribbon Style */}
      <div className="absolute top-0 inset-x-0 bg-amber-950/90 border-b border-[#7c2d12] text-xs text-amber-100 py-2.5 px-3.5 flex justify-between items-center z-13 font-mono select-none">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-emerald-600"></span>
          <span className="font-bold tracking-wider text-yellow-300">FIELD VOYAGER WORLD</span>
        </div>
        <div className="flex items-center space-x-1.5 font-bold">
          {isDialogueOpen ? (
            <span className="text-rose-400 animate-pulse bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">SOCRATIC FOCUS ACTIVE</span>
          ) : (
            <span className="text-amber-300">CLICK ANYWHERE ON MAP TO WALK</span>
          )}
        </div>
        <div className="text-amber-200/90 bg-amber-900/60 px-2 py-0.5 rounded text-[11px]">
          Target X: {Math.round(avatarPos.x)} | Y: {Math.round(avatarPos.y)}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={600}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="w-full aspect-[4/3] block bg-slate-950 cursor-pointer"
      />

      {/* Floating Stardew Atmosphere / Time of Day Widget Controller */}
      <div className="absolute bottom-3 left-3 bg-[#fdf6e2] border-2 border-[#7c2d12] text-[#3c2f2f] rounded-lg p-2.5 shadow-md flex flex-col space-y-1 z-10 font-mono select-none max-w-[170px]">
        <span className="text-[9.5px] uppercase font-black tracking-widest text-[#7c2d12] border-b border-[#7c2d12]/20 pb-1">
          🌅 Atmosphere
        </span>
        <div className="grid grid-cols-2 gap-1 mt-1">
          {(["Morning", "Noon", "Sunset", "Night"] as const).map((t) => {
            const isActive = timeOfDay === t;
            return (
              <button
                key={t}
                onClick={() => setTimeOfDay(t)}
                className={`text-[9.5px] font-bold px-1.5 py-1 rounded border-2 transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#7c2d12] text-amber-100 border-[#7c2d12]"
                    : "bg-amber-100/60 hover:bg-amber-200 text-[#3c2f2f] border-amber-900/10"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
        <div className="text-[8px] text-[#713f12] italic text-center mt-1">
          Simulate weather cycle!
        </div>
      </div>

      {/* Hover Tooltip Overlay */}
      {hoveredNode && !isDialogueOpen && (
        <div
          className="absolute font-mono select-none pointer-events-none p-3.5 bg-[#fdf6e2] border-2 border-[#7c2d12] text-[#3c2f2f] rounded-lg shadow-2xl text-xs flex flex-col space-y-1.5"
          style={{
            left: `${Math.min(590, (hoveredNode.x / 800) * 100)}%`,
            top: `${Math.max(12, (hoveredNode.y / 600) * 100 - 18)}%`,
            maxWidth: "250px",
            zIndex: 30,
          }}
        >
          <div className="flex justify-between items-center bg-amber-100 px-1.5 py-0.5 rounded text-[9.5px] border border-[#7c2d12]/25">
            <span className="uppercase font-black text-[#7c2d12]">{hoveredNode.discipline}</span>
            <span className={solvedNodeIds.includes(hoveredNode.id) ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
              {solvedNodeIds.includes(hoveredNode.id) ? "● MASTERED" : "○ UNEXPLORED"}
            </span>
          </div>
          <span className="font-extrabold text-sm text-[#7c2d12] mt-1 pr-1">{hoveredNode.name}</span>
          <p className="text-[#3c2f2f]/90 text-[11px] leading-relaxed mt-0.5">{hoveredNode.description}</p>
          <div className="text-[9.5px] text-[#7d4115] font-semibold italic mt-1 border-t border-[#7c2d12]/15 pt-1.5 flex items-center justify-between">
            <span>Coordinates: ({hoveredNode.x}, {hoveredNode.y})</span>
            <span className="animate-pulse">Walk near &rarr;</span>
          </div>
        </div>
      )}
    </div>
  );
};
