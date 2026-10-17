"use client";

import { useEffect, useRef } from "react";

type RevealPhase = "covering" | "opening";

type SceneRevealLoaderProps = {
  phase: RevealPhase;
  onAnimationEnd: () => void;
};

function PixelLatticeLoader() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const size = 48;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = size * scale;
    canvas.height = size * scale;
    context.scale(scale, scale);

    const accent = getComputedStyle(canvas).color;
    const startedAt = performance.now();
    let frame = 0;

    const draw = (now: number) => {
      context.clearRect(0, 0, size, size);

      const center = size / 2;
      const spacing = size > 30 ? 4 : 2.4;
      const pixel = size > 30 ? 3 : 2;

      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          const pulse = Math.max(
            0,
            Math.sin((now - startedAt) * 0.003 - 0.7 * row - 0.35 * column),
          );
          context.fillStyle = accent;
          context.globalAlpha = 0.06 + 0.84 * pulse ** 1.6;
          context.fillRect(
            Math.round(center + (row - 1) * spacing) - Math.floor(pixel / 2),
            Math.round(center + (column - 1) * spacing) - Math.floor(pixel / 2),
            pixel,
            pixel,
          );
        }
      }

      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    };

    draw(startedAt);

    return () => window.cancelAnimationFrame(frame);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="scene-reveal-loader__canvas"
      width={48}
      height={48}
      aria-hidden="true"
    />
  );
}

export function SceneRevealLoader({ phase, onAnimationEnd }: SceneRevealLoaderProps) {
  const phaseClass =
    phase === "opening"
      ? "scene-reveal-loader--opening"
      : "scene-reveal-loader--covering";

  return (
    <div
      className={`scene-reveal-loader ${phaseClass}`}
      role="status"
      aria-label="Loading The Scene"
      onAnimationEnd={phase === "opening" ? onAnimationEnd : undefined}
    >
      <div className="scene-reveal-loader__content">
        <PixelLatticeLoader />
        <span className="scene-reveal-loader__label">Loading The Scene</span>
      </div>
    </div>
  );
}
