import React from "react";

interface WeatherParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
  angle: number;
  drift: number;
}

interface DrawWeatherOptions {
  ctx: CanvasRenderingContext2D;
  dimensions: { width: number; height: number };
  activeWeather: "Sunny" | "Rain" | "Snow" | "Storm" | "Sakura";
  frameTick: number;
  particlesRef: React.MutableRefObject<WeatherParticle[]>;
}

export function drawWeather({
  ctx,
  dimensions,
  activeWeather,
  frameTick,
  particlesRef,
}: DrawWeatherOptions): void {
  if (activeWeather === "Sunny") return;

  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0); // reset camera transforms to paint in screen pixel-space!

  // Initialize dynamic weather particles if empty
  if (!particlesRef.current || particlesRef.current.length === 0) {
    const list: WeatherParticle[] = [];
    for (let i = 0; i < 160; i++) {
      list.push({
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        speed: 4 + Math.random() * 6,
        size: 1 + Math.random() * 3,
        angle: Math.PI / 3 + Math.random() * 0.15,
        drift: Math.random() * 100,
      });
    }
    particlesRef.current = list;
  }

  const particles = particlesRef.current;

  if (activeWeather === "Rain" || activeWeather === "Storm") {
    ctx.strokeStyle = activeWeather === "Storm" ? "rgba(186, 230, 253, 0.45)" : "rgba(14, 165, 233, 0.35)";
    ctx.lineWidth = activeWeather === "Storm" ? 1.5 : 1.0;

    // Severe thunder lightning flash selector in Storm mod
    if (activeWeather === "Storm" && frameTick % 220 < 4) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      ctx.fillRect(0, 0, dimensions.width, dimensions.height);
    }

    particles.forEach((p) => {
      p.y += p.speed * 1.6;
      p.x += Math.cos(p.angle) * p.speed;

      if (p.y > dimensions.height || p.x > dimensions.width) {
        p.y = -10;
        p.x = Math.random() * dimensions.width;
      }

      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + Math.cos(p.angle) * 12, p.y + 12);
      ctx.stroke();
    });
  } else if (activeWeather === "Snow") {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    particles.forEach((p) => {
      p.y += p.speed * 0.28;
      p.x += Math.sin(frameTick * 0.02 + p.drift) * 0.6;

      if (p.y > dimensions.height) {
        p.y = -6;
        p.x = Math.random() * dimensions.width;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.85, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (activeWeather === "Sakura") {
    ctx.fillStyle = "rgba(251, 113, 133, 0.75)"; // beautiful pink cherry sakura petals
    particles.forEach((p, idx) => {
      p.y += p.speed * 0.22;
      p.x += Math.sin(frameTick * 0.015 + p.drift) * 0.8 + 0.3;

      if (p.y > dimensions.height) {
        p.y = -6;
        p.x = Math.random() * dimensions.width;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(frameTick * 0.01 + idx);
      // draw tiny slender sakura petal leaf
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size * 1.5, p.size * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  ctx.restore();
}
