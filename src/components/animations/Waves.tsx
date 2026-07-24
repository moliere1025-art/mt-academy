import React, { useRef, useEffect } from 'react';

interface WavesProps {
  className?: string;
  color?: string;
}

export default function Waves({ className, color = 'rgba(0, 85, 238, 0.1)' }: WavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let count = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = color;

      const waves = 3;
      for (let i = 0; i < waves; i++) {
        ctx.beginPath();
        const offset = i * 200;
        const amplitude = 20 + i * 10;
        const frequency = 0.005 + i * 0.002;

        for (let x = 0; x <= canvas.width; x += 10) {
          const y = canvas.height / 2 + Math.sin(x * frequency + count + offset) * amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.lineTo(canvas.width, canvas.height);
        ctx.lineTo(0, canvas.height);
        ctx.closePath();
        ctx.fill();
      }

      count += 0.02;
      animationFrameId = window.requestAnimationFrame(render);
    };

    const handleResize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();
    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [color]);

  return <canvas ref={canvasRef} className={className} />;
}
