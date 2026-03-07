import React, { useEffect, useRef } from "react";

export default function AudioVisualizer({ isPlaying, audioRef }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const audioContextRef = useRef(null);

  useEffect(() => {
    if (!isPlaying || !audioRef?.current || !canvasRef.current) {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawIdleBars(ctx, canvas.width, canvas.height);
      }
      return;
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      const audioContext = audioContextRef.current;

      if (!sourceRef.current) {
        sourceRef.current = audioContext.createMediaElementSource(audioRef.current);
        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 128;
        sourceRef.current.connect(analyserRef.current);
        analyserRef.current.connect(audioContext.destination);
      }

      if (audioContext.state === "suspended") audioContext.resume();

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      const draw = () => {
        canvas.width = canvas.offsetWidth * 2;
        canvas.height = canvas.offsetHeight * 2;
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barCount = 48;
        const barWidth = (canvas.width / barCount) * 0.6;
        const gap = (canvas.width / barCount) * 0.4;

        for (let i = 0; i < barCount; i++) {
          const dataIndex = Math.floor((i / barCount) * bufferLength);
          const value = dataArray[dataIndex] / 255;
          const barHeight = Math.max(4, value * canvas.height * 0.85);
          const x = i * (barWidth + gap);
          const y = canvas.height - barHeight;

          const gradient = ctx.createLinearGradient(x, canvas.height, x, y);
          gradient.addColorStop(0, "rgba(124, 58, 237, 0.9)");
          gradient.addColorStop(0.5, "rgba(59, 130, 246, 0.5)");
          gradient.addColorStop(1, "rgba(139, 92, 246, 0.1)");

          ctx.fillStyle = gradient;
          ctx.shadowColor = "rgba(124, 58, 237, 0.4)";
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch {
      drawFallbackAnimation();
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, audioRef]);

  const drawIdleBars = (ctx, width, height) => {
    const barCount = 48;
    const barWidth = (width / barCount) * 0.6;
    const gap = (width / barCount) * 0.4;
    for (let i = 0; i < barCount; i++) {
      const x = i * (barWidth + gap);
      ctx.fillStyle = "rgba(124, 58, 237, 0.12)";
      ctx.beginPath();
      ctx.roundRect(x, height - 4, barWidth, 4, 2);
      ctx.fill();
    }
  };

  const drawFallbackAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let frame = 0;

    const animate = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 48;
      const barWidth = (canvas.width / barCount) * 0.6;
      const gap = (canvas.width / barCount) * 0.4;

      for (let i = 0; i < barCount; i++) {
        const value = (Math.sin(frame * 0.05 + i * 0.3) + 1) / 2;
        const barHeight = Math.max(4, value * canvas.height * 0.7);
        const x = i * (barWidth + gap);
        const y = canvas.height - barHeight;

        const gradient = ctx.createLinearGradient(x, canvas.height, x, y);
        gradient.addColorStop(0, "rgba(124, 58, 237, 0.9)");
        gradient.addColorStop(1, "rgba(59, 130, 246, 0.1)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      }
      frame++;
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-20 md:h-24"
      style={{ imageRendering: "auto" }}
    />
  );
}