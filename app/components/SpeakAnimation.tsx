import React, { useEffect, useRef, useState } from "react";

interface WaveAnimationProps {
  speed: number; // Speed factor, 1 is default, higher is faster, lower is slower
}

const WaveAnimation: React.FC<WaveAnimationProps> = ({ speed = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationSpeed, setAnimationSpeed] = useState(speed);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 230; // Total width for 4 waves (20px each) + gaps
    canvas.height = 150; // Slightly higher than max wave height

    const waveCount = 4;
    const waveWidth = 50;
    const waveGap = 5;
    const minHeight = 40;
    const maxHeight = 140;

    let currentHeights = [70, 70, 70, 70];
    let targetHeights = [70, 70, 70, 70];

    const lerp = (start: number, end: number, t: number) => {
      return start * (1 - t) + end * t;
    };

    let lastTime = 0;
    const animate = (time: number) => {
      const deltaTime = time - lastTime;
      lastTime = time;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";

      for (let i = 0; i < waveCount; i++) {
        const x = i * (waveWidth + waveGap);

        // Smoothly interpolate towards the target height
        const lerpFactor = Math.min(1, 0.003 * deltaTime * animationSpeed);
        currentHeights[i] = lerp(
          currentHeights[i],
          targetHeights[i],
          lerpFactor
        );

        const height = currentHeights[i];
        const y = (canvas.height - height) / 2;

        ctx.beginPath();
        ctx.roundRect(x, y, waveWidth, height, waveWidth / 2);
        ctx.fill();

        // Randomly change target height
        if (Math.random() < 0.001 * deltaTime * animationSpeed) {
          targetHeights[i] =
            Math.random() * (maxHeight - minHeight) + minHeight;
        }
      }

      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);

    return () => {
      // No need to cancel animation frame as it will stop when component unmounts
    };
  }, [animationSpeed]);

  // Update animation speed when prop changes
  useEffect(() => {
    setAnimationSpeed(speed);
  }, [speed]);

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

export default WaveAnimation;
