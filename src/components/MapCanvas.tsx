import React, { useRef, useEffect, useState, useMemo } from "react";
import { LandmarkNode, Position } from "../types";
import { LANDMARKS } from "../landmarksData";
import { AvatarConfig, drawCompositedAvatar } from "../utils/avatarDrawer";
import {
  getMetaAssets,
  generateTileMap,
  drawTileBackground,
} from "../utils/metaAssets";

interface MapCanvasProps {
  avatarPos: Position;
  setAvatarPos: (pos: Position) => void;
  targetPos: Position;
  setTargetPos: (pos: Position) => void;
  solvedNodeIds: string[];
  activeNodeId: string | null;
  onNearNode: (node: LandmarkNode) => void;
  isDialogueOpen: boolean;
  avatarConfig?: AvatarConfig;
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
  avatarConfig,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const posRef = useRef<Position>(avatarPos);
  const targetRef = useRef<Position>(targetPos);

  // Generate organic tilemap matrix
  const mapMatrix = useMemo(() => generateTileMap(), []);

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

      // 1. DYNAMIC PRE-RENDERED GRID TILEMAP STITCHING
      drawTileBackground(ctx, mapMatrix);

      // Subtle atmospheric deep-water foam wave drifts
      ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
      for (let x = 0; x < 800; x += 128) {
        for (let y = 0; y < 600; y += 128) {
          const shift = Math.floor(frameTick / 16) % 8;
          ctx.fillRect(x + shift * 2, y + shift, 12, 1.5);
          ctx.fillRect(x + shift * 2 + 16, y + shift + 12, 8, 1);
        }
      }

      // 2. GOLDEN SAND ROAD TRAILS
      ctx.strokeStyle = "rgba(251, 191, 36, 0.45)";
      ctx.lineWidth = 3;
      ctx.setLineDash([7, 6]);
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
      ctx.setLineDash([]); // Reset dash

      // 3. SAPPHIRE RIVER FLOWS & ACTIVE SALMON
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      const ripplePos = (frameTick * 0.95) % 180;
      ctx.fillRect(332 + Math.sin(frameTick * 0.03) * 4, 80 + (ripplePos % 480), 10, 2);
      ctx.fillRect(342 + Math.cos(frameTick * 0.04) * 3, 260 + ((ripplePos + 90) % 480), 8, 1.5);

      // Animated salmon fish jumping in river
      for (let f = 0; f < 3; f++) {
        const fy = (f * 180 + frameTick * 0.8) % 640 - 20;
        const fx = 338 + Math.sin(frameTick * 0.05 + f) * 8;
        ctx.fillStyle = "#f43f5e"; // hot coral scale
        ctx.fillRect(fx - 2, fy - 4, 4, 8);
        const tailWag = Math.floor(frameTick / 5) % 2 === 0 ? 1.5 : -1.5;
        ctx.fillStyle = "#be123c";
        ctx.fillRect(fx + tailWag - 0.5, fy + 4, 1.5, 3);
      }

      // Wooden rustic bridge details (drawn over the River bridge tiles to add wood borders)
      ctx.fillStyle = "#451a03"; // dark wood columns
      ctx.fillRect(318, 190, 4, 66);
      ctx.fillRect(382, 190, 4, 66);

      // 4. LANDSCAPE PROPS AND SWAYING TREES
      const assets = getMetaAssets();

      const drawScenicTree = (tx: number, ty: number, treeType: "oak" | "pine" | "cyber") => {
        const sway = Math.sin(frameTick * 0.035 + tx) * 1.5;
        const treeCanvas =
          treeType === "oak"
            ? assets.landscapeProps.oakTree
            : treeType === "pine"
            ? assets.landscapeProps.pineTree
            : assets.landscapeProps.neonCrystalTree;

        ctx.save();
        ctx.translate(tx, ty);
        // Transform for wind-sway effect
        ctx.transform(1, 0, sway * 0.045, 1, 0, 0);
        ctx.drawImage(treeCanvas, -16, -42);
        ctx.restore();
      };

      const drawScenicCottage = (hx: number, hy: number) => {
        ctx.drawImage(assets.landscapeProps.cozyCottage, hx - 32, hy - 32);

        // Animated smoke plumes rising puffs
        const smokeOffset = (frameTick % 28) / 3.5;
        ctx.fillStyle = "rgba(241, 245, 249, 0.4)";
        ctx.beginPath();
        ctx.arc(hx + 11 - smokeOffset * 0.4, hy - 14 - smokeOffset * 1.4, 2.5 + smokeOffset * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx + 13 - smokeOffset * 0.2, hy - 20 - smokeOffset * 1.6, 3.5 + smokeOffset * 0.25, 0, Math.PI * 2);
        ctx.fill();
      };

      const drawScenicTemple = (tx: number, ty: number) => {
        ctx.drawImage(assets.landscapeProps.classicalTemple, tx - 40, ty - 46);
      };

      const drawScenicSpire = (sx: number, sy: number) => {
        ctx.drawImage(assets.landscapeProps.cyberSpire, sx - 24, sy - 52);
      };

      // Helper for drawing snowy mountain base
      const drawMountain = (mx: number, my: number, size: number) => {
        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - size, my + size * 1.5);
        ctx.lineTo(mx + size, my + size * 1.5);
        ctx.closePath();
        ctx.fill();

        // Snowy cap
        ctx.fillStyle = "#f1f5f9";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - size * 0.3, my + size * 0.45);
        ctx.lineTo(mx + size * 0.3, my + size * 0.45);
        ctx.closePath();
        ctx.fill();
      };

      // A. Main West Island (Logic Spires & Sakura Trees)
      drawScenicSpire(110, 150);
      drawScenicSpire(260, 220);
      drawScenicTree(90, 220, "cyber");
      drawScenicTree(140, 270, "cyber");
      drawScenicTree(130, 100, "cyber");

      // Floating logic symbols
      ctx.fillStyle = "rgba(233, 213, 255, 0.4)";
      ctx.font = 'bold 9px "JetBrains Mono", monospace';
      ctx.fillText("p ∧ q", 80, 130);
      ctx.fillText("¬ p", 230, 150);
      ctx.fillText("∃ x ∈ S", 170, 90);

      // B. Main East Island (Agrarian cottages & Oak forests)
      drawScenicCottage(655, 140);
      drawScenicCottage(550, 110);
      // crop sprouts
      ctx.fillStyle = "#a3e635";
      for (let cropY = 175; cropY <= 192; cropY += 6) {
        ctx.fillRect(525, cropY, 2.5, 2.5);
        ctx.fillRect(535, cropY, 2.5, 2.5);
        ctx.fillRect(545, cropY, 2.5, 2.5);
      }
      ctx.fillStyle = "#fb923c"; // golden pumpkins
      for (let cropX = 566; cropX <= 600; cropX += 8) {
        ctx.fillRect(cropX, 232, 3.5, 3);
        ctx.fillRect(cropX + 2, 230, 2, 3.5);
      }
      // wooden fences
      ctx.fillStyle = "#7c2d12";
      ctx.fillRect(510, 160, 2, 42);
      ctx.fillRect(510, 170, 45, 2);
      ctx.fillRect(510, 196, 45, 2);
      // trees
      drawScenicTree(600, 80, "oak");
      drawScenicTree(680, 210, "oak");
      drawScenicTree(710, 160, "oak");
      drawScenicTree(720, 100, "oak");

      // C. Main South Island (Philosophy Greek Temples & Shrines)
      drawScenicTemple(330, 460);
      drawScenicTemple(520, 440);
      // Mountains
      drawMountain(410, 390, 40);
      drawMountain(460, 410, 30);
      // Shrines & Braziers with active flames
      const flameBrazier = assets.landscapeProps.shrineBrazier[Math.floor(frameTick / 6) % 4];
      ctx.drawImage(flameBrazier, 380 - 8, 460 - 12);
      ctx.drawImage(flameBrazier, 470 - 8, 470 - 12);
      // Ancient cypress trees
      drawScenicTree(280, 480, "pine");
      drawScenicTree(560, 490, "pine");
      drawScenicTree(360, 520, "pine");

      // 5. WIND WEATHER SOARING WHITE BIRDS
      const birdX = (frameTick * 0.85) % 960 - 100;
      const birdY = 110 + Math.sin(frameTick * 0.015) * 20;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      const wingSway = Math.sin(frameTick * 0.14) > 0 ? -4 : 4;
      ctx.moveTo(birdX - 7, birdY + wingSway);
      ctx.lineTo(birdX, birdY);
      ctx.lineTo(birdX + 7, birdY + wingSway);
      ctx.stroke();

      // 6. VOLUME DRIFTING CLOUDS OVERLAY (casts soft shadows below)
      const cloudCanvas = assets.landscapeProps.cloud;
      for (let c = 0; c < 2; c++) {
        const cSpeed = 0.4 + c * 0.15;
        const cx = ((frameTick * cSpeed) + c * 380) % 960 - 100;
        const cy = 40 + c * 240 + Math.sin(frameTick * 0.012 + c) * 12;
        // Shadow cast
        ctx.fillStyle = "rgba(0, 0, 0, 0.07)";
        ctx.beginPath();
        ctx.ellipse(cx + 48, cy + 50, 38, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        // Cloud body
        ctx.drawImage(cloudCanvas, cx, cy);
      }

      // 7. DRAW INTERACTIVE AND GLOWING LANDMARK NODES
      LANDMARKS.forEach((node) => {
        const isSolved = solvedNodeIds.includes(node.id);
        const pulse = 1 + Math.sin(frameTick * 0.08) * 0.08;

        // Selection halo
        const isHovered = hoveredNode?.id === node.id;
        const isActive = activeNodeId === node.id;
        if (isHovered || isActive) {
          ctx.strokeStyle = "rgba(255, 251, 235, 0.6)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 22 * pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Glow halo
        const gradient = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, 18 * pulse);
        if (isSolved) {
          gradient.addColorStop(0, node.color);
          gradient.addColorStop(1, "rgba(0,0,0,0)");
        } else {
          gradient.addColorStop(0, "rgba(148, 163, 184, 0.5)");
          gradient.addColorStop(1, "rgba(0,0,0,0)");
        }
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 20 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Pin center
        ctx.fillStyle = isSolved ? node.color : "#64748b";
        ctx.strokeStyle = isSolved ? "#ffffff" : "#475569";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Icon decals overlay
        ctx.save();
        ctx.translate(node.x, node.y - 12);

        if (node.icon === "gate") {
          ctx.fillStyle = isSolved ? "#d8b4fe" : "#94a3b8";
          ctx.fillRect(-6, -4, 3, 10);
          ctx.fillRect(4, -4, 3, 10);
          ctx.fillRect(-6, -6, 13, 3);
          if (isSolved) {
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(-1, -1, 3, 3);
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
        } else {
          ctx.fillStyle = isSolved ? "#fb923c" : "#64748b";
          ctx.fillRect(-6, -3, 13, 7);
          ctx.fillStyle = isSolved ? "#ffedd5" : "#475569";
          ctx.fillRect(-4, -1, 9, 3);
        }
        ctx.restore();
      });

      // 8. DOUBLE DOT PATH FOCUS INDICATORS
      if (isWalking) {
        ctx.strokeStyle = "#fb7185";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(targetRef.current.x, targetRef.current.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#fb7185";
        ctx.fillRect(targetRef.current.x - 1, targetRef.current.y - 5, 2, 10);
        ctx.fillRect(targetRef.current.x - 5, targetRef.current.y - 1, 10, 2);
      }

      // 9. DRAW JRPG PLAYER AVATAR (Voyager character with pixel coat and headband)
      const ax = posRef.current.x;
      const ay = posRef.current.y;
      
      ctx.save();
      // Draw shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
      ctx.beginPath();
      ctx.ellipse(ax, ay + 14, 11, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Draw paper-doll custom composited avatar
      const walkFrame = Math.floor(frameTick / 6) % 4;

      if (avatarConfig) {
        ctx.save();
        // Since the draw function expects frame coordinates inside 64x48 width,
        // we offset ax and ay so the feet align correctly at (ax, ay)
        ctx.translate(ax - 32, ay - 30);
        drawCompositedAvatar(ctx, 0, 0, avatarConfig, direction, walkFrame, isWalking);
        ctx.restore();
      } else {
        ctx.translate(ax, ay);

        // Bob character up and down slightly if walking (Stardew-like bouncy walk cycles)
        const bobY = isWalking ? Math.round(Math.sin(frameTick * 0.3) * 1.5) : 0;
        const lfOffset = (isWalking && walkFrame === 0) ? -3 : 0;
        const rfOffset = (isWalking && walkFrame === 2) ? -3 : 0;

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
