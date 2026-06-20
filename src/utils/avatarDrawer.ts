/**
 * Procedural Pixel-Art Avatar Drawer Engine for FieldVoyager
 * Draws JRPG style character layers on a Canvas in the requested 64x48 frame sizes,
 * with standard 4x4 frames (Down, Left, Right, Up rows / 4 frames columns).
 */

export interface AvatarColors {
  primary: string;
  secondary: string;
  accent: string;
  skin: string;
  hair: string;
}

export interface AvatarConfig {
  hairId: string;
  eyesId: string;
  torsoId: string;
  legsId: string;
  accessoryId: string;
  paletteId: string;
  colors: AvatarColors;
}

// Default Configuration values
export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  hairId: "hair-short",
  eyesId: "eyes-round",
  torsoId: "torso-jacket",
  legsId: "legs-pants",
  accessoryId: "acc-backpack",
  paletteId: "palette-forest-explorer",
  colors: {
    primary: "#15803d", // forest green
    secondary: "#78350f", // leather brown
    accent: "#f59e0b", // amber golden
    skin: "#fed7aa", // fair peach skin
    hair: "#451a03", // deep chestnut hair
  },
};

// Procedural Sprite Drawing Logic
export function drawAvatarFrame(
  ctx: CanvasRenderingContext2D,
  frameX: number, // Target X inside canvas to draw
  frameY: number, // Target Y inside canvas to draw
  layerName: "mannequin" | "hair" | "eyes" | "torso" | "legs" | "accessory",
  styleId: string,
  direction: "down" | "left" | "right" | "up",
  walkFrame: number, // 0, 1, 2, 3
  isWalking: boolean,
  colors: AvatarColors
) {
  ctx.save();
  // Translate to the middle of the frame
  // Frame size is 64x48, center is at (32, 24)
  ctx.translate(frameX + 32, frameY + 30); // offset slightly down to land on feet

  const bobY = isWalking ? Math.round(Math.sin((walkFrame * Math.PI) / 2) * 1) : 0;
  ctx.translate(0, bobY);

  const leftFootOffset = (walkFrame === 1 && isWalking) ? -2 : 0;
  const rightFootOffset = (walkFrame === 3 && isWalking) ? -2 : 0;

  // Set crisp borders for pixel art
  ctx.imageSmoothingEnabled = false;

  const p = colors.primary;
  const s = colors.secondary;
  const a = colors.accent;
  const skin = colors.skin;
  const hair = colors.hair;

  switch (layerName) {
    case "mannequin":
      // Nude body base
      // 1. Shadow underneath (Only on master stacked compositor, let's omit or draw light)
      
      // 2. Legs / Feet base
      ctx.fillStyle = skin;
      ctx.fillRect(-4, -1, 2, 4 + leftFootOffset); // Left Leg
      ctx.fillRect(2, -1, 2, 4 + rightFootOffset);  // Right Leg

      // Torso core base
      ctx.fillRect(-5, -10, 10, 9);

      // Neck
      ctx.fillRect(-2, -12, 4, 2);

      // Head
      ctx.fillRect(-6, -21, 12, 9);
      break;

    case "legs":
      // legs options: standard pants, shorts, skirt, robe-bottom, robot, bandaged, fishtail, ghost
      if (styleId === "legs-pants") {
        ctx.fillStyle = s;
        ctx.fillRect(-5, -4, 10, 4); // Crotch / hip block
        ctx.fillRect(-5, 0, 3, 3 + leftFootOffset); // Left pant leg
        ctx.fillRect(2, 0, 3, 3 + rightFootOffset);  // Right pant leg
        
        ctx.fillStyle = "#3c2f2f"; // Shoes
        ctx.fillRect(-5, 3 + leftFootOffset, 3, 2);
        ctx.fillRect(2, 3 + rightFootOffset, 3, 2);
      } 
      else if (styleId === "legs-shorts") {
        ctx.fillStyle = s;
        ctx.fillRect(-5, -4, 10, 3);
        ctx.fillRect(-5, -1, 3, 2 + leftFootOffset);
        ctx.fillRect(2, -1, 3, 2 + rightFootOffset);

        ctx.fillStyle = skin; // Skin visible
        ctx.fillRect(-4, 1 + leftFootOffset, 2, 2);
        ctx.fillRect(2, 1 + rightFootOffset, 2, 2);

        ctx.fillStyle = "#7c2d12"; // Socks/boots
        ctx.fillRect(-5, 3 + leftFootOffset, 3, 2);
        ctx.fillRect(2, 3 + rightFootOffset, 3, 2);
      }
      else if (styleId === "legs-skirt") {
        ctx.fillStyle = s;
        ctx.fillRect(-6, -4, 12, 4); // flared hips
        ctx.fillRect(-7, 0, 14, 2);  // wide skirt rim

        // Skin & tiny shoes
        ctx.fillStyle = skin;
        ctx.fillRect(-4, 2 + leftFootOffset, 2, 2);
        ctx.fillRect(2, 2 + rightFootOffset, 2, 2);

        ctx.fillStyle = "#1e1b4b"; // Mary Jane shoes
        ctx.fillRect(-4, 4 + leftFootOffset, 2, 1);
        ctx.fillRect(2, 4 + rightFootOffset, 2, 1);
      }
      else if (styleId === "legs-robe-bottom") {
        ctx.fillStyle = p; // rob bottom is primary color
        ctx.fillRect(-6, -4, 12, 8); // extends down to feet level
        
        ctx.fillStyle = a; // border accent line on bottom
        ctx.fillRect(-6, 4, 12, 1);
      }
      else if (styleId === "legs-robot") {
        ctx.fillStyle = "#64748b"; // metallic limbs
        ctx.fillRect(-4, -2, 2, 6 + leftFootOffset);
        ctx.fillRect(2, -2, 2, 6 + rightFootOffset);

        ctx.fillStyle = "#06b6d4"; // glowing energy joints
        ctx.fillRect(-4, 0, 2, 1);
        ctx.fillRect(2, 0, 2, 1);

        ctx.fillStyle = "#475569"; // steel feet
        ctx.fillRect(-5, 4 + leftFootOffset, 3, 2);
        ctx.fillRect(2, 4 + rightFootOffset, 3, 2);
      }
      else if (styleId === "legs-bandaged") {
        ctx.fillStyle = "#f1f5f9"; // white bandages
        ctx.fillRect(-5, -4, 10, 8);
        ctx.fillStyle = "#e2e8f0"; // shaded bandages lines
        ctx.fillRect(-4, -1, 8, 1);
        ctx.fillRect(-4, 2, 8, 1);
      }
      else if (styleId === "legs-fishtail") {
        // mermaid tail
        ctx.fillStyle = p; // Scaly green/blue
        ctx.fillRect(-4, -4, 8, 6);
        ctx.fillRect(-3, 2, 6, 2);

        // fins
        ctx.fillStyle = a; // golden accents
        ctx.beginPath();
        ctx.moveTo(-5, 4);
        ctx.lineTo(-1, 2);
        ctx.lineTo(-5, 1);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(5, 4);
        ctx.lineTo(1, 2);
        ctx.lineTo(5, 1);
        ctx.fill();
      }
      else if (styleId === "legs-ghost") {
        // ghostly wisp
        ctx.fillStyle = "rgba(147, 197, 253, 0.65)"; // semi transparent light blue
        ctx.fillRect(-4, -4, 8, 6);
        ctx.fillRect(-2, 2, 4, 3);
        ctx.fillRect(-1, 5, 2, 2); // winding tip tail
      }
      break;

    case "torso":
      // torsos options: robe, jacket, hoodie, armor, cape, vest, turtleneck, kimono, spacesuit, rags, suit, tattoo
      if (styleId === "torso-robe") {
        ctx.fillStyle = p; // primary robes
        ctx.fillRect(-6, -10, 12, 11);
        // Golden sash trim
        ctx.fillStyle = a;
        ctx.fillRect(-1, -6, 2, 7); // vertical stole
        ctx.fillRect(-6, -3, 12, 2);  // waistband belt
      }
      else if (styleId === "torso-jacket") {
        ctx.fillStyle = p; // main jacket color
        ctx.fillRect(-6, -10, 12, 9);
        // Sleeves
        ctx.fillStyle = p;
        if (direction === "left") {
          ctx.fillRect(-7, -9, 3, 7);
        } else if (direction === "right") {
          ctx.fillRect(4, -9, 3, 7);
        } else {
          ctx.fillRect(-7, -9, 2, 7);
          ctx.fillRect(5, -9, 2, 7);
        }
        // collar opening
        ctx.fillStyle = s;
        ctx.fillRect(-2, -10, 4, 3);
        ctx.fillStyle = a; // buttons/buckles
        ctx.fillRect(-1, -4, 2, 1);
      }
      else if (styleId === "torso-hoodie") {
        ctx.fillStyle = p; // primary color hoodie
        ctx.fillRect(-6, -10, 12, 10);
        // Front pockets
        ctx.fillStyle = s;
        ctx.fillRect(-3, -4, 6, 3);
        // Draw little drawstring cords
        ctx.fillStyle = a;
        ctx.fillRect(-2, -8, 1, 3);
        ctx.fillRect(1, -8, 1, 3);
      }
      else if (styleId === "torso-armor") {
        ctx.fillStyle = "#94a3b8"; // steel grey plate
        ctx.fillRect(-6, -10, 12, 9);
        // Gold inlay core
        ctx.fillStyle = a;
        ctx.fillRect(-2, -8, 4, 4);
        ctx.fillStyle = "#dc2626"; // red core crystal
        ctx.fillRect(-1, -7, 2, 2);
        
        ctx.fillStyle = s; // shoulders
        ctx.fillRect(-7, -10, 2, 2);
        ctx.fillRect(5, -10, 2, 2);
      }
      else if (styleId === "torso-cape") {
        // cape on front torso is straps, cape drapes behind in accessory layer
        ctx.fillStyle = s; // white leather straps
        ctx.fillRect(-5, -9, 10, 1);
        ctx.fillRect(-4, -9, 1, 5);
        ctx.fillRect(3, -9, 1, 5);
        ctx.fillStyle = p; // Cape visible behind collar sides
        ctx.fillRect(-7, -10, 2, 4);
        ctx.fillRect(5, -10, 2, 4);
      }
      else if (styleId === "torso-vest") {
        ctx.fillStyle = s; // light shirt under
        ctx.fillRect(-5, -10, 10, 9);
        ctx.fillStyle = p; // colorful vest overlapping
        ctx.fillRect(-5, -9, 3, 8);
        ctx.fillRect(2, -9, 3, 8);
        ctx.fillStyle = a; // buckle
        ctx.fillRect(-1, -5, 2, 1);
      }
      else if (styleId === "torso-turtleneck") {
        ctx.fillStyle = p; // high neck warm fiber
        ctx.fillRect(-6, -10, 12, 9);
        ctx.fillRect(-3, -12, 6, 2); // collar folded over neck
      }
      else if (styleId === "torso-kimono") {
        ctx.fillStyle = p;
        ctx.fillRect(-6, -10, 12, 10);
        // cross collar flap style CJS
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-3, -10);
        ctx.lineTo(0, -6);
        ctx.lineTo(3, -10);
        ctx.stroke();

        ctx.fillStyle = s; // large Obi belt sash
        ctx.fillRect(-6, -5, 12, 3);
      }
      else if (styleId === "torso-spacesuit") {
        ctx.fillStyle = "#e2e8f0"; // astronaut clean suit puffy white
        ctx.fillRect(-7, -11, 14, 11);
        // chest display panel
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(-2, -8, 4, 3);
        ctx.fillStyle = "#22c55e"; // flashing meter node
        ctx.fillRect(-1, -7, 2, 1);
      }
      else if (styleId === "torso-rags") {
        ctx.fillStyle = s; // rotten khaki rags
        ctx.fillRect(-5, -10, 10, 9);
        ctx.fillStyle = "#3c2f2f"; // holes
        ctx.fillRect(-3, -7, 2, 1);
        ctx.fillRect(2, -4, 2, 2);
      }
      else if (styleId === "torso-suit") {
        ctx.fillStyle = "#475569"; // corporate executive blazer
        ctx.fillRect(-6, -10, 12, 9);
        ctx.fillStyle = "#ffffff"; // inner white shirt
        ctx.fillRect(-2, -10, 4, 4);
        ctx.fillStyle = "#dc2626"; // red tie
        ctx.fillRect(-1, -8, 2, 4);
      }
      else if (styleId === "torso-tattoo") {
        ctx.fillStyle = skin; // bare chest skin
        ctx.fillRect(-5, -10, 10, 9);
        ctx.fillStyle = "#0c4a6e"; // tribal blue tattoos!
        ctx.fillRect(-3, -8, 2, 2);
        ctx.fillRect(1, -6, 2, 2);
      }
      break;

    case "hair":
      // hair-short, hair-long, hair-spiky, hair-curly, hair-bald, hair-mohawk, hair-bun, hat-scholar, hat-crown, hat-headphones, hat-antenna, hat-flame
      if (styleId === "hair-short") {
        ctx.fillStyle = hair;
        ctx.fillRect(-7, -23, 14, 7); // top dome
        ctx.fillRect(-7, -18, 2, 7);  // side burns left
        ctx.fillRect(5, -18, 2, 7);   // side burns right
        // front bangs overlay
        ctx.fillRect(-5, -17, 10, 2);
      }
      else if (styleId === "hair-long") {
        ctx.fillStyle = hair;
        ctx.fillRect(-7, -23, 14, 7); // top
        ctx.fillRect(-8, -17, 3, 16); // very long side hair drapes left
        ctx.fillRect(5, -17, 3, 16);  // very long right locks
        ctx.fillRect(-5, -17, 10, 2);
      }
      else if (styleId === "hair-spiky") {
        ctx.fillStyle = hair;
        ctx.fillRect(-6, -22, 12, 6);
        // Draw 5 spikes rising up
        ctx.fillRect(-6, -24, 2, 3);
        ctx.fillRect(-3, -25, 2, 4);
        ctx.fillRect(1, -25, 2, 4);
        ctx.fillRect(4, -24, 2, 3);
        // side bangs flare
        ctx.fillRect(-7, -17, 2, 5);
        ctx.fillRect(5, -17, 2, 5);
      }
      else if (styleId === "hair-curly") {
        ctx.fillStyle = hair;
        // high buoyant spherical curly hair afro
        ctx.beginPath();
        ctx.arc(0, -18, 9, 0, Math.PI * 2);
        ctx.arc(-5, -16, 6, 0, Math.PI * 2);
        ctx.arc(5, -16, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      else if (styleId === "hair-mohawk") {
        ctx.fillStyle = hair;
        ctx.fillRect(-2, -26, 4, 11); // Center ridge rising high!
        ctx.fillStyle = a; // neon tips
        ctx.fillRect(-1, -27, 2, 2);
      }
      else if (styleId === "hair-bun") {
        ctx.fillStyle = hair;
        ctx.fillRect(-7, -23, 14, 7);
        ctx.fillRect(-7, -17, 2, 5);
        ctx.fillRect(5, -17, 2, 5);
        ctx.fillRect(-4, -17, 8, 2);
        // Double hair buns at top corners or single high centered bun
        ctx.fillRect(-3, -27, 6, 5); // tall central bun
        ctx.fillStyle = a; // Golden hair pin holding it
        ctx.fillRect(-5, -25, 10, 1);
      }
      else if (styleId === "hat-scholar") {
        // Scholar graduation cap
        ctx.fillStyle = "#1e1b4b"; // deep indigo mortarboard
        ctx.fillRect(-8, -24, 16, 2); // flat top tile board
        ctx.fillRect(-4, -22, 8, 4);  // skull cap under
        ctx.fillStyle = a; // golden tassel
        ctx.fillRect(-8, -22, 1, 4);
        ctx.fillRect(-7, -19, 2, 2);
      }
      else if (styleId === "hat-crown") {
        // Gold majestic imperial crown
        ctx.fillStyle = "#f59e0b"; // gold
        ctx.fillRect(-5, -24, 10, 4);
        // peaks
        ctx.fillRect(-5, -26, 1, 2);
        ctx.fillRect(0, -27, 1, 3);
        ctx.fillRect(4, -26, 1, 2);
        // ruby diamond crown jewels
        ctx.fillStyle = "#ec4899";
        ctx.fillRect(-2, -23, 1, 1);
        ctx.fillRect(2, -23, 1, 1);
      }
      else if (styleId === "hat-headphones") {
        // Tech headphones
        ctx.fillStyle = p; // headband arching over top of bald/skin
        ctx.fillRect(-6, -22, 12, 1);
        // Large side earmuffs
        ctx.fillStyle = s;
        ctx.fillRect(-8, -18, 3, 5);
        ctx.fillRect(5, -18, 3, 5);
        // flashing green LED indicators
        ctx.fillStyle = "#22c55e";
        ctx.fillRect(-8, -16, 1, 1);
        ctx.fillRect(7, -16, 1, 1);
      }
      else if (styleId === "hat-antenna") {
        // Antenna with blinking LED
        ctx.fillStyle = "#64748b"; // silver vertical rod
        ctx.fillRect(-1, -26, 2, 6);
        // top bulb LED
        ctx.fillStyle = "#ef4444"; // glowing crimson blinking node
        ctx.beginPath();
        ctx.arc(0, -27, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      else if (styleId === "hat-flame") {
        // Calcifer animated flame on head
        ctx.fillStyle = "#ea580c"; // bright orange base
        ctx.beginPath();
        ctx.moveTo(-4, -21);
        ctx.quadraticCurveTo(0, -32, 2, -30);
        ctx.quadraticCurveTo(-1, -24, 3, -21);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = "#facc15"; // yellow fire core
        ctx.beginPath();
        ctx.moveTo(-2, -21);
        ctx.quadraticCurveTo(0, -28, 1, -26);
        ctx.quadraticCurveTo(-1, -22, 2, -21);
        ctx.closePath();
        ctx.fill();
      }
      else if (styleId === "hair-bald") {
        // No hair drawn at all
      }
      break;

    case "eyes":
      // eyes-round, eyes-sharp, eyes-closed, eyes-glasses, eyes-sunglasses, eyes-eyepatch, eyes-starry, eyes-spiral, eyes-robot, eyes-blindfold
      if (direction === "up") {
        // Back of head has NO face / eyes drawn ever
        break;
      }

      ctx.save();
      // Translate slightly to make eye placement easy
      if (direction === "left") {
        ctx.translate(-2, 0); // shift left profile
      } else if (direction === "right") {
        ctx.translate(2, 0);  // shift right profile
      }

      if (styleId === "eyes-round") {
        ctx.fillStyle = "#111827"; // Dark obsidian iris
        ctx.fillRect(-3, -16, 2, 2);
        ctx.fillRect(2, -16, 2, 2);
        // Tiny cute cheek blushing
        ctx.fillStyle = "rgba(236, 72, 153, 0.4)";
        ctx.fillRect(-4, -13, 2, 1);
        ctx.fillRect(3, -13, 2, 1);
      }
      else if (styleId === "eyes-sharp") {
        ctx.fillStyle = "#3b82f6"; // determined cyan-blue fierce eyes
        ctx.fillRect(-4, -16, 3, 1);
        ctx.fillRect(2, -16, 3, 1);
        ctx.fillStyle = "#1e1b4b"; // brow
        ctx.fillRect(-4, -17, 3, 1);
        ctx.fillRect(2, -17, 3, 1);
      }
      else if (styleId === "eyes-closed") {
        ctx.fillStyle = "#475569"; // serene curved closed sleeping lines
        ctx.fillRect(-3, -15, 2, 1);
        ctx.fillRect(2, -15, 2, 1);
      }
      else if (styleId === "eyes-glasses") {
        // Round academic glasses
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(-2.5, -15, 2, 0, Math.PI * 2);
        ctx.arc(2.5, -15, 2, 0, Math.PI * 2);
        ctx.stroke();
        // bridge strap
        ctx.beginPath();
        ctx.moveTo(-1, -15);
        ctx.lineTo(1, -15);
        ctx.stroke();
      }
      else if (styleId === "eyes-sunglasses") {
        ctx.fillStyle = "#0f172a"; // dark VIP shades glasses
        ctx.fillRect(-5, -17, 10, 3);
        ctx.fillStyle = "#cbd5e1"; // glare shine reflection line
        ctx.fillRect(-4, -17, 1, 1);
        ctx.fillRect(1, -17, 1, 1);
      }
      else if (styleId === "eyes-eyepatch") {
        ctx.fillStyle = "#3c2f2f"; // eyepatch bandage on right side
        ctx.fillRect(-3, -16, 2, 2); // left eye drawn normaal
        ctx.fillStyle = "#111827"; // strap
        ctx.fillRect(-5, -16, 11, 1);
        ctx.fillRect(1, -17, 3, 3);  // eyepatch node covering right eye completely
      }
      else if (styleId === "eyes-starry") {
        // star-shaped sparkly gold eyes
        ctx.fillStyle = "#fbbf24";
        ctx.fillRect(-3, -16, 2, 2);
        ctx.fillRect(2, -16, 2, 2);
        // sparkle dot white
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(-2, -16, 1, 1);
        ctx.fillRect(3, -16, 1, 1);
      }
      else if (styleId === "eyes-spiral") {
        ctx.fillStyle = "#a855f7"; // purple hypnotic spiral lines
        ctx.fillRect(-3, -16, 2, 2);
        ctx.fillRect(2, -16, 2, 2);
        ctx.fillStyle = "#f3e8ff"; // centered spiral iris dot
        ctx.fillRect(-2, -15, 1, 1);
        ctx.fillRect(3, -15, 1, 1);
      }
      else if (styleId === "eyes-robot") {
        // single horizontal robotic scanning laser beam visor
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(-4, -16, 8, 2);
        ctx.fillStyle = "#fca5a5"; // moving scan pointer
        ctx.fillRect(-1, -16, 2, 2);
      }
      else if (styleId === "eyes-blindfold") {
        // ancient blind martial artist blindfold cloth
        ctx.fillStyle = "#eedba5"; // faded beige wrap canvas
        ctx.fillRect(-5, -17, 11, 3);
        ctx.fillStyle = "#7c2d12"; // binding sash knots hanging behind on head sides (only drawn in up, but let's draw side strands here)
        if (direction === "left") {
          ctx.fillRect(4, -15, 2, 4);
        } else if (direction === "right") {
          ctx.fillRect(-5, -15, 2, 4);
        }
      }
      ctx.restore();
      break;

    case "accessory":
      // acc-scarf, acc-backpack, acc-wings-small, acc-cape-shoulder, acc-pauldron, acc-cat, acc-parrot, acc-book-floating, acc-lantern, acc-none
      if (styleId === "acc-scarf") {
        // Flowing long scarf
        ctx.fillStyle = "#dc2626"; // Vibrant red scarf wrapped on neck
        ctx.fillRect(-4, -11, 9, 2);
        // Long winding flying tails depending on walk animation
        const windSway = Math.sin(walkFrame * Math.PI / 1.5) * 3;
        if (direction === "left" || direction === "up") {
          ctx.fillRect(3, -10, 4, 2);
          ctx.fillRect(5 + windSway, -8, 2, 6); // hangs back fluttering
        } else {
          ctx.fillRect(-7, -10, 4, 2);
          ctx.fillRect(-7 - windSway, -8, 2, 6);
        }
      }
      else if (styleId === "acc-backpack") {
        // Traveler heavy canvas backpack
        ctx.fillStyle = s; // brown leather backpack box on back
        if (direction === "up") {
          ctx.fillRect(-5, -9, 10, 9); // occupies central back completely
          // yellow pockets and straps layout CJS
          ctx.fillStyle = a;
          ctx.fillRect(-4, -6, 2, 5);
          ctx.fillRect(2, -6, 2, 5);
          ctx.fillRect(-5, -9, 10, 2.5); // flap lid
        } else if (direction === "left") {
          ctx.fillRect(4, -8, 4, 8); // visible on right flank
          ctx.fillStyle = a;
          ctx.fillRect(5, -6, 2, 4);
        } else if (direction === "right") {
          ctx.fillRect(-8, -8, 4, 8); // visible on left flank
          ctx.fillStyle = a;
          ctx.fillRect(-7, -6, 2, 4);
        } else {
          // Down: hidden behind shoulders, draw small straps on lapels
          ctx.fillStyle = s;
          ctx.fillRect(-5, -8, 1, 6);
          ctx.fillRect(4, -8, 1, 6);
        }
      }
      else if (styleId === "acc-wings-small") {
        // Small angelic bird wings
        ctx.fillStyle = "#ffffff"; // pure white wings expanding out
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        // animate flap slightly with walk cycle
        const flapOffset = Math.round(Math.sin((walkFrame * Math.PI) / 2) * 2);
        
        if (direction === "up" || direction === "down") {
          // Left wing
          ctx.fillRect(-15, -14 + flapOffset, 9, 6);
          ctx.fillRect(-13, -8 + flapOffset, 6, 4);
          // Right wing
          ctx.fillRect(7, -14 + flapOffset, 9, 6);
          ctx.fillRect(8, -8 + flapOffset, 6, 4);
        } else if (direction === "left") {
          // Only right wing visible behind shoulder
          ctx.fillRect(4, -14 + flapOffset, 8, 6);
          ctx.fillRect(5, -8 + flapOffset, 5, 4);
        } else if (direction === "right") {
          // Only left wing visible behind shoulder
          ctx.fillRect(-12, -14 + flapOffset, 8, 6);
          ctx.fillRect(-10, -8 + flapOffset, 5, 4);
        }
      }
      else if (styleId === "acc-cape-shoulder") {
        // Noble long drapes cape
        ctx.fillStyle = p; // Cape matching primary robes
        if (direction === "up") {
          ctx.fillRect(-8, -10, 16, 13); // covers back torso completely
          ctx.fillStyle = a; // golden lace tie on top
          ctx.fillRect(-3, -10, 6, 1);
        } else if (direction === "left") {
          ctx.fillRect(2, -10, 5, 12);
        } else if (direction === "right") {
          ctx.fillRect(-7, -10, 5, 12);
        } else {
          // Down: drapes on sides of shoulders
          ctx.fillRect(-8, -10, 2, 10);
          ctx.fillRect(6, -10, 2, 10);
        }
      }
      else if (styleId === "acc-pauldron") {
        // Giant shoulder guard on left sleeve
        ctx.fillStyle = a; // Gold heavy shoulder plate
        ctx.fillRect(-8, -11, 4, 4);
        ctx.fillStyle = "#dc2626"; // embedded red jewel
        ctx.fillRect(-7, -10, 2, 2);
      }
      else if (styleId === "acc-cat") {
        // Cute black kitty sitting on passenger shoulder
        ctx.fillStyle = "#1e1b4b"; // Dark blue-black kitten
        ctx.fillRect(4, -14, 3, 4); // body sits on right shoulder (X coordinate 4)
        ctx.fillRect(3, -17, 4, 3); // head
        // pointy ear tips
        ctx.fillStyle = "#111827";
        ctx.fillRect(3, -19, 1, 2);
        ctx.fillRect(6, -19, 1, 2);
        // glowing lime eyes
        ctx.fillStyle = "#a3e635";
        ctx.fillRect(4, -16, 1, 1);
        ctx.fillRect(6, -16, 1, 1);
      }
      else if (styleId === "acc-parrot") {
        // Pirate companion parrot bird
        ctx.fillStyle = "#dc2626"; // Crimson red feathers
        ctx.fillRect(4, -13, 3, 3); // body
        ctx.fillStyle = "#eab308"; // golden curved yellow beak
        ctx.fillRect(7, -13, 1, 1);
        // long tail feather teal
        ctx.fillStyle = "#0d9488";
        ctx.fillRect(5, -10, 1, 3);
      }
      else if (styleId === "acc-book-floating") {
        // floating ancient socratic ledger book hovering over side shoulder
        const hoverSway = Math.round(Math.sin(walkFrame * 0.75) * 3) - 15;
        ctx.fillStyle = "#dc2626"; // red hardcover binding
        ctx.fillRect(-13, hoverSway, 7, 5);
        ctx.fillStyle = "#f8fafc"; // inner pages
        ctx.fillRect(-12, hoverSway + 1, 5, 3);
        ctx.fillStyle = a; // golden lock ribbon trail
        ctx.fillRect(-13, hoverSway + 5, 2, 3);
      }
      else if (styleId === "acc-lantern") {
        // Lantern hanging from traveler waistbelt side
        ctx.fillStyle = "#78350f"; // metallic frame holder
        ctx.fillRect(4, -1, 3, 5);
        ctx.fillStyle = "#fef08a"; // glowing yellow core flame
        ctx.fillRect(5, 1, 1, 2);
      }
      else if (styleId === "acc-none") {
        // Fully empty transparent accessory frame
      }
      break;
  }

  ctx.restore();
}

/**
 * Procedurally draws the combined composited layers on the canvas frame
 */
export function drawCompositedAvatar(
  ctx: CanvasRenderingContext2D,
  frameX: number,
  frameY: number,
  config: AvatarConfig,
  direction: "down" | "left" | "right" | "up",
  walkFrame: number,
  isWalking: boolean
) {
  // Stacks our 6 layered system strictly by z-order instructions:
  // 1. BOTTOM: Base body mannequin nude
  drawAvatarFrame(ctx, frameX, frameY, "mannequin", "base", direction, walkFrame, isWalking, config.colors);

  // 2. Legs / lower body garment (pants, shorts, etc)
  drawAvatarFrame(ctx, frameX, frameY, "legs", config.legsId, direction, walkFrame, isWalking, config.colors);

  // 3. Torso / upper body garment
  drawAvatarFrame(ctx, frameX, frameY, "torso", config.torsoId, direction, walkFrame, isWalking, config.colors);

  // 4. Shoulder accessory / pet / cape
  drawAvatarFrame(ctx, frameX, frameY, "accessory", config.accessoryId, direction, walkFrame, isWalking, config.colors);

  // 5. Head / hair / hat
  drawAvatarFrame(ctx, frameX, frameY, "hair", config.hairId, direction, walkFrame, isWalking, config.colors);

  // 6. TOP: Eyes / facial expression (drawn last to sit on top of hair/hat)
  drawAvatarFrame(ctx, frameX, frameY, "eyes", config.eyesId, direction, walkFrame, isWalking, config.colors);
}

/**
 * Creates/generates a full 256x192 PNG spritesheet URL representing a specific layer inside the Canvas
 */
export function generateSpritesheetDataUrl(
  layerName: "assembled" | "mannequin" | "hair" | "eyes" | "torso" | "legs" | "accessory",
  config: AvatarConfig
): string {
  // Create an off-screen canvas with exactly the total requested spritesheet size 256x192
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 4 rows correspond to Directions: [Down, Left, Right, Up]
  const DIRECTIONS: Array<"down" | "left" | "right" | "up"> = ["down", "left", "right", "up"];

  for (let row = 0; row < 4; row++) {
    const dir = DIRECTIONS[row];
    const targetY = row * 48; // Frame height is 48px

    for (let col = 0; col < 4; col++) {
      const targetX = col * 64; // Frame width is 64px
      
      // Paint specific frames (walkFrame is 0 to 3)
      if (layerName === "assembled") {
        drawCompositedAvatar(ctx, targetX, targetY, config, dir, col, true);
      } else if (layerName === "mannequin") {
        drawAvatarFrame(ctx, targetX, targetY, "mannequin", "base", dir, col, true, config.colors);
      } else {
        const styleId = 
          layerName === "hair" ? config.hairId :
          layerName === "eyes" ? config.eyesId :
          layerName === "torso" ? config.torsoId :
          layerName === "legs" ? config.legsId : config.accessoryId;
        
        drawAvatarFrame(ctx, targetX, targetY, layerName, styleId, dir, col, true, config.colors);
      }
    }
  }

  return canvas.toDataURL("image/png");
}
