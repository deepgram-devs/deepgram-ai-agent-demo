import React, { useEffect, useRef, useState } from "react";

interface Point {
  x: number;
  y: number;
  originX: number;
  originY: number;
  noiseOffsetX: number;
  noiseOffsetY: number;
}

interface VoiceListeningAnimationProps {
  isDone?: boolean;
}

const VoiceListeningAnimation: React.FC<VoiceListeningAnimationProps> = ({
  isDone = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 200;
    canvas.height = 200;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = 80;
    const points: Point[] = [];
    const numPoints = 15;
    let hue = 0;

    for (let i = 0; i < numPoints; i++) {
      const angle = (i / numPoints) * Math.PI * 2;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      points.push({
        x,
        y,
        originX: x,
        originY: y,
        noiseOffsetX: Math.random() * 1000,
        noiseOffsetY: Math.random() * 1000,
      });
    }

    const noise = (x: number, y: number) => {
      return (Math.sin(x / 5) + Math.sin(y / 5)) / 2;
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update scale for small animation
      setScale((prevScale) => {
        const newScale = 1 + Math.sin(Date.now() / 200) * 0.05;
        return newScale;
      });

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.scale(scale, scale);
      ctx.translate(-centerX, -centerY);

      if (isDone) {
        // Draw a simple circle when isDone is true
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${hue}, 100%, 95%)`;
        ctx.fill();
      } else {
        // Draw the original animation when isDone is false
        for (let i = 0; i < points.length; i++) {
          const point = points[i];
          const nX = noise(point.noiseOffsetX, point.noiseOffsetY);
          const nY = noise(
            point.noiseOffsetX + 1000,
            point.noiseOffsetY + 1000
          );
          const x = point.originX + nX * 20;
          const y = point.originY + nY * 20;
          point.x = x;
          point.y = y;
          point.noiseOffsetX += 0.05;
          point.noiseOffsetY += 0.05;
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          const point = points[i];
          const prevPoint = points[i - 1];
          const midX = (prevPoint.x + point.x) / 2;
          const midY = (prevPoint.y + point.y) / 2;
          ctx.quadraticCurveTo(prevPoint.x, prevPoint.y, midX, midY);
        }
        ctx.quadraticCurveTo(
          points[points.length - 1].x,
          points[points.length - 1].y,
          points[0].x,
          points[0].y
        );
        ctx.fillStyle = `hsl(${hue}, 100%, 95%)`;
        ctx.fill();
      }

      ctx.restore();

      hue = (hue + 2) % 360;

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      // Cleanup if necessary
    };
  }, [isDone]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "200px",
        background: "transparent",
      }}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default VoiceListeningAnimation;
