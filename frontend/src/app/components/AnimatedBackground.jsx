"use client";
import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let width = window.innerWidth;
    let height = window.innerHeight;

    canvas.width = width;
    canvas.height = height;

    // Create green blobs
    const greenColors = [
      // Dark blues
      "rgba(0, 0, 50, 0.6)", // Deep Navy
      "rgba(10, 10, 80, 0.6)", // Midnight Blue
      "rgba(0, 20, 60, 0.6)", // Dark Ocean Blue
      "rgba(25, 25, 112, 0.6)", // Darker Midnight Blue
      // Accent colors that complement blue
      "rgba(75, 0, 130, 0.5)", // Indigo
      "rgba(106, 90, 205, 0.5)", // Slate Blue
      "rgba(138, 43, 226, 0.4)", // Blue Violet
      "rgba(72, 61, 139, 0.5)", // Dark Slate Blue
      "rgba(0, 100, 100, 0.4)", // Dark Teal
      "rgba(0, 75, 75, 0.5)", // Deep Teal
      "rgba(0, 139, 139, 0.4)", // Dark Cyan
      // Subtle highlights
      "rgba(30, 144, 255, 0.3)", // Dodger Blue
      "rgba(0, 191, 255, 0.3)", // Deep Sky Blue
      "rgba(143, 188, 143, 0.5)", // Dark Sea Green
      "rgba(0, 100, 0, 0.5)", // Dark Green
      "rgba(34, 139, 34, 0.5)", // Forest Green
    ];

    const blobs = [];
    const blobCount = 15;

    for (let i = 0; i < blobCount; i++) {
      blobs.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 300 + 100,
        color: greenColors[Math.floor(Math.random() * greenColors.length)],
        xSpeed: Math.random() * 0.5 - 0.15,
        ySpeed: Math.random() * 0.5 - 0.15,
      });
    }

    function animate() {
      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // Draw and update blobs
      for (let blob of blobs) {
        // Draw
        ctx.beginPath();
        ctx.fillStyle = blob.color;
        ctx.filter = "blur(50px)";
        ctx.arc(blob.x, blob.y, blob.radius, 0, Math.PI * 2);
        ctx.fill();

        // Update position
        blob.x += blob.xSpeed;
        blob.y += blob.ySpeed;

        // Bounce off walls
        if (blob.x - blob.radius < 0 || blob.x + blob.radius > width) {
          blob.xSpeed *= -1;
        }
        if (blob.y - blob.radius < 0 || blob.y + blob.radius > height) {
          blob.ySpeed *= -1;
        }
      }

      requestAnimationFrame(animate);
    }

    animate();

    // Handle resize
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed top-0 left-0 w-full h-full -z-10"
    />
  );
}
