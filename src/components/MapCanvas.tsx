import React, { useRef, useEffect, useState, useMemo } from "react";
import { LandmarkNode, Position } from "../types";
import { LANDMARKS } from "../landmarksData";
import { AvatarConfig, drawCompositedAvatar } from "../utils/avatarDrawer";
import {
  getMetaAssets,
  generateTileMap,
  drawTileBackground,
} from "../utils/metaAssets";
import { Compass, ZoomIn, ZoomOut, Maximize, Loader } from "lucide-react";

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync refs to avoid stale values in fast-running animation loops
  const posRef = useRef<Position>(avatarPos);
  const targetRef = useRef<Position>(targetPos);

  // Generate the procedurally stitched 100x80 (3200x2560px) tile matrix
  const mapMatrix = useMemo(() => generateTileMap(), []);

  // Responsive canvas size dimension state (default fallback 800x600)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Camera settings
  const [cameraMode, setCameraMode] = useState<"follow" | "free">("follow");
  const [zoom, setZoom] = useState<number>(1.0);

  // Panning camera logical coordinates
  const cameraRef = useRef<Position>({ x: avatarPos.x, y: avatarPos.y });

  // Floating map status and diurnal widgets
  const [hoveredNode, setHoveredNode] = useState<LandmarkNode | null>(null);
  
  // High-performance drawing variables as refs so we don't trigger busy React cycles in animation frames
  const directionRef = useRef<"up" | "down" | "left" | "right">("down");
  const isWalkingRef = useRef<boolean>(false);
  const keysPressedRef = useRef<Record<string, boolean>>({});

  const [tick, setTick] = useState<number>(0);
  const [timeOfDay, setTimeOfDay] = useState<"Morning" | "Noon" | "Sunset" | "Night">("Noon");

  // Mouse Drag / Free Pan trackers
  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartCamRef = useRef<Position>({ x: 0, y: 0 });
  const hasDraggedDistanceRef = useRef<number>(0);

  useEffect(() => {
    posRef.current = avatarPos;
    // Camera snap or follow initializer
    if (cameraMode === "follow") {
      cameraRef.current = { x: avatarPos.x, y: avatarPos.y };
    }
  }, [avatarPos, cameraMode]);

  useEffect(() => {
    targetRef.current = targetPos;
  }, [targetPos]);

  // Keyboard Navigation Events hook (WASD & Arrow Keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDialogueOpen) {
        keysPressedRef.current = {};
        return;
      }
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "KeyW", "KeyA", "KeyS", "KeyD", "Space"].includes(e.code)) {
        e.preventDefault();
      }
      keysPressedRef.current[e.code] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.code] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isDialogueOpen]);

  // Set up responsive dimension observer on container resize
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      setDimensions({
        width: container.clientWidth,
        height: container.clientHeight || 560,
      });
    };

    handleResize();

    const observer = new ResizeObserver(() => {
      handleResize();
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Calculate coordinates projection mapping screen <-> logical world
  const screenToWorld = (screenX: number, screenY: number): Position => {
    return {
      x: cameraRef.current.x + (screenX - dimensions.width / 2) / zoom,
      y: cameraRef.current.y + (screenY - dimensions.height / 2) / zoom,
    };
  };

  const worldToScreen = (worldX: number, worldY: number): Position => {
    return {
      x: (worldX - cameraRef.current.x) * zoom + dimensions.width / 2,
      y: (worldY - cameraRef.current.y) * zoom + dimensions.height / 2,
    };
  };

  // Perform free map drag or clicking to move
  const handleMouseDown = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDialogueOpen) return;

    dragStartRef.current = { x: event.clientX, y: event.clientY };
    dragStartCamRef.current = { ...cameraRef.current };
    isDraggingRef.current = true;
    hasDraggedDistanceRef.current = 0;
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Convert screen pointers to logical world coordinates
    const clickedLogical = screenToWorld(mouseX, mouseY);

    // If active drag is happening, drag map offsets
    if (isDraggingRef.current) {
      const dx = event.clientX - dragStartRef.current.x;
      const dy = event.clientY - dragStartRef.current.y;
      const dragDist = Math.hypot(dx, dy);
      hasDraggedDistanceRef.current += dragDist;

      cameraRef.current.x = dragStartCamRef.current.x - dx / zoom;
      cameraRef.current.y = dragStartCamRef.current.y - dy / zoom;

      // Limit camera panning to world boundaries
      cameraRef.current.x = Math.max(100, Math.min(3100, cameraRef.current.x));
      cameraRef.current.y = Math.max(100, Math.min(2460, cameraRef.current.y));

      if (dragDist > 5 && cameraMode !== "free") {
        setCameraMode("free");
      }
    }

    // Hover detection over Landmark pins
    let found: LandmarkNode | null = null;
    for (const node of LANDMARKS) {
      const dist = Math.hypot(node.x - clickedLogical.x, node.y - clickedLogical.y);
      if (dist < 32) {
        found = node;
        break;
      }
    }
    setHoveredNode(found);

    // Update cursor style nicely
    if (found && !isDialogueOpen) {
      canvas.style.cursor = "pointer";
    } else if (isDraggingRef.current) {
      canvas.style.cursor = "grabbing";
    } else {
      canvas.style.cursor = isDialogueOpen ? "not-allowed" : "default";
    }
  };

  const handleMouseUp = (event: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;

    // If mouse drag distance is minimal, trigger a standard movement click!
    if (hasDraggedDistanceRef.current < 6) {
      triggerCharacterWalk(event);
    }
  };

  const triggerCharacterWalk = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDialogueOpen) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const logical = screenToWorld(mouseX, mouseY);

    // Clamp targeting pos within the full massive overworld boundaries
    const clampedY = Math.max(15, Math.min(2545, logical.y));
    const clampedX = Math.max(15, Math.min(3185, logical.x));

    setTargetPos({ x: clampedX, y: clampedY });
  };

  // Zoom manipulation with the scroll wheel
  const handleWheel = (event: React.WheelEvent<HTMLCanvasElement>) => {
    if (isDialogueOpen) return;
    const scrollDelta = event.deltaY < 0 ? 0.08 : -0.08;
    setZoom((p) => Math.max(0.45, Math.min(2.2, p + scrollDelta)));
  };

  // Main high-performance overworld loop
  useEffect(() => {
    let frameTick = 0;

    const isWalkable = (x: number, y: number): boolean => {
      const c = Math.floor(x / 32);
      const r = Math.floor(y / 32);
      if (c < 0 || c >= 100 || r < 0 || r >= 80) return false;
      const tile = mapMatrix[r][c];
      return tile !== "deep_water" && tile !== "river_water";
    };

    const checkWalkable = (x: number, y: number): boolean => {
      // Anchoring character foot boundaries nicely to allow snug traversals (character is 32px height)
      const feetY = y + 12;
      const points = [
        { x: x, y: feetY }, // Foot base center
        { x: x - 6, y: feetY }, // Left foot edge
        { x: x + 6, y: feetY }, // Right foot edge
        { x: x, y: feetY - 4 }, // Top anchor line
        { x: x, y: feetY + 4 }, // Bottom anchor line
      ];
      return points.every((pt) => isWalkable(pt.x, pt.y));
    };

    const updateGame = () => {
      if (isDialogueOpen) {
        isWalkingRef.current = false;
        keysPressedRef.current = {};
        draw();
        animationFrameRef.current = requestAnimationFrame(updateGame);
        return;
      }

      frameTick++;
      setTick(frameTick);

      // 1. Keyboard Controls Input
      let kdx = 0;
      let kdy = 0;

      if (keysPressedRef.current["ArrowUp"] || keysPressedRef.current["KeyW"]) kdy -= 1;
      if (keysPressedRef.current["ArrowDown"] || keysPressedRef.current["KeyS"]) kdy += 1;
      if (keysPressedRef.current["ArrowLeft"] || keysPressedRef.current["KeyA"]) kdx -= 1;
      if (keysPressedRef.current["ArrowRight"] || keysPressedRef.current["KeyD"]) kdx += 1;

      const keyboardMoving = kdx !== 0 || kdy !== 0;

      if (keyboardMoving) {
        isWalkingRef.current = true;
        // Erase mouse travel target to prevent conflict
        targetRef.current = { ...posRef.current };

        // Normalize movement speed
        const length = Math.hypot(kdx, kdy);
        const speed = 4.3; // responsive walking speed for grand map
        const stepX = (kdx / length) * speed;
        const stepY = (kdy / length) * speed;

        // Determine face direction based on larger axis displacement
        if (Math.abs(kdx) >= Math.abs(kdy)) {
          directionRef.current = kdx > 0 ? "right" : "left";
        } else {
          directionRef.current = kdy > 0 ? "down" : "up";
        }

        // Try moving horizontally and vertically separately (snug sliding along riverbanks!)
        const nextX = posRef.current.x + stepX;
        const nextY = posRef.current.y + stepY;

        let movedX = false;
        let movedY = false;

        if (checkWalkable(nextX, posRef.current.y)) {
          posRef.current.x = Math.max(15, Math.min(3185, nextX));
          movedX = true;
        }
        if (checkWalkable(posRef.current.x, nextY)) {
          posRef.current.y = Math.max(15, Math.min(2545, nextY));
          movedY = true;
        }

        // Apply fallback diagonal check if separate sliding didn't fire
        if (!movedX && !movedY && checkWalkable(nextX, nextY)) {
          posRef.current.x = Math.max(15, Math.min(3185, nextX));
          posRef.current.y = Math.max(15, Math.min(2545, nextY));
        }

        // Sync to parent React state
        setAvatarPos({ x: posRef.current.x, y: posRef.current.y });

        // Proximity checks for uncompleted milestones
        for (const node of LANDMARKS) {
          const solved = solvedNodeIds.includes(node.id);
          if (!solved) {
            const dist = Math.hypot(node.x - posRef.current.x, node.y - posRef.current.y);
            if (dist < 42 && activeNodeId !== node.id) {
              isWalkingRef.current = false;
              keysPressedRef.current = {};
              onNearNode(node);
              break;
            }
          }
        }
      } else {
        // 2. Mouse Click Target Navigation
        const dx = targetRef.current.x - posRef.current.x;
        const dy = targetRef.current.y - posRef.current.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 3) {
          isWalkingRef.current = true;
          const speed = 4.3;
          const angle = Math.atan2(dy, dx);
          const stepX = Math.cos(angle) * speed;
          const stepY = Math.sin(angle) * speed;

          // Determine visual facing direction
          const absDx = Math.abs(dx);
          const absDy = Math.abs(dy);
          if (absDx > absDy) {
            directionRef.current = dx > 0 ? "right" : "left";
          } else {
            directionRef.current = dy > 0 ? "down" : "up";
          }

          const nextX = posRef.current.x + stepX;
          const nextY = posRef.current.y + stepY;

          let moved = false;
          // Apply sliding collision checks
          if (checkWalkable(nextX, posRef.current.y)) {
            posRef.current.x = Math.max(15, Math.min(3185, nextX));
            moved = true;
          }
          if (checkWalkable(posRef.current.x, nextY)) {
            posRef.current.y = Math.max(15, Math.min(2545, nextY));
            moved = true;
          }

          if (!moved && checkWalkable(nextX, nextY)) {
            posRef.current.x = Math.max(15, Math.min(3185, nextX));
            posRef.current.y = Math.max(15, Math.min(2545, nextY));
            moved = true;
          }

          // If really stuck, clear target
          if (!moved) {
            targetRef.current = { ...posRef.current };
            setTargetPos({ ...posRef.current });
            isWalkingRef.current = false;
          } else {
            setAvatarPos({ x: posRef.current.x, y: posRef.current.y });
          }

          // Proximity checks for uncompleted milestones
          for (const node of LANDMARKS) {
            const solved = solvedNodeIds.includes(node.id);
            if (!solved) {
              const dist = Math.hypot(node.x - posRef.current.x, node.y - posRef.current.y);
              if (dist < 42 && activeNodeId !== node.id) {
                targetRef.current = { ...posRef.current };
                setTargetPos({ ...posRef.current });
                isWalkingRef.current = false;
                onNearNode(node);
                break;
              }
            }
          }
        } else {
          isWalkingRef.current = false;
        }
      }

      // Live camera interpolation when following player
      if (cameraMode === "follow") {
        cameraRef.current.x += (posRef.current.x - cameraRef.current.x) * 0.08;
        cameraRef.current.y += (posRef.current.y - cameraRef.current.y) * 0.08;
      }

      // Draw compiled objects onto screen
      draw();

      animationFrameRef.current = requestAnimationFrame(updateGame);
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Reset transforms
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Rely on standard 1:1 CSS scaling for 100% robust cross-platform coordinate tracking
      const dpr = 1;
      ctx.scale(dpr, dpr);

      // View culling coordinate thresholds
      const halfW = dimensions.width / 2;
      const halfH = dimensions.height / 2;

      const viewportLeft = cameraRef.current.x - halfW / zoom;
      const viewportTop = cameraRef.current.y - halfH / zoom;
      const viewportRight = cameraRef.current.x + halfW / zoom;
      const viewportBottom = cameraRef.current.y + halfH / zoom;

      // Spatial Visibility guard
      const isVisible = (x: number, y: number, padding = 96) => {
        return (
          x >= viewportLeft - padding &&
          x <= viewportRight + padding &&
          y >= viewportTop - padding &&
          y <= viewportBottom + padding
        );
      };

      // ----------------------------------------------------
      // START CAMERA PERSPECTIVE MATRIX TRANSFORMS
      // ----------------------------------------------------
      ctx.save();
      ctx.translate(dimensions.width / 2, dimensions.height / 2);
      ctx.scale(zoom, zoom);
      ctx.translate(-cameraRef.current.x, -cameraRef.current.y);

      // 1. DYNAMIC WATER BACKGROUND & SEWN MAP TILES
      drawTileBackground(ctx, mapMatrix, viewportLeft, viewportTop, viewportRight, viewportBottom);

      // Deep ocean foaming ripples
      ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
      for (let x = Math.floor(viewportLeft / 192) * 192; x < viewportRight; x += 192) {
        for (let y = Math.floor(viewportTop / 192) * 192; y < viewportBottom; y += 192) {
          const shift = Math.floor(frameTick / 16) % 8;
          ctx.fillRect(x + shift * 2.5, y + shift, 16, 1.5);
          ctx.fillRect(x + shift * 2 + 32, y + shift + 24, 10, 1);
        }
      }

      // 2. ENRICHED COBBLESTONE ROADS & OVERWORLD GRAVEL TRACKS
      const drawCobbleRoad = (x1: number, y1: number, cpX: number, cpY: number, x2: number, y2: number, isStraight = false) => {
        const steps = isStraight ? 65 : 85;
        ctx.save();
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          let rx = 0;
          let ry = 0;
          if (isStraight) {
            rx = x1 + (x2 - x1) * t;
            ry = y1 + (y2 - y1) * t;
          } else {
            // Quadratic bezier calculation
            rx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * cpX + t * t * x2;
            ry = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * cpY + t * t * y2;
          }

          if (!isVisible(rx, ry, 16)) continue;

          // Shadow under each cobblestone
          ctx.fillStyle = "rgba(12, 19, 36, 0.4)";
          ctx.beginPath();
          ctx.arc(rx, ry + 1.2, 5.2, 0, Math.PI * 2);
          ctx.fill();

          // Smooth blending pebble color based on coordinate boundaries (regional theme matching)
          if (ry > 1300) {
            // Southern Philosophy island (Ancient stone tile color palette)
            ctx.fillStyle = i % 2 === 0 ? "#475569" : "#64748b";
          } else if (rx < 1300) {
            // Western Cyber Logic island (Glow amethyst cobblestones)
            ctx.fillStyle = i % 2 === 0 ? "#5b21b6" : "#7c3aed";
          } else {
            // Eastern Economics pastures (Rustic brown gravel soil)
            ctx.fillStyle = i % 2 === 0 ? "#7c2d12" : "#b45309";
          }
          
          ctx.beginPath();
          ctx.arc(rx, ry, 4.2, 0, Math.PI * 2);
          ctx.fill();

          // Small shiny highlights
          if (i % 3 === 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
            ctx.fillRect(rx - 1.5, ry - 1.5, 1.8, 1);
          }
        }
        ctx.restore();
      };

      // Draw three majestic cobbled trade routes connecting the islands over the water bridges!
      drawCobbleRoad(600, 750, 800, 1400, 1600, 1950, false); // Logic to Philosophy
      drawCobbleRoad(2550, 750, 2300, 1450, 1600, 1950, false); // Economics to Philosophy
      drawCobbleRoad(600, 750, 0, 0, 2550, 750, true); // Direct route crossings (Straight)

      // Golden sand trim guideline underneath to tie standard pathway aesthetics together
      ctx.strokeStyle = "rgba(252, 211, 77, 0.25)";
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 12]);
      ctx.beginPath();
      ctx.moveTo(600, 750);
      ctx.quadraticCurveTo(800, 1400, 1600, 1950);
      ctx.moveTo(2550, 750);
      ctx.quadraticCurveTo(2300, 1450, 1600, 1950);
      ctx.moveTo(600, 750);
      ctx.lineTo(2550, 750);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 3. MIDRIVER SAPPHIRE CHANNELS & LEAPING CORAL SALMON FISH
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      const rippleOsc = (frameTick * 0.95) % 360;
      
      const getRiverX = (y: number) => {
        return 1600 + Math.sin((y / 32) * 0.12) * 3.5 * 32;
      };

      for (let yY = Math.floor(viewportTop / 128) * 128; yY < viewportBottom + 64; yY += 128) {
        if (yY < 0 || yY > 2560) continue;
        const fishOnScreen = isVisible(getRiverX(yY), yY, 60);
        if (fishOnScreen) {
          ctx.fillRect(getRiverX(yY) - 10 + Math.sin(frameTick * 0.04) * 5, yY + (rippleOsc % 128), 12, 2);
        }
      }

      // Leaping salmon fish jumping high in flowing river
      for (let f = 0; f < 5; f++) {
        const fy = ((f * 480 + frameTick * 0.95) % 2500) + 30;
        const fx = getRiverX(fy) + Math.sin(frameTick * 0.05 + f) * 12;

        if (isVisible(fx, fy, 40)) {
          ctx.fillStyle = "#f43f5e"; // coral orange scale
          ctx.fillRect(fx - 2, fy - 4, 4, 8);
          const tailSway = Math.floor(frameTick / 4) % 2 === 0 ? 2 : -2;
          ctx.fillStyle = "#be123c"; // dark tail fin
          ctx.fillRect(fx + tailSway - 0.5, fy + 4, 1.5, 3.5);
        }
      }

      // 4. RUSTIC CENTRAL BRIDGES OVERLAY (Double wooden side rails)
      const drawLogsBridge = (bx: number, by: number) => {
        if (isVisible(bx, by, 80)) {
          ctx.fillStyle = "#3b1a03"; // dark timber borders
          ctx.fillRect(bx - 48, by - 48, 4, 96);
          ctx.fillRect(bx + 48, by - 48, 4, 96);
        }
      };
      // Main bridges at intersections
      drawLogsBridge(getRiverX(720), 720);
      drawLogsBridge(getRiverX(1536), 1536);

      // 5. RICH LANDSCAPE DECORATIONS & TREES
      const assets = getMetaAssets();

      const drawSwayingTree = (tx: number, ty: number, style: "oak" | "pine" | "cyber") => {
        if (!isVisible(tx, ty, 64)) return;

        const swayAngle = Math.sin(frameTick * 0.038 + tx * 0.07) * 1.5;
        const treeCanvas =
          style === "oak"
            ? assets.landscapeProps.oakTree
            : style === "pine"
            ? assets.landscapeProps.pineTree
            : assets.landscapeProps.neonCrystalTree;

        ctx.save();
        ctx.translate(tx, ty);
        // Simple affine transform for flexible organic swaying in the storm/breeze
        ctx.transform(1, 0, swayAngle * 0.042, 1, 0, 0);
        ctx.drawImage(treeCanvas, -16, -42);
        ctx.restore();
      };

      const drawRusticCottage = (hx: number, hy: number) => {
        if (!isVisible(hx, hy, 80)) return;
        ctx.drawImage(assets.landscapeProps.cozyCottage, hx - 32, hy - 32);

        // Smokestacks smoke particles cycle
        const smkOffset = (frameTick % 24) / 3;
        ctx.fillStyle = "rgba(241, 245, 249, 0.38)";
        ctx.beginPath();
        ctx.arc(hx + 11 - smkOffset * 0.4, hy - 14 - smkOffset * 1.3, 2.5 + smkOffset * 0.15, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(hx + 13 - smkOffset * 0.3, hy - 20 - smkOffset * 1.5, 3.5 + smkOffset * 0.2, 0, Math.PI * 2);
        ctx.fill();
      };

      const drawWhiteTemple = (tx: number, ty: number) => {
        if (!isVisible(tx, ty, 96)) return;
        ctx.drawImage(assets.landscapeProps.classicalTemple, tx - 40, ty - 46);
      };

      const drawHighSpire = (sx: number, sy: number) => {
        if (!isVisible(sx, sy, 96)) return;
        ctx.drawImage(assets.landscapeProps.cyberSpire, sx - 24, sy - 52);
      };

      // Rocky white mountains
      const drawSnowyPeak = (mx: number, my: number, size: number) => {
        if (!isVisible(mx, my, size * 2)) return;

        ctx.fillStyle = "#334155";
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - size, my + size * 1.5);
        ctx.lineTo(mx + size, my + size * 1.5);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#f8fafc"; // Snow capped
        ctx.beginPath();
        ctx.moveTo(mx, my);
        ctx.lineTo(mx - size * 0.3, my + size * 0.45);
        ctx.lineTo(mx + size * 0.3, my + size * 0.45);
        ctx.closePath();
        ctx.fill();
      };

      // --- RICH PROCEDURAL LANDSCAPE DECORATION HELPERS ---
      // Beautiful wild flower blankets
      const drawWildFlowers = (x: number, y: number, style: "cyber" | "agrarian" | "ancient") => {
        if (!isVisible(x, y, 24)) return;
        ctx.save();
        ctx.translate(x, y);

        const colors = 
          style === "cyber" ? ["#ec4899", "#a855f7", "#06b6d4"] :
          style === "agrarian" ? ["#facc15", "#f43f5e", "#10b981"] :
          ["#3b82f6", "#60a5fa", "#ffffff"];

        colors.forEach((col, idx) => {
          const rx = Math.sin(idx * 75 + x) * 9;
          const ry = Math.cos(idx * 45 + y) * 7;
          
          // Shadow
          ctx.fillStyle = "rgba(12, 19, 36, 0.15)";
          ctx.beginPath();
          ctx.arc(rx, ry + 1, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Petal
          ctx.fillStyle = col;
          ctx.beginPath();
          ctx.arc(rx, ry, 2, 0, Math.PI * 2);
          ctx.fill();
          
          // Pistil
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(rx - 0.4, ry - 0.4, 0.8, 0.8);
        });
        ctx.restore();
      };

      // Adorable hopping white rabbits
      const drawHoppingBunny = (bx: number, by: number) => {
        if (!isVisible(bx, by, 32)) return;
        const hop = Math.max(0, Math.sin(frameTick * 0.08 + bx * 0.1) * 6.5);
        const ry = by - hop;

        ctx.save();
        ctx.translate(bx, ry);

        // Ground shadow
        ctx.fillStyle = "rgba(12, 19, 36, 0.16)";
        ctx.beginPath();
        ctx.ellipse(0, hop + 6, 5 - hop * 0.2, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Fluffy body
        ctx.fillStyle = "#f1f5f9"; // high-density cozy snow white
        ctx.beginPath();
        ctx.ellipse(-2, 2, 4.5, 3.5, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(2, -1, 3, 0, Math.PI * 2);
        ctx.fill();

        // Tall fluffy ears
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(-0.2, -6, 1.2, 4);
        ctx.fillRect(1.5, -6, 1.2, 4);
        ctx.fillStyle = "#fecdd3"; // warm inner pink ear
        ctx.fillRect(1.6, -5, 0.6, 3);

        // Cute tail
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(-7, 2, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Soft pink eye
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(2.7, -2, 1, 1);

        ctx.restore();
      };

      // Cyber butterfly particles
      const drawLogicButterflies = (sx: number, sy: number) => {
        if (!isVisible(sx, sy, 80)) return;
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const angle = frameTick * 0.035 + i * 2.1;
          const radius = 22 + Math.sin(frameTick * 0.02 + i) * 7;
          const bx = sx + Math.cos(angle) * radius;
          const by = sy - 24 + Math.sin(angle * 1.4) * radius * 0.45;

          ctx.fillStyle = "rgba(34, 211, 238, 0.45)"; // glow cyan
          ctx.beginPath();
          ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#e2fbfd";
          ctx.fillRect(bx - 0.7, by - 0.7, 1.4, 1.4);
        }
        ctx.restore();
      };

      // Philosophy wisdom fire wisps
      const drawPhilosophyWisps = (tx: number, ty: number) => {
        if (!isVisible(tx, ty, 96)) return;
        ctx.save();
        for (let i = 0; i < 2; i++) {
          const wOsc = frameTick * 0.024 + i * Math.PI;
          const wx = tx + Math.sin(wOsc * 1.3) * 32;
          const wy = ty - 18 - Math.cos(wOsc) * 22;

          ctx.fillStyle = "rgba(147, 197, 253, 0.35)"; // ethereal wisdom blue aura
          ctx.beginPath();
          ctx.arc(wx, wy, 5 + Math.sin(frameTick * 0.07 + i) * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = "#f8fafc";
          ctx.beginPath();
          ctx.arc(wx, wy - 1, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      };

      // Mercantile supply crates
      const drawScenicCrate = (cx: number, cy: number) => {
        if (!isVisible(cx, cy, 32)) return;
        ctx.save();
        ctx.translate(cx, cy);

        // shadow
        ctx.fillStyle = "rgba(12, 19, 36, 0.25)";
        ctx.fillRect(-8, 6, 16, 2.5);

        // Mahogany planks base
        ctx.fillStyle = "#7c2d12";
        ctx.fillRect(-8, -8, 16, 14);
        // Golden pine core faces
        ctx.fillStyle = "#d97706";
        ctx.fillRect(-6, -6, 12, 10);
        // cross braces
        ctx.fillStyle = "#7c2d12";
        ctx.beginPath();
        ctx.moveTo(-6, -6);
        ctx.lineTo(6, 4);
        ctx.lineTo(4, 4);
        ctx.lineTo(-6, -4);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      };

      // Mercantile wooden barrels
      const drawScenicBarrel = (bx: number, by: number) => {
        if (!isVisible(bx, by, 32)) return;
        ctx.save();
        ctx.translate(bx, by);

        // shadow
        ctx.fillStyle = "rgba(12, 19, 36, 0.25)";
        ctx.beginPath();
        ctx.ellipse(0, 5, 5.5, 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Barrel cedar wood
        ctx.fillStyle = "#9a3412";
        ctx.fillRect(-5.5, -8, 11, 13);
        // Curved timber ridges
        ctx.fillStyle = "#7c2d12";
        ctx.fillRect(-5.5, -8, 1.5, 13);
        ctx.fillRect(4, -8, 1.5, 13);
        // Iron rings
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(-5.5, -5, 11, 1.5);
        ctx.fillRect(-5.5, 2, 11, 1.5);

        ctx.restore();
      };

      // Ancient Lyceum Columns ruins shards
      const drawAncientRuinColumn = (rx: number, ry: number) => {
        if (!isVisible(rx, ry, 32)) return;
        ctx.save();
        ctx.translate(rx, ry);

        // shadow
        ctx.fillStyle = "rgba(12, 19, 36, 0.2)";
        ctx.fillRect(-6, 4, 12, 2.5);

        // Pediment foundation
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(-7, 2, 14, 2.5);
        // Fluted column base structure
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(-5, -12, 10, 14);
        // Shadow fluting crevices
        ctx.fillStyle = "#94a3b8";
        ctx.fillRect(-2, -12, 1, 14);
        ctx.fillRect(1, -12, 1, 14);

        // Ancient fallen drum chunk to the right
        ctx.fillStyle = "#475569";
        ctx.fillRect(4, 2, 10, 2.5);
        ctx.fillStyle = "#cbd5e1";
        ctx.fillRect(5, -1, 8, 3.5);

        ctx.restore();
      };

      // --- REGIONAL ATMOSPHERIC PARTICLE WEATHER SYSTEMS ---
      // 1. Amethyst / cyan digital rain on Island A
      const drawCyberCodeRain = () => {
        if (!isVisible(600, 750, 480)) return;
        ctx.save();
        ctx.fillStyle = "rgba(168, 85, 247, 0.22)";
        for (let col = 0; col < 16; col++) {
          const cx = 350 + col * 32 + Math.sin(col * 0.5) * 15;
          const speed = 2.4 + (col % 4) * 0.7;
          const cy = ((frameTick * speed + col * 140) % 550) + 420;
          if (isVisible(cx, cy, 24)) {
            ctx.fillRect(cx, cy, 1.2, 14);
            // Glowing binary bit head byte
            ctx.fillStyle = "rgba(103, 232, 249, 0.7)";
            ctx.fillRect(cx - 0.5, cy + 11, 2, 2);
            ctx.fillStyle = "rgba(168, 85, 247, 0.22)";
          }
        }
        ctx.restore();
      };

      // 2. Autumnal wind-blown leaf sweeps on Island B
      const drawLeafBreeze = () => {
        if (!isVisible(2550, 750, 480)) return;
        ctx.save();
        for (let i = 0; i < 18; i++) {
          const speedX = 1.4 + (i % 3) * 0.45;
          // Loop coordinates
          const lx = ((frameTick * speedX + i * 180) % 780) + 2150;
          const swingY = Math.sin(frameTick * 0.035 + i) * 22;
          const ly = 320 + (i % 4) * 150 + swingY;

          if (isVisible(lx, ly, 16)) {
            // Alternate leaf colors: ripe orange vs golden straw vs deep lime
            ctx.fillStyle = i % 3 === 0 ? "#ea580c" : i % 3 === 1 ? "#d97706" : "#65a30d";
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx + 4.5, ly + 2);
            ctx.lineTo(lx + 6, ly + 5.5);
            ctx.lineTo(lx + 1.8, ly + 4);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      };

      // 3. Thick oracle fog wisps wandering on Island C
      const drawOracleMist = () => {
        if (!isVisible(1600, 1950, 520)) return;
        ctx.save();
        ctx.fillStyle = "rgba(241, 245, 249, 0.03)"; // ultra-thin dream fluff
        for (let i = 0; i < 5; i++) {
          const mx = 1200 + i * 180 + (frameTick * 0.24) % 400;
          const my = 1720 + Math.sin(frameTick * 0.007 + i) * 40 + (i % 3) * 110;
          if (isVisible(mx, my, 140)) {
            ctx.beginPath();
            ctx.arc(mx, my, 48 + Math.sin(frameTick * 0.009 + i) * 8, 0, Math.PI * 2);
            ctx.arc(mx + 35, my + 5, 52, 0, Math.PI * 2);
            ctx.arc(mx - 30, my + 15, 38, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
          }
        }
        ctx.restore();
      };

      // --- ISLAND A DRAWINGS (Logic & Math Plains, West) ---
      // Cyber code rain weather
      drawCyberCodeRain();

      // Cyber Spires
      drawHighSpire(420, 680);
      drawHighSpire(680, 560);
      drawHighSpire(780, 890);
      drawHighSpire(480, 920);

      // Pink Sakura-ish trees
      drawSwayingTree(450, 620, "cyber");
      drawSwayingTree(510, 580, "cyber");
      drawSwayingTree(720, 640, "cyber");
      drawSwayingTree(620, 950, "cyber");
      drawSwayingTree(490, 820, "cyber");
      drawSwayingTree(710, 810, "cyber");

      // Glowing cyber ecosystems
      drawLogicButterflies(420, 680);
      drawLogicButterflies(680, 560);
      drawLogicButterflies(780, 890);
      drawLogicButterflies(480, 920);

      // Cyber flower blankets
      drawWildFlowers(440, 710, "cyber");
      drawWildFlowers(500, 600, "cyber");
      drawWildFlowers(700, 910, "cyber");
      drawWildFlowers(600, 850, "cyber");

      // Math glyph floating symbols on A
      if (isVisible(600, 750, 400)) {
        ctx.fillStyle = "rgba(192, 132, 252, 0.48)";
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText("p ∧ q", 440, 640);
        ctx.fillText("¬ p", 740, 590);
        ctx.fillText("∃ x ∈ S", 500, 830);
        ctx.fillText("∀ y", 690, 880);
      }

      // --- ISLAND B DRAWINGS (Agrarian Economics, East) ---
      // Drifting autumn leaves weather
      drawLeafBreeze();

      drawRusticCottage(2465, 450);
      drawRusticCottage(2680, 510);
      drawRusticCottage(2820, 710);
      drawRusticCottage(2420, 930);

      // Economic supply chains (Crates & Barrels near cottages and بازار)
      drawScenicCrate(2445, 500);
      drawScenicBarrel(2455, 502);
      drawScenicCrate(2580, 590);
      drawScenicBarrel(2590, 586);
      drawScenicCrate(2700, 530);
      drawScenicCrate(2840, 730);
      drawScenicBarrel(2400, 940);

      // Little cute hopping white bunnies
      drawHoppingBunny(2360, 640);
      drawHoppingBunny(2500, 860);
      drawHoppingBunny(2680, 920);
      drawHoppingBunny(2820, 590);

      // Flower meadows
      drawWildFlowers(2410, 480, "agrarian");
      drawWildFlowers(2480, 550, "agrarian");
      drawWildFlowers(2750, 680, "agrarian");
      drawWildFlowers(2640, 880, "agrarian");

      // Sown Crops Fields Sprouts (drawing beautiful orange-ripe pumpkin dots)
      if (isVisible(2550, 750, 360)) {
        ctx.fillStyle = "#fb923c"; // ripe pumpkins
        for (let fx = 2380; fx < 2460; fx += 16) {
          ctx.fillRect(fx, 680, 3.5, 3);
          ctx.fillRect(fx + 4, 678, 2, 3.5);
        }
        ctx.fillStyle = "#a3e635"; // lush young beans sprouts
        for (let fy = 820; fy < 870; fy += 8) {
          ctx.fillRect(2580, fy, 2, 2);
          ctx.fillRect(2592, fy, 2, 2);
        }
      }

      // Lush forest oak trees on B
      drawSwayingTree(2300, 580, "oak");
      drawSwayingTree(2750, 610, "oak");
      drawSwayingTree(2880, 520, "oak");
      drawSwayingTree(2350, 820, "oak");
      drawSwayingTree(2620, 960, "oak");
      drawSwayingTree(2800, 900, "oak");

      // --- ISLAND C DRAWINGS (Ancient Greek Philosophy, South) ---
      // Rolling oracle fog mist
      drawOracleMist();

      drawWhiteTemple(1320, 1720);
      drawWhiteTemple(1850, 1780);
      drawWhiteTemple(1520, 2150);

      // Wisdom ethereal aura
      drawPhilosophyWisps(1320, 1720);
      drawPhilosophyWisps(1850, 1780);
      drawPhilosophyWisps(1520, 2150);

      // Ancient Lyceum column shards
      drawAncientRuinColumn(1280, 1750);
      drawAncientRuinColumn(1390, 1710);
      drawAncientRuinColumn(1820, 1820);
      drawAncientRuinColumn(1560, 2180);
      drawAncientRuinColumn(1480, 2110);

      // Ancient white & blue flower blankets
      drawWildFlowers(1350, 1760, "ancient");
      drawWildFlowers(1440, 1860, "ancient");
      drawWildFlowers(1800, 1920, "ancient");
      drawWildFlowers(1550, 2100, "ancient");

      // Shrines active fire braziers with wind sparks
      const bFr = Math.floor(frameTick / 6) % 4;
      const brazierF = assets.landscapeProps.shrineBrazier[brazierFlippedIndex(bFr)];

      const drawFlaringBrazier = (bx: number, by: number) => {
        if (isVisible(bx, by, 48)) {
          ctx.drawImage(brazierF, bx - 8, by - 12);
        }
      };
      drawFlaringBrazier(1380, 1820);
      drawFlaringBrazier(1740, 1850);
      drawFlaringBrazier(1620, 2050);

      // White peak solid mountains
      drawSnowyPeak(1500, 2010, 50);
      drawSnowyPeak(1680, 1960, 42);
      drawSnowyPeak(1580, 2180, 45);

      // Ancient high evergreen conifers
      drawSwayingTree(1260, 1890, "pine");
      drawSwayingTree(1420, 1820, "pine");
      drawSwayingTree(1500, 1740, "pine");
      drawSwayingTree(1790, 1960, "pine");
      drawSwayingTree(1920, 1830, "pine");
      drawSwayingTree(1680, 2190, "pine");

      // Helper for brazier flame animation order mapping
      function brazierFlippedIndex(v: number): number {
        return v === 3 ? 1 : v;
      }

      // 6. SOARING SEABIRDS IN HIGHER AIR CURRENT
      const bX = (frameTick * 0.9) % (viewportRight - viewportLeft + 200) + viewportLeft - 100;
      const bY = viewportTop + 140 + Math.sin(frameTick * 0.015) * 35;
      if (isVisible(bX, bY, 48)) {
        ctx.strokeStyle = "rgba(255, 255, 255, 0.48)";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        const wingSway = Math.sin(frameTick * 0.12) > 0 ? -4.5 : 4.5;
        ctx.moveTo(bX - 8, bY + wingSway);
        ctx.lineTo(bX, bY);
        ctx.lineTo(bX + 8, bY + wingSway);
        ctx.stroke();
      }

      // 7. DRIFTING LOW-ALTITUDE FLUFFY CLOUDS (Shadow cast)
      const cloudP = assets.landscapeProps.cloud;
      for (let c = 0; c < 3; c++) {
        const cSpd = 0.35 + c * 0.12;
        const cx = ((frameTick * cSpd) + c * 800) % 3500 - 150;
        const cy = 250 + c * 600 + Math.sin(frameTick * 0.01 + c) * 30;

        if (isVisible(cx, cy, 180)) {
          // Soft gray ground shadow
          ctx.fillStyle = "rgba(11, 19, 35, 0.06)";
          ctx.beginPath();
          ctx.ellipse(cx + 48, cy + 96, 52, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          // Textured cloud
          ctx.drawImage(cloudP, cx, cy);
        }
      }

      // 8. INTERACTIVE ENRICHED ACTIVE MILISTONE PIN NODES
      LANDMARKS.forEach((node) => {
        if (!isVisible(node.x, node.y, 80)) return;

        const isSolved = solvedNodeIds.includes(node.id);
        const pulse = 1 + Math.sin(frameTick * 0.08) * 0.08;

        // Draw hover halo
        const isHovered = hoveredNode?.id === node.id;
        const isActive = activeNodeId === node.id;
        if (isHovered || isActive) {
          ctx.strokeStyle = "rgba(255, 251, 235, 0.65)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 22 * pulse, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Gradient glow aura
        const glowGrd = ctx.createRadialGradient(node.x, node.y, 2, node.x, node.y, 20 * pulse);
        if (isSolved) {
          glowGrd.addColorStop(0, node.color);
          glowGrd.addColorStop(1, "rgba(0,0,0,0)");
        } else {
          glowGrd.addColorStop(0, "rgba(148, 163, 184, 0.52)");
          glowGrd.addColorStop(1, "rgba(0,0,0,0)");
        }
        ctx.fillStyle = glowGrd;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 23 * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Pin body
        ctx.fillStyle = isSolved ? node.color : "#64748b";
        ctx.strokeStyle = isSolved ? "#ffffff" : "#475569";
        ctx.lineWidth = 3.2;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 8.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Decal overlay carvings
        ctx.save();
        ctx.translate(node.x, node.y - 12);

        if (node.icon === "gate") {
          ctx.fillStyle = isSolved ? "#d8b4fe" : "#94a3b8";
          ctx.fillRect(-6, -4, 3, 10);
          ctx.fillRect(4, -4, 3, 10);
          ctx.fillRect(-6, -6, 13, 3);
          if (isSolved) {
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(-1.5, -1, 3, 3);
          }
        } else if (node.icon === "crystal") {
          ctx.fillStyle = isSolved ? "#ec4899" : "#64748b";
          ctx.beginPath();
          ctx.moveTo(0, -9);
          ctx.lineTo(5.5, -1);
          ctx.lineTo(0, 7);
          ctx.lineTo(-5.5, -1);
          ctx.closePath();
          ctx.fill();
        } else if (node.icon === "coin") {
          ctx.fillStyle = isSolved ? "#facc15" : "#64748b";
          ctx.beginPath();
          ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = isSolved ? "#eab308" : "#475569";
          ctx.font = "bold 7.5px sans-serif";
          ctx.fillText("$", -2, 3);
        } else if (node.icon === "shield") {
          ctx.fillStyle = isSolved ? "#22c55e" : "#64748b";
          ctx.beginPath();
          ctx.moveTo(-5.5, -5);
          ctx.lineTo(5.5, -5);
          ctx.lineTo(5.5, 0);
          ctx.lineTo(0, 5.5);
          ctx.lineTo(-5.5, 0);
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
          ctx.fillRect(-6.5, -3, 13, 7.5);
          ctx.fillStyle = isSolved ? "#ffedd5" : "#475569";
          ctx.fillRect(-4.5, -1, 9, 3);
        }
        ctx.restore();
      });

      // 9. COZY DOUBLE DOT INDICATOR TARGET CLICKS
      if (isWalkingRef.current) {
        ctx.strokeStyle = "#fb7185";
        ctx.lineWidth = 1.8;
        ctx.setLineDash([2, 3.5]);
        ctx.beginPath();
        ctx.arc(targetRef.current.x, targetRef.current.y, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = "#fb7185";
        ctx.fillRect(targetRef.current.x - 1, targetRef.current.y - 6, 2.2, 12);
        ctx.fillRect(targetRef.current.x - 6, targetRef.current.y - 1, 12, 2.2);
      }

      // 10. ACTIVE JRPG PLAYER AVATAR RENDERING
      const ax = posRef.current.x;
      const ay = posRef.current.y;

      ctx.save();
      // Ground shadow
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
      ctx.beginPath();
      ctx.ellipse(ax, ay + 14, 11, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      const walkFr = Math.floor(frameTick / 6) % 4;

      if (avatarConfig) {
        ctx.save();
        ctx.translate(ax - 32, ay - 30);
        drawCompositedAvatar(ctx, 0, 0, avatarConfig, directionRef.current, walkFr, isWalkingRef.current);
        ctx.restore();
      } else {
        ctx.translate(ax, ay);

        // Bob bounce
        const bouncy = isWalkingRef.current ? Math.round(Math.sin(frameTick * 0.3) * 1.5) : 0;
        const lOff = (isWalkingRef.current && walkFr === 0) ? -3 : 0;
        const rOff = (isWalkingRef.current && walkFr === 2) ? -3 : 0;

        ctx.translate(0, bouncy);

        // Backpack
        if (directionRef.current === "up" || directionRef.current === "left") {
          ctx.fillStyle = "#b45309";
          ctx.fillRect(2.2, -4.5, 5, 10.5);
        } else if (directionRef.current === "right") {
          ctx.fillStyle = "#b45309";
          ctx.fillRect(-7.2, -4.5, 5, 10.5);
        }

        // Boots
        ctx.fillStyle = "#451a03";
        ctx.fillRect(-5, 9 + lOff, 3, 5);
        ctx.fillRect(2, 9 + rOff, 3, 5);

        // Coat
        ctx.fillStyle = "#ea580c";
        ctx.fillRect(-6, -2, 12, 11);

        ctx.fillStyle = "#ffbe0b";
        ctx.fillRect(-3.3, -2, 6.6, 2);

        // Sling
        ctx.fillStyle = "#ca8a04";
        ctx.fillRect(-6, 2, 12, 2);

        // Face skin
        ctx.fillStyle = "#fed9b7";
        ctx.fillRect(-5, -9, 10, 7);

        // Blue hair
        ctx.fillStyle = "#2563eb";
        ctx.fillRect(-6, -13, 12, 5);
        ctx.fillRect(-6, -9, 2.2, 6);
        ctx.fillRect(3.8, -9, 2.2, 6);

        // Eyes
        ctx.fillStyle = "#0c1020";
        if (directionRef.current === "down") {
          ctx.fillRect(-2.8, -6, 2, 2);
          ctx.fillRect(0.8, -6, 2, 2);
          ctx.fillStyle = "#ff006e";
          ctx.fillRect(-5, -9, 10, 2);
        } else if (directionRef.current === "right") {
          ctx.fillRect(0.8, -6, 2, 2);
          ctx.fillRect(2.8, -6, 1, 2);
          ctx.fillStyle = "#ff006e";
          ctx.fillRect(-3, -9, 8, 2);
        } else if (directionRef.current === "left") {
          ctx.fillRect(-2.8, -6, 2, 2);
          ctx.fillRect(-3.8, -6, 1, 2);
          ctx.fillStyle = "#ff006e";
          ctx.fillRect(-5, -9, 8, 2);
        } else if (directionRef.current === "up") {
          ctx.fillStyle = "#2563eb";
          ctx.fillRect(-5, -9, 10, 7);
          ctx.fillStyle = "#ff006e";
          ctx.fillRect(-2, -6, 4, 2);
        }
      }
      ctx.restore();

      // 11. WINDBREW ATMOSPHERIC FLOATING PETALS / LEAF SWEEPS
      const leafCount = 18;
      for (let i = 0; i < leafCount; i++) {
        // Fall trajectory across viewport bounds
        const lX = ((i * 183 + frameTick * 0.8) % (viewportRight - viewportLeft + 100)) + viewportLeft - 50;
        const lY = ((i * 115 + frameTick * 1.1) % (viewportBottom - viewportTop + 100)) + viewportTop - 50;

        if (isVisible(lX, lY, 24)) {
          ctx.fillStyle = timeOfDay === "Sunset" ? "#ea580c" : timeOfDay === "Night" ? "#818cf8" : "#f472b6";
          ctx.beginPath();
          const pSway = Math.sin(frameTick * 0.045 + i) * 6;
          ctx.ellipse(lX + pSway, lY, 5, 2.5, Math.PI / 4 + Math.sin(frameTick * 0.02 + i) * 0.35, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 12. WORLD DIURNAL LIGHT SHADINGS OVERLAY
      if (timeOfDay === "Night") {
        ctx.fillStyle = "rgba(10, 20, 38, 0.62)"; // Ambient moonlight shroud
        ctx.globalCompositeOperation = "multiply";
        ctx.fillRect(viewportLeft, viewportTop, viewportRight - viewportLeft, viewportBottom - viewportTop);
        ctx.globalCompositeOperation = "source-over";

        // Lantern glows from unlocked/solved targets
        LANDMARKS.forEach((node) => {
          const solved = solvedNodeIds.includes(node.id);
          if (solved && isVisible(node.x, node.y, 64)) {
            const glow = ctx.createRadialGradient(node.x, node.y, 1, node.x, node.y, 52);
            glow.addColorStop(0, "rgba(253, 224, 71, 0.4)");
            glow.addColorStop(1, "rgba(253, 224, 71, 0)");
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(node.x, node.y, 52, 0, Math.PI * 2);
            ctx.fill();
          }
        });

        // Fireflies clouds twinkling
        ctx.fillStyle = "rgba(163, 230, 53, 0.88)";
        for (let j = 0; j < 25; j++) {
          const flyX = (j * 147 + Math.sin(frameTick * 0.02 + j) * 80) % 3200;
          const flyY = (j * 93 + Math.cos(frameTick * 0.025 + j) * 60) % 2560;

          if (isVisible(flyX, flyY, 32)) {
            ctx.fillRect(flyX, flyY, 2, 2);
            ctx.fillStyle = "rgba(163, 230, 53, 0.1)";
            ctx.beginPath();
            ctx.arc(flyX + 1, flyY + 1, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "rgba(163, 230, 53, 0.88)";
          }
        }

        // Glow aura following active adventurer
        const pGlow = ctx.createRadialGradient(posRef.current.x, posRef.current.y, 1, posRef.current.x, posRef.current.y, 45);
        pGlow.addColorStop(0, "rgba(254, 240, 138, 0.3)");
        pGlow.addColorStop(1, "rgba(254, 240, 138, 0)");
        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(posRef.current.x, posRef.current.y, 45, 0, Math.PI * 2);
        ctx.fill();

      } else if (timeOfDay === "Sunset") {
        ctx.fillStyle = "rgba(249, 115, 22, 0.18)"; // Soft sunset orange filter
        ctx.globalCompositeOperation = "color-burn";
        ctx.fillRect(viewportLeft, viewportTop, viewportRight - viewportLeft, viewportBottom - viewportTop);
        ctx.globalCompositeOperation = "source-over";

        ctx.fillStyle = "rgba(124, 58, 237, 0.12)"; // violet overlay
        ctx.fillRect(viewportLeft, viewportTop, viewportRight - viewportLeft, viewportBottom - viewportTop);
      } else if (timeOfDay === "Morning") {
        ctx.fillStyle = "rgba(253, 224, 71, 0.14)"; // Soft morning bronze filter
        ctx.fillRect(viewportLeft, viewportTop, viewportRight - viewportLeft, viewportBottom - viewportTop);
        ctx.fillStyle = "rgba(56, 189, 248, 0.08)";
        ctx.fillRect(viewportLeft, viewportTop, viewportRight - viewportLeft, viewportBottom - viewportTop);
      }

      ctx.restore();
      // ----------------------------------------------------
      // END CAMERA TRANSFORMS
      // ----------------------------------------------------
    };

    updateGame();

    // Cleanup loops
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [solvedNodeIds, activeNodeId, isDialogueOpen, hoveredNode, timeOfDay, cameraMode, zoom, dimensions]);

  // Handle snapping camera back to active voyager
  const handleRecenter = () => {
    setCameraMode("follow");
    cameraRef.current = { x: avatarPos.x, y: avatarPos.y };
  };

  // Convert landmark coords to screen percentages to locate floating HTML Tooltip
  // using precisely rendered zoom camera projection!
  const getHoveredNodeScreenProps = () => {
    if (!hoveredNode) return null;
    const screenPos = worldToScreen(hoveredNode.x, hoveredNode.y);
    return {
      left: screenPos.x,
      top: screenPos.y,
    };
  };

  const tooltipProps = getHoveredNodeScreenProps();

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[580px] border-4 border-[#7c2d12] bg-[#0c1320] rounded-xl overflow-hidden shadow-2xl select-none flex flex-col"
    >
      {/* Dynamic Ribbon Header */}
      <div className="absolute top-0 inset-x-0 bg-amber-950/90 border-b border-[#7c2d12] text-xs text-amber-100 py-2.5 px-3.5 flex justify-between items-center z-10 font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border border-emerald-600"></span>
          <span className="font-bold tracking-wider text-yellow-300 uppercase">FieldVoyager Infinite</span>
        </div>
        <div className="hidden sm:flex items-center space-x-1.5 font-semibold text-[10px] text-amber-200">
          <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "10s" }} />
          <span>DRAG MAP TO PAN • USE MOUSE WHEEL TO ZOOM</span>
        </div>
        <div className="text-amber-200 bg-amber-900/60 px-2.5 py-1 rounded text-[10px] flex items-center space-x-1">
          <span className="text-yellow-400 text-[9px] font-bold">X:</span>
          <span>{Math.round(avatarPos.x)}</span>
          <span className="text-yellow-400 text-[9px] font-bold ml-1">Y:</span>
          <span>{Math.round(avatarPos.y)}</span>
        </div>
      </div>

      {/* Render Canvas */}
      <canvas
        ref={canvasRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { isDraggingRef.current = false; }}
        onWheel={handleWheel}
        className="w-full h-full block bg-slate-950 cursor-grab active:cursor-grabbing"
      />

      {/* FLOATING CONTROLLER WIDGETS */}
      {/* 1. Camera Mode Indicator & Recenter button */}
      <div className="absolute bottom-3 left-3 bg-[#fdf6e2] border-2 border-[#7c2d12] rounded-lg p-2 shadow-md flex flex-col space-y-1.5 z-10 font-mono text-[#3c2f2f] max-w-[155px]">
        <span className="text-[9px] uppercase font-black tracking-wider text-[#7c2d12] border-b border-[#7c2d12]/20 pb-0.5">
          🎥 Cam Options
        </span>
        <div className="flex flex-col space-y-1">
          <div className="flex justify-between items-center text-[9px] px-1">
            <span className="text-[#7c2d12]/70">Mode:</span>
            <span className="font-black text-[#7c2d12] uppercase">{cameraMode}</span>
          </div>
          <button
            onClick={handleRecenter}
            className="flex items-center justify-center space-x-1 bg-amber-100 hover:bg-amber-200 text-[#7c2d12] border border-[#7c2d12]/40 rounded px-1.5 py-1 text-[9px] font-black cursor-pointer transition-colors"
          >
            <Maximize className="w-2.5 h-2.5" />
            <span>Center Avatar</span>
          </button>
        </div>
      </div>

      {/* 2. Diurnal Atmosphere Clock Widget */}
      <div className="absolute top-14 left-3 bg-[#fdf6e2] border-2 border-[#7c2d12] rounded-lg p-2.5 shadow-md flex flex-col space-y-1 z-10 font-mono text-[#3c2f2f] max-w-[150px]">
        <span className="text-[9.5px] uppercase font-black tracking-widest text-[#7c2d12] border-b border-[#7c2d12]/20 pb-1 flex items-center space-x-1">
          <span>🌅 Time of Day</span>
        </span>
        <div className="grid grid-cols-2 gap-1 mt-1">
          {(["Morning", "Noon", "Sunset", "Night"] as const).map((t) => {
            const isActive = timeOfDay === t;
            return (
              <button
                key={t}
                onClick={() => setTimeOfDay(t)}
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#7c2d12] text-amber-100 border-[#7c2d12]"
                    : "bg-amber-100/65 hover:bg-amber-200/80 text-[#3c2f2f] border-amber-990/15"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Infinite Zoom Slider Widget */}
      <div className="absolute bottom-3 right-3 bg-[#fdf6e2] border-2 border-[#7c2d12] rounded-lg p-2.5 shadow-md flex items-center space-x-2.5 z-10 font-mono text-[#3c2f2f] min-w-[210px]">
        <button
          onClick={() => setZoom((z) => Math.max(0.45, z - 0.15))}
          className="bg-amber-100/80 p-1 rounded hover:bg-amber-200 border border-[#7c2d12]/30 cursor-pointer text-[#7c2d12]"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 flex flex-col space-y-0.5 text-center">
          <span className="text-[8px] uppercase tracking-wider text-[#7c2d12]/80 font-black">Zoom Factor</span>
          <input
            type="range"
            min="0.45"
            max="2.2"
            step="0.05"
            value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-full accent-[#7c2d12] cursor-pointer h-1 bg-amber-950/10 rounded-lg outline-none"
          />
          <span className="text-[9.5px] font-black text-[#7c2d12]">{Math.round(zoom * 100)}%</span>
        </div>
        <button
          onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
          className="bg-amber-100/80 p-1 rounded hover:bg-amber-200 border border-[#7c2d12]/30 cursor-pointer text-[#7c2d12]"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Hover Tooltip Overlay with Projected screen coords */}
      {hoveredNode && !isDialogueOpen && tooltipProps && (
        <div
          className="absolute font-mono pointer-events-none p-3.5 bg-[#fdf6e2] border-2 border-[#7c2d12] text-[#3c2f2f] rounded-lg shadow-2xl text-xs flex flex-col space-y-1.5 transition-all duration-75"
          style={{
            left: `${Math.min(dimensions.width - 262, Math.max(12, tooltipProps.left - 120))}px`,
            top: `${Math.min(dimensions.height - 180, Math.max(50, tooltipProps.top - 146))}px`,
            width: "250px",
            zIndex: 30,
          }}
        >
          <div className="flex justify-between items-center bg-amber-100 px-1.5 py-0.5 rounded text-[9.5px] border border-[#7c2d12]/25">
            <span className="uppercase font-black text-[#7c2d12]">{hoveredNode.discipline}</span>
            <span className={solvedNodeIds.includes(hoveredNode.id) ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"}>
              {solvedNodeIds.includes(hoveredNode.id) ? "● MASTERED" : "○ UNEXPLORED"}
            </span>
          </div>
          <span className="font-extrabold text-[#7c2d12] text-sm mt-1 pr-1">{hoveredNode.name}</span>
          <p className="text-[#3c2f2f]/90 text-[11px] leading-relaxed mt-0.5">{hoveredNode.description}</p>
          <div className="text-[9.5px] text-[#7d4115] font-semibold italic mt-1 border-t border-[#7c2d12]/15 pt-1.5 flex items-center justify-between">
            <span>Grid Coordinates: ({hoveredNode.x}, {hoveredNode.y})</span>
            <span className="animate-pulse">Click here &rarr;</span>
          </div>
        </div>
      )}
    </div>
  );
};
