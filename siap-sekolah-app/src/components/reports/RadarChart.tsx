"use client";

import React from "react";

interface RadarChartProps {
  scores: Record<number, number | null>;
  size?: number;
  className?: string;
}

export function RadarChart({ scores, size = 320, className = "" }: RadarChartProps) {
  const center = size / 2;
  const radius = (size / 2) - 45;
  const levels = [1, 2, 3, 4]; // Scores 1 to 4
  const numAxes = 5;

  const axisLabels = [
    { pos: 1, label: "Emosi & Mandiri" },
    { pos: 2, label: "Motorik Kasar" },
    { pos: 3, label: "Kognitif & Numerasi" },
    { pos: 4, label: "Bahasa & Literasi" },
    { pos: 5, label: "Sosial & Tim" },
  ];

  // Helper to compute (x, y) coordinates for an axis angle and distance
  const getCoordinates = (index: number, value: number, maxVal = 4) => {
    // Angle in radians, starting from top (-pi/2)
    const angle = (Math.PI * 2 / numAxes) * index - Math.PI / 2;
    const r = (value / maxVal) * radius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y, angle };
  };

  // Generate polygon points for data
  const dataPoints = axisLabels.map((item, index) => {
    const rawScore = scores[item.pos] ?? 1;
    // Bound score between 1 and 4
    const clampedScore = Math.max(1, Math.min(4, rawScore));
    return getCoordinates(index, clampedScore);
  });

  const polygonPath = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className={`inline-flex flex-col items-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="overflow-visible"
      >
        {/* Background Level Polygons (Web) */}
        {levels.map((level) => {
          const levelPoints = axisLabels
            .map((_, i) => {
              const { x, y } = getCoordinates(i, level);
              return `${x},${y}`;
            })
            .join(" ");

          return (
            <polygon
              key={level}
              points={levelPoints}
              fill={level === 4 ? "#F5F7F5" : "transparent"}
              stroke="#DDE3DF"
              strokeWidth="1"
              strokeDasharray={level < 4 ? "3,3" : "none"}
            />
          );
        })}

        {/* Axis Lines */}
        {axisLabels.map((_, i) => {
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

        {/* Level Scale Numbers */}
        {levels.map((level) => {
          const { y } = getCoordinates(0, level);
          return (
            <text
              key={level}
              x={center + 6}
              y={y + 4}
              fontSize="9"
              fill="#69736C"
              fontWeight="600"
            >
              {level}
            </text>
          );
        })}

        {/* Data Polygon Fill */}
        <polygon
          points={polygonPath}
          fill="rgba(92, 124, 104, 0.22)"
          stroke="#5C7C68"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Data Point Dots */}
        {dataPoints.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={size <= 220 ? 3.5 : 4.5}
            fill="#5C7C68"
            stroke="#FFFFFF"
            strokeWidth="1.5"
          />
        ))}

        {/* Axis Labels */}
        {axisLabels.map((item, i) => {
          const { x, y, angle } = getCoordinates(i, 4);
          // Offset label slightly outward
          const labelDist = size <= 220 ? 20 : 26;
          const lx = center + (radius + labelDist) * Math.cos(angle);
          const ly = center + (radius + labelDist) * Math.sin(angle);

          const scoreVal = scores[item.pos];
          const scoreText = scoreVal !== null && scoreVal !== undefined ? scoreVal.toFixed(1) : "-";

          let textAnchor: "start" | "end" | "middle" = "middle";
          if (Math.cos(angle) > 0.3) textAnchor = "start";
          if (Math.cos(angle) < -0.3) textAnchor = "end";

          return (
            <g key={i}>
              <text
                x={lx}
                y={ly - (size <= 220 ? 1 : 2)}
                textAnchor={textAnchor}
                fontSize={size <= 220 ? "9.5" : "11"}
                fontWeight="700"
                fill="#151A17"
                className="font-sans"
              >
                {item.label}
              </text>
              <text
                x={lx}
                y={ly + (size <= 220 ? 10 : 13)}
                textAnchor={textAnchor}
                fontSize={size <= 220 ? "8.5" : "10"}
                fontWeight="700"
                fill="#31533C"
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
