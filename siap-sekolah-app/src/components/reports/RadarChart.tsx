"use client";

// AETRIUM DESIGN TOKENS — PROPORTIONAL RADAR 360° CHART (HEXAGON 6 FONDASI)
// Primary Sage: #5C7C68, Earthy Green: #486B5A, Accent: #B85627, Border: #E8E2D8

import React from "react";
import type { FoundationNumber } from "@/types";

export interface RadarChartProps {
  scores?: Record<number, number | null>;
  foundationScores?: Record<FoundationNumber, number | null>;
  size?: number;
  className?: string;
}

export function RadarChart({
  scores,
  foundationScores,
  size = 240,
  className = "",
}: RadarChartProps) {
  const center = size / 2;
  const radius = 72; // Balanced radius for 6-axis hexagon with text margins
  const levels = [1, 2, 3, 4]; // Scores 1 to 4
  const numAxes = 6;

  // 6 Fondasi Transisi PAUD-SD Kemendikbudristek
  const axes: { id: FoundationNumber; label: string; short: string }[] = [
    { id: 1, label: "Agama & Budi Pekerti", short: "P1: Agama & Karakter" },
    { id: 2, label: "Keterampilan Sosial & Bahasa", short: "P2: Sosial-Bahasa" },
    { id: 3, label: "Kematangan Emosi", short: "P3: Emosi & Regulasi" },
    { id: 4, label: "Kematangan Kognitif", short: "P4: Kognitif & Nalar" },
    { id: 5, label: "Motorik & Perawatan Diri", short: "P5: Fisik & Mandiri" },
    { id: 6, label: "Pemaknaan Belajar Positif", short: "P6: Refleksi & Ceria" },
  ];

  // Helper to compute (x, y) coordinates for an axis angle and distance
  const getCoordinates = (index: number, value: number, maxVal = 4) => {
    // Angle in radians, starting from top (-pi/2)
    const angle = ((Math.PI * 2) / numAxes) * index - Math.PI / 2;
    const r = (value / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Resolve score for each foundation
  const getScoreForAxis = (fNum: FoundationNumber): number | null => {
    if (foundationScores && foundationScores[fNum] !== undefined && foundationScores[fNum] !== null) {
      return foundationScores[fNum];
    }
    if (scores) {
      // Fallback mapping if only pos scores are provided
      if (fNum === 1) return scores[1] ?? null;
      if (fNum === 2) return scores[4] ?? null;
      if (fNum === 3) return scores[1] ?? null;
      if (fNum === 4) return scores[3] ?? null;
      if (fNum === 5) return scores[2] ?? null;
      if (fNum === 6) return scores[5] ?? null;
    }
    return null;
  };

  // Generate polygon points for data
  const dataPoints = axes.map((item, index) => {
    const rawScore = getScoreForAxis(item.id) ?? 1;
    const clampedScore = Math.max(1, Math.min(4, rawScore));
    return getCoordinates(index, clampedScore);
  });

  const polygonPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size + 36}
        height={size + 24}
        viewBox={`-18 -12 ${size + 36} ${size + 24}`}
        className="overflow-visible"
      >
        {/* Background Level Hexagons (Web) */}
        {levels.map((level) => {
          const levelPoints = axes
            .map((_, i) => {
              const { x, y } = getCoordinates(i, level);
              return `${x},${y}`;
            })
            .join(" ");

          const isTarget = level === 3;
          const isOuter = level === 4;

          return (
            <polygon
              key={level}
              points={levelPoints}
              fill={isOuter ? "#FAF8F5" : "transparent"}
              stroke={isTarget ? "#B85627" : "#DDD7CE"}
              strokeWidth={isTarget ? "1.5" : "1"}
              strokeDasharray={isTarget ? "3,3" : isOuter ? "none" : "2,2"}
            />
          );
        })}

        {/* Axis Spokes */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 4);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#CBD3CD"
              strokeWidth="1.2"
            />
          );
        })}

        {/* Level Scale Numbers Along Vertical Top Axis */}
        {levels.map((level) => {
          const { y } = getCoordinates(0, level);
          return (
            <text
              key={level}
              x={center + 5}
              y={y + 3.5}
              fontSize="9.5"
              fill="#787F7A"
              fontWeight="700"
              className="font-mono select-none"
            >
              {level}
            </text>
          );
        })}

        {/* Data Hexagon Polygon Fill & Outline */}
        <polygon
          points={polygonPath}
          fill="rgba(72, 107, 90, 0.22)"
          stroke="#486B5A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data Point Dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4.5}
            fill="#486B5A"
            stroke="#FFFFFF"
            strokeWidth="2"
          />
        ))}

        {/* 6 Axis Labels & Scores */}
        {axes.map((item, i) => {
          const { angle } = getCoordinates(i, 4);
          const labelDist = 18;
          const lx = center + (radius + labelDist) * Math.cos(angle);
          const ly = center + (radius + labelDist) * Math.sin(angle);

          const scoreVal = getScoreForAxis(item.id);
          const scoreText =
            scoreVal !== null && scoreVal !== undefined ? scoreVal.toFixed(1) : "-";

          let textAnchor: "start" | "end" | "middle" = "middle";
          if (Math.cos(angle) > 0.3) textAnchor = "start";
          if (Math.cos(angle) < -0.3) textAnchor = "end";

          return (
            <g key={i}>
              <text
                x={lx}
                y={ly - 2}
                textAnchor={textAnchor}
                fontSize="10"
                fontWeight="800"
                fill="#22352B"
                className="font-sans"
              >
                {item.short}
              </text>
              <text
                x={lx}
                y={ly + 10}
                textAnchor={textAnchor}
                fontSize="9.5"
                fontWeight="700"
                fill="#486B5A"
                className="font-sans"
              >
                Skor: {scoreText} / 4.0
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
