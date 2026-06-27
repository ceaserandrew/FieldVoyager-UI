import { AvatarConfig, drawCompositedAvatar } from "./avatarDrawer";
import { Position } from "../types";

interface DrawInteriorOptions {
  ctx: CanvasRenderingContext2D;
  dimensions: { width: number; height: number };
  zoom: number;
  frameTick: number;
  activeInterior: "turing" | "smith" | "plato";
  interiorPlayer: Position;
  direction: "up" | "down" | "left" | "right";
  isWalking: boolean;
  avatarConfig?: AvatarConfig;
}

export function drawInterior({
  ctx,
  dimensions,
  zoom,
  frameTick,
  activeInterior,
  interiorPlayer,
  direction,
  isWalking,
  avatarConfig,
}: DrawInteriorOptions): void {
  ctx.fillStyle = "#0c111c"; // rich dark cosmic night background
  ctx.fillRect(0, 0, dimensions.width, dimensions.height);

  // Grid coordinate system projection centered on screen for interior
  const studyToScreen = (u: number, v: number, h = 0): Position => {
    // u goes down-right, v goes down-left
    const rx = (u - v) * 36 * zoom;
    const ry = (u + v) * 18 * zoom - h * zoom;
    return {
      x: dimensions.width / 2 + rx,
      y: dimensions.height / 2 + ry + 40 * zoom,
    };
  };

  const activeIntName = activeInterior === "turing"
    ? "Alan Turing's Cryptographic Study"
    : activeInterior === "smith"
    ? "Adam Smith's Wealth Registry"
    : "Plato's Socratic Retreat";

  // Draw nice wood parquet flooring inside cozy cabin
  for (let u = -4.5; u <= 4.5; u += 1.0) {
    for (let v = -4.5; v <= 4.5; v += 1.0) {
      const pTop = studyToScreen(u, v);
      const pRight = studyToScreen(u + 1.0, v);
      const pBottom = studyToScreen(u + 1.0, v + 1.0);
      const pLeft = studyToScreen(u, v + 1.0);

      ctx.fillStyle = (Math.floor(u) + Math.floor(v)) % 2 === 0 ? "#432b1a" : "#321e12"; // mahogany parquet boards
      ctx.beginPath();
      ctx.moveTo(pTop.x, pTop.y);
      ctx.lineTo(pRight.x, pRight.y);
      ctx.lineTo(pBottom.x, pBottom.y);
      ctx.lineTo(pLeft.x, pLeft.y);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = "rgba(40, 24, 15, 0.4)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  // Draw Left and Right back rustic wooden brick walls
  const wh = 75;
  const pCorner = studyToScreen(-4.5, -4.5);
  const pLeftWallEnd = studyToScreen(-4.5, 4.5);
  const pRightWallEnd = studyToScreen(4.5, -4.5);

  const pCornerT = studyToScreen(-4.5, -4.5, wh);
  const pLeftWallEndT = studyToScreen(-4.5, 4.5, wh);
  const pRightWallEndT = studyToScreen(4.5, -4.5, wh);

  // Left wall face
  ctx.fillStyle = "#3e2723"; // warm cedarwood backwall
  ctx.beginPath();
  ctx.moveTo(pLeftWallEnd.x, pLeftWallEnd.y);
  ctx.lineTo(pCorner.x, pCorner.y);
  ctx.lineTo(pCornerT.x, pCornerT.y);
  ctx.lineTo(pLeftWallEndT.x, pLeftWallEndT.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "rgba(20, 10, 5, 0.35)";
  ctx.lineWidth = 1;
  for (let h = 15; h < wh; h += 20) {
    const l1 = studyToScreen(-4.5, 4.5, h);
    const l2 = studyToScreen(-4.5, -4.5, h);
    ctx.beginPath();
    ctx.moveTo(l1.x, l1.y);
    ctx.lineTo(l2.x, l2.y);
    ctx.stroke();
  }

  // Right wall face with shading
  ctx.fillStyle = "#35211c";
  ctx.beginPath();
  ctx.moveTo(pRightWallEnd.x, pRightWallEnd.y);
  ctx.lineTo(pCorner.x, pCorner.y);
  ctx.lineTo(pCornerT.x, pCornerT.y);
  ctx.lineTo(pRightWallEndT.x, pRightWallEndT.y);
  ctx.closePath();
  ctx.fill();

  for (let h = 15; h < wh; h += 20) {
    const r1 = studyToScreen(4.5, -4.5, h);
    const r2 = studyToScreen(-4.5, -4.5, h);
    ctx.beginPath();
    ctx.moveTo(r1.x, r1.y);
    ctx.lineTo(r2.x, r2.y);
    ctx.stroke();
  }

  // Draw Big Ornate Crimson Scholar Carpet
  const rugLt = studyToScreen(-2.0, -2.0);
  const rugRt = studyToScreen(2.0, -2.0);
  const rugRb = studyToScreen(2.0, 2.0);
  const rugLb = studyToScreen(-2.0, 2.0);

  ctx.fillStyle = "#7f1d1d"; // beautiful red fabric
  ctx.beginPath();
  ctx.moveTo(rugLt.x, rugLt.y);
  ctx.lineTo(rugRt.x, rugRt.y);
  ctx.lineTo(rugRb.x, rugRb.y);
  ctx.lineTo(rugLb.x, rugLb.y);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#eab308"; // golden woven trim borders
  ctx.lineWidth = 1.5 * zoom;
  ctx.stroke();

  // Welcome Welcome Door Exit jute rug in front
  const doorLt = studyToScreen(-1.2, 3.8);
  const doorRt = studyToScreen(1.2, 3.8);
  const doorRb = studyToScreen(1.2, 4.5);
  const doorLb = studyToScreen(-1.2, 4.5);
  ctx.fillStyle = "#a16207";
  ctx.beginPath();
  ctx.moveTo(doorLt.x, doorLt.y);
  ctx.lineTo(doorRt.x, doorRt.y);
  ctx.lineTo(doorRb.x, doorRb.y);
  ctx.lineTo(doorLb.x, doorLb.y);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#fef08a";
  ctx.lineWidth = 1 * zoom;
  ctx.stroke();

  // Exit Sign Door Frame Outline
  const doorPos = studyToScreen(0, 4.5);
  ctx.fillStyle = "#1e1b18";
  ctx.fillRect(doorPos.x - 30 * zoom, doorPos.y - 12 * zoom, 60 * zoom, 24 * zoom);
  ctx.font = 'bold 9px "JetBrains Mono", sans-serif';
  ctx.fillStyle = "#fef08a";
  ctx.fillText("EXIT DOORWAY", doorPos.x - 32 * zoom, doorPos.y + 4 * zoom);

  // Brick Hearth Fireplace fireplace at corner (-4.5, -4.5)
  const pFire = studyToScreen(-3.8, -3.8);
  ctx.fillStyle = "#1e293b"; // cast iron protector shield
  ctx.fillRect(pFire.x - 22 * zoom, pFire.y - 42 * zoom, 44 * zoom, 44 * zoom);
  ctx.fillStyle = "#b45309"; // base rustic clay bricks
  ctx.fillRect(pFire.x - 25 * zoom, pFire.y + 2 * zoom, 50 * zoom, 8 * zoom);

  // Cozy Crackling Fire glowing flare
  const flamePulse = Math.sin(frameTick * 0.25) * 3 + 13;
  const gradFire = ctx.createRadialGradient(pFire.x, pFire.y - 14 * zoom, 1 * zoom, pFire.x, pFire.y - 14 * zoom, flamePulse * zoom);
  gradFire.addColorStop(0, "rgba(249, 115, 22, 1.0)"); // orange heart
  gradFire.addColorStop(0.5, "rgba(239, 68, 68, 0.75)"); // red warmth
  gradFire.addColorStop(1, "rgba(253, 224, 71, 0)"); // fading glow spark
  ctx.fillStyle = gradFire;
  ctx.beginPath();
  ctx.arc(pFire.x, pFire.y - 14 * zoom, flamePulse * zoom, 0, Math.PI * 2);
  ctx.fill();

  // Warm stove sparks floating upwards
  ctx.fillStyle = "rgba(253, 224, 71, 0.9)";
  for (let i = 0; i < 6; i++) {
    const sparkOffset = (frameTick * 1.5 + i * 20) % 50;
    const sx = pFire.x + Math.sin(frameTick * 0.05 + i * 3) * 11 * zoom;
    const sy = pFire.y - 14 * zoom - sparkOffset * zoom * 0.75;
    ctx.beginPath();
    ctx.arc(sx, sy, (1 + Math.random() * 1.5) * zoom, 0, Math.PI * 2);
    ctx.fill();
  }

  // Heavy dark wood study cabinet bookcases with shelves on left wall
  const pRackL = studyToScreen(-4.5, -1.0);
  ctx.fillStyle = "#1e1008";
  ctx.fillRect(pRackL.x - 14 * zoom, pRackL.y - 65 * zoom, 28 * zoom, 60 * zoom);
  ctx.strokeStyle = "#eab308";
  ctx.lineWidth = 1;
  ctx.strokeRect(pRackL.x - 14 * zoom, pRackL.y - 65 * zoom, 28 * zoom, 60 * zoom);

  const bookColors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];
  for (let row = 0; row < 3; row++) {
    const rh = pRackL.y - 60 * zoom + row * 18 * zoom;
    ctx.fillStyle = "#3e2723";
    ctx.fillRect(pRackL.x - 12 * zoom, rh, 24 * zoom, 3 * zoom); // shelf slat
    for (let b = 0; b < 6; b++) {
      ctx.fillStyle = bookColors[(row * 7 + b) % bookColors.length];
      ctx.fillRect(pRackL.x - 10 * zoom + b * 3 * zoom, rh - 13 * zoom, 2.5 * zoom, 13 * zoom);
    }
  }

  // Heavy Oak Research Desk at top (0, -2.0)
  const pDesk = studyToScreen(0, -2.0);
  ctx.fillStyle = "#27160c"; // shadows
  ctx.fillRect(pDesk.x - 30 * zoom, pDesk.y - 3 * zoom, 10 * zoom, 6 * zoom);
  ctx.fillRect(pDesk.x + 20 * zoom, pDesk.y - 3 * zoom, 10 * zoom, 6 * zoom);

  ctx.fillStyle = "#5c3317"; // heavy desk mahogany top slab
  ctx.fillRect(pDesk.x - 34 * zoom, pDesk.y - 14 * zoom, 68 * zoom, 14 * zoom);
  ctx.strokeStyle = "#7c2d12";
  ctx.lineWidth = 1.8;
  ctx.strokeRect(pDesk.x - 34 * zoom, pDesk.y - 14 * zoom, 68 * zoom, 14 * zoom);

  ctx.fillStyle = "#f8fafc"; // white paper scrolls
  ctx.fillRect(pDesk.x - 14 * zoom, pDesk.y - 16 * zoom, 12 * zoom, 4 * zoom);
  ctx.fillStyle = "#1e293b"; // glass inkwell
  ctx.fillRect(pDesk.x + 12 * zoom, pDesk.y - 17 * zoom, 4 * zoom, 3 * zoom);
  ctx.strokeStyle = "#ffffff"; // feather quill pen
  ctx.beginPath();
  ctx.moveTo(pDesk.x + 14 * zoom, pDesk.y - 17 * zoom);
  ctx.lineTo(pDesk.x + 18 * zoom, pDesk.y - 25 * zoom);
  ctx.stroke();

  // Flickering brass reading candle lamp
  const candleGlow = Math.sin(frameTick * 0.16) * 1.8 + 8.5;
  ctx.fillStyle = "#fbbf24";
  ctx.fillRect(pDesk.x - 26 * zoom, pDesk.y - 20 * zoom, 3 * zoom, 6 * zoom);
  const candleGrad = ctx.createRadialGradient(pDesk.x - 24.5 * zoom, pDesk.y - 22 * zoom, 1 * zoom, pDesk.x - 24.5 * zoom, pDesk.y - 22 * zoom, candleGlow * zoom);
  candleGrad.addColorStop(0, "rgba(251, 191, 36, 1.0)");
  candleGrad.addColorStop(1, "rgba(251, 191, 36, 0)");
  ctx.fillStyle = candleGrad;
  ctx.beginPath();
  ctx.arc(pDesk.x - 24.5 * zoom, pDesk.y - 22 * zoom, candleGlow * zoom, 0, Math.PI * 2);
  ctx.fill();

  // --- RENDER THE HOST SCHOLAR ---
  const scholarU = 0;
  const scholarV = -2.2;
  const pScholar = studyToScreen(scholarU, scholarV);

  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(pScholar.x, pScholar.y, 10 * zoom, 4 * zoom, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(pScholar.x, pScholar.y);
  ctx.scale(zoom, zoom);

  const schBob = Math.sin(frameTick * 0.05) * 1.5;
  ctx.translate(0, schBob);

  if (activeInterior === "turing") {
    ctx.fillStyle = "#4b5563"; // coat gray Tweed
    ctx.fillRect(-8, -26, 16, 26);
    ctx.fillStyle = "#e0f2fe"; // blue collar shirt
    ctx.fillRect(-3, -26, 6, 8);
    ctx.fillStyle = "#ef4444"; // red little tie
    ctx.fillRect(-1.5, -23, 3, 7);
    ctx.fillStyle = "#fbcfe8"; // skin peach
    ctx.beginPath();
    ctx.arc(0, -32, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1f2937"; // black short hair
    ctx.fillRect(-8, -39, 16, 6);
  } else if (activeInterior === "smith") {
    ctx.fillStyle = "#047857"; // velvet emerald green tailcoat
    ctx.fillRect(-9, -26, 18, 26);
    ctx.fillStyle = "#fbbf24"; // golden epaulets
    ctx.fillRect(-9, -26, 2, 4);
    ctx.fillRect(7, -26, 2, 4);
    ctx.fillStyle = "#ffffff"; // huge white philosopher cravat ruffle collar scarf
    ctx.fillRect(-4, -26, 8, 9);
    ctx.fillStyle = "#fbcfe8";
    ctx.beginPath();
    ctx.arc(0, -32, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d1d5db"; // powder gray wig curls
    ctx.beginPath();
    ctx.arc(-8, -32, 4.5, 0, Math.PI * 2);
    ctx.arc(8, -32, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-8, -38, 16, 6);
  } else {
    ctx.fillStyle = "#d1d5db"; // stone white toga folds
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(-4, -26);
    ctx.lineTo(8, -26);
    ctx.lineTo(10, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#93c5fd"; // light sapphire blue draped shawl cross body
    ctx.beginPath();
    ctx.moveTo(-8, -24);
    ctx.lineTo(8, -10);
    ctx.lineTo(4, -4);
    ctx.lineTo(-6, -18);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fdebdb"; // face peach
    ctx.beginPath();
    ctx.arc(0, -32, 7, 0, Math.PI * 2);
    ctx.fill();
    // Majestic flowing white philosophical beard!
    ctx.fillStyle = "#f3f4f6";
    ctx.beginPath();
    ctx.moveTo(-5, -30);
    ctx.lineTo(5, -30);
    ctx.lineTo(3, -15);
    ctx.lineTo(0, -10);
    ctx.lineTo(-3, -15);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#e5e7eb"; // gray hair
    ctx.fillRect(-7, -39, 14, 6);
  }

  ctx.restore();

  // Dialogue callout tag floating
  ctx.fillStyle = "rgba(124, 58, 237, 0.12)";
  ctx.strokeStyle = "rgba(167, 139, 250, 0.6)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(pScholar.x, pScholar.y - 48 * zoom, 46 * zoom, 12 * zoom, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 9.5px "JetBrains Mono", monospace';
  ctx.fillStyle = "#a78bfa";
  ctx.fillText("CONSULT [SPACE]", pScholar.x - 41 * zoom, pScholar.y - 45 * zoom);

  // --- DRAW ENTRANTE USER PLAYER SPIRAL CHARACTER ---
  const pPlayer = studyToScreen(interiorPlayer.x, interiorPlayer.y);
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath();
  ctx.ellipse(pPlayer.x, pPlayer.y, 11 * zoom, 4.5 * zoom, 0, 0, Math.PI * 2);
  ctx.fill();

  if (avatarConfig) {
    ctx.save();
    ctx.translate(pPlayer.x - 32 * zoom, pPlayer.y - 30 * zoom);
    const walkFr = Math.floor(frameTick / 6) % 4;
    drawCompositedAvatar(ctx, 0, 0, avatarConfig, direction, walkFr, isWalking);
    ctx.restore();
  }

  // Floating hints relative to player surroundings
  const distScholar = Math.hypot(interiorPlayer.x, interiorPlayer.y - scholarV);
  if (distScholar < 1.6) {
    ctx.fillStyle = "#fef08a";
    ctx.font = 'bold 11px "JetBrains Mono", sans-serif';
    ctx.fillText("Press Space/Enter to hold counsel", pPlayer.x - 90 * zoom, pPlayer.y + 22 * zoom);
  } else {
    const nearDesk = (Math.abs(interiorPlayer.x) > 1.6 && interiorPlayer.y < -0.6) || (interiorPlayer.y < -2.2);
    if (nearDesk) {
      ctx.fillStyle = "#67e8f9";
      ctx.font = 'bold 11px "JetBrains Mono", sans-serif';
      ctx.fillText("Press Space/Enter to read Diary Scroll", pPlayer.x - 120 * zoom, pPlayer.y + 22 * zoom);
    }
  }

  // Room Banner UI
  ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
  ctx.fillRect(8, 48, dimensions.width - 16, 26);
  ctx.strokeStyle = "#a16207";
  ctx.lineWidth = 1;
  ctx.strokeRect(8, 48, dimensions.width - 16, 26);
  ctx.fillStyle = "#fef08a";
  ctx.font = 'bold 10px "JetBrains Mono", monospace';
  ctx.fillText(`🏠 ENTERED: ${activeIntName.toUpperCase()}  (COZY ARTIFACT STUDY)`, 22, 64);

  // Escape helper toast floating bottom-center
  ctx.fillStyle = "rgba(0, 0, 0, 0.45)";
  ctx.fillRect(dimensions.width / 2 - 120, dimensions.height - 35, 240, 22);
  ctx.fillStyle = "#94a3b8";
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillText("PRESS [ESC] OR WALK DOWN TO EXIT CABIN SHACK", dimensions.width / 2 - 105, dimensions.height - 21);
}
