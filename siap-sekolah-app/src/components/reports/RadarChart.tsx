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
  size = 220,
  className = "",
}: RadarChartProps) {
  const center = size / 2;
  const radius = 66; // Balanced radius for 6-axis hexagon with label room
  const levels = [1, 2, 3]; // Scores 1 to 3
  const numAxes = 6;

  // 6 Fondasi Transisi PAUD-SD Kemendikbudristek (Sesuai Gambar Referensi)
  const axes: { id: FoundationNumber; code: string; title: string }[] = [
    { id: 1, code: "P1", title: "Agama & Karakter" },
    { id: 2, code: "P2", title: "Sosial-Bahasa" },
    { id: 3, code: "P3", title: "Emosi & Regulasi" },
    { id: 4, code: "P4", title: "Kognitif & Nalar" },
    { id: 5, code: "P5", title: "Fisik & Mandiri" },
    { id: 6, code: "P6", title: "Refleksi & Cerita" },
  ];

  // Helper to compute (x, y) coordinates for an axis angle and distance
  const getCoordinates = (index: number, value: number, maxVal = 3) => {
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
    const clampedScore = Math.max(1, Math.min(3, rawScore));
    return getCoordinates(index, clampedScore);
  });

  const polygonPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className={`inline-flex flex-col items-center justify-center ${className}`}>
      <svg
        width={size + 70}
        height={size + 40}
        viewBox={`-35 -20 ${size + 70} ${size + 40}`}
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

          const isOuter = level === 3;

          return (
            <polygon
              key={level}
              points={levelPoints}
              fill={isOuter ? "#FAF8F5" : "transparent"}
              stroke="#DDD7CE"
              strokeWidth="1"
              strokeDasharray={isOuter ? "none" : "2,2"}
            />
          );
        })}

        {/* Target 2.5 Hexagon (Terracotta Dashed Sesuai Gambar) */}
        {(() => {
          const targetPoints = axes
            .map((_, i) => {
              const { x, y } = getCoordinates(i, 2.5);
              return `${x},${y}`;
            })
            .join(" ");
          return (
            <polygon
              points={targetPoints}
              fill="none"
              stroke="#9B3F18"
              strokeWidth="1.2"
              strokeDasharray="3,3"
            />
          );
        })()}

        {/* Axis Spokes */}
        {axes.map((_, i) => {
          const { x, y } = getCoordinates(i, 3);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="#CBD3CD"
              strokeWidth="1"
            />
          );
        })}

        {/* Data Hexagon Polygon Fill & Outline */}
        <polygon
          points={polygonPath}
          fill="rgba(72, 107, 90, 0.22)"
          stroke="#486B5A"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />

        {/* Data Point Dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={4}
            fill="#486B5A"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        ))}

        {/* 6 Axis Labels & Scores (3 Baris: Kode, Nama, Skor) */}
        {axes.map((item, i) => {
          const { angle } = getCoordinates(i, 3);
          const rawScore = getScoreForAxis(item.id);
          const scoreVal =
            rawScore !== null && rawScore !== undefined && !isNaN(rawScore)
              ? Math.min(3.0, Math.max(1.0, rawScore))
              : null;
          const scoreText = scoreVal !== null ? scoreVal.toFixed(1) : "-";

          let textAnchor: "start" | "end" | "middle" = "middle";
          let lx = center + (radius + 16) * Math.cos(angle);
          let ly = center + (radius + 16) * Math.sin(angle);

          if (i === 0) {
            // Top (P1)
            textAnchor = "middle";
            ly = center - radius - 12;
          } else if (i === 1) {
            // Top Right (P2)
            textAnchor = "start";
            lx += 4;
            ly -= 4;
          } else if (i === 2) {
            // Bottom Right (P3)
            textAnchor = "start";
            lx += 4;
            ly += 6;
          } else if (i === 3) {
            // Bottom (P4)
            textAnchor = "middle";
            ly = center + radius + 18;
          } else if (i === 4) {
            // Bottom Left (P5)
            textAnchor = "end";
            lx -= 4;
            ly += 6;
          } else if (i === 5) {
            // Top Left (P6)
            textAnchor = "end";
            lx -= 4;
            ly -= 4;
          }

          return (
            <g key={i}>
              <text
                x={lx}
                y={ly - 9}
                textAnchor={textAnchor}
                fontSize="9"
                fontWeight="800"
                fill="#22352B"
                className="font-sans"
              >
                {item.code}
              </text>
              <text
                x={lx}
                y={ly}
                textAnchor={textAnchor}
                fontSize="8.5"
                fontWeight="600"
                fill="#565C58"
                className="font-sans"
              >
                {item.title}
              </text>
              <text
                x={lx}
                y={ly + 9}
                textAnchor={textAnchor}
                fontSize="9"
                fontWeight="800"
                fill="#22352B"
                className="font-mono"
              >
                {scoreText}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
