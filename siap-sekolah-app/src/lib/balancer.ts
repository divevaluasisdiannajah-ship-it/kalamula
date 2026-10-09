/**
 * SIAP SEKOLAH — Smart Class Balancer Engine
 * 
 * Distribution Logic: Serpentine / Snake Distribution with 4-Tier Balancing:
 *  1. Hard Constraint: Gender Balance (Target 14 L & 14 P per rombel for 28-student capacity)
 *  2. Priority 1: Red Flag Distribution (evenly spread students with red flag signals)
 *  3. Priority 2: Reading Level Distribution (balance L1-L2 vs L3-L4 proportion)
 *  4. Priority 3: Overall Average Score Balance (Snake sorting: 1A, 1B, 1B, 1A...)
 */

import type {
  StudentProfile,
  ClassBalance,
  ClassPlacement,
  AssignedClass,
  ReadingLevel,
} from "@/types";
import { generateId } from "@/lib/db";

export interface BalanceResult {
  classA: ClassBalance;
  classB: ClassBalance;
  overallBalanceScore: number;
  warnings: string[];
  placements: ClassPlacement[];
}

/**
 * Score composite weight for sorting before snake distribution:
 * Higher score = higher priority placement.
 */
function calculateCompositeRank(profile: StudentProfile): number {
  let rank = (profile.overall_score || 2.5) * 10;

  // Red flags give priority sorting to be distributed first
  if (profile.has_any_red_flag) {
    rank += 1000;
  }

  // Reading level weight
  const readingWeights: Record<ReadingLevel, number> = {
    L4: 400,
    L3: 300,
    L2: 200,
    L1: 100,
  };
  if (profile.reading_level) {
    rank += readingWeights[profile.reading_level] || 0;
  }

  return rank;
}

/**
 * Serpentine distribution for a cohort of students
 */
function serpentineAssign(
  students: StudentProfile[],
  startWithA: boolean = true
): { classA: StudentProfile[]; classB: StudentProfile[] } {
  const classA: StudentProfile[] = [];
  const classB: StudentProfile[] = [];

  // Snake pattern:
  // startWithA: 0->A, 1->B, 2->B, 3->A, 4->A, 5->B, 6->B, 7->A...
  // startWithB: 0->B, 1->A, 2->A, 3->B, 4->B, 5->A, 6->A, 7->B...
  for (let i = 0; i < students.length; i++) {
    const mod = i % 4;
    let assignToA: boolean;

    if (startWithA) {
      assignToA = mod === 0 || mod === 3;
    } else {
      assignToA = mod === 1 || mod === 2;
    }

    if (assignToA) {
      classA.push(students[i]);
    } else {
      classB.push(students[i]);
    }
  }

  return { classA, classB };
}

/**
 * Main Class Balancer Engine
 */
export function balanceClasses(
  students: StudentProfile[],
  batchId: string
): BalanceResult {
  // Separate by Gender (Hard Constraint)
  const males = students.filter((s) => s.student.gender === "L");
  const females = students.filter((s) => s.student.gender === "P");

  // Sort each gender cohort by composite rank descending
  males.sort((a, b) => calculateCompositeRank(b) - calculateCompositeRank(a));
  females.sort((a, b) => calculateCompositeRank(b) - calculateCompositeRank(a));

  // Distribute Males using Snake pattern starting with A
  const maleSplit = serpentineAssign(males, true);

  // Distribute Females starting with B (counter-balance class with higher male scores)
  const femaleSplit = serpentineAssign(females, false);

  const studentsA = [...maleSplit.classA, ...femaleSplit.classA];
  const studentsB = [...maleSplit.classB, ...femaleSplit.classB];

  // Calculate metrics
  const classA = buildClassBalanceMetrics("1A", studentsA);
  const classB = buildClassBalanceMetrics("1B", studentsB);

  // Warnings check
  const warnings: string[] = [];
  const genderDiff = Math.abs(classA.male_count - classB.male_count);
  if (genderDiff > 2) {
    warnings.push(`Ketidakseimbangan Gender: Selisih ${genderDiff} siswa laki-laki antara 1A dan 1B.`);
  }

  const redFlagDiff = Math.abs(classA.red_flag_count - classB.red_flag_count);
  if (redFlagDiff > 1) {
    warnings.push(`Penyebaran Red Flag: Selisih ${redFlagDiff} anak red flag antara 1A dan 1B.`);
  }

  const scoreDiff = Math.abs(classA.avg_score - classB.avg_score);
  if (scoreDiff > 0.3) {
    warnings.push(`Kesenjangan Rata-rata Skor: Selisih ${scoreDiff.toFixed(2)} antara 1A (${classA.avg_score.toFixed(2)}) dan 1B (${classB.avg_score.toFixed(2)}).`);
  }

  // Calculate overall balance score (100 is ideal)
  let balanceScore = 100;
  balanceScore -= genderDiff * 10;
  balanceScore -= redFlagDiff * 12;
  balanceScore -= Math.round(scoreDiff * 30);
  balanceScore = Math.max(0, Math.min(100, balanceScore));

  classA.balance_score = balanceScore;
  classB.balance_score = balanceScore;

  // Build placements array
  const now = new Date().toISOString();
  const placements: ClassPlacement[] = [
    ...studentsA.map((s) => ({
      id: generateId(),
      student_id: s.student.id,
      batch_id: batchId,
      assigned_class: "1A" as AssignedClass,
      algorithm_version: "serpentine-v1.0",
      balance_score: balanceScore,
      manual_override: false,
      override_by: null,
      override_reason: null,
      override_at: null,
      assigned_at: now,
      updated_at: now,
    })),
    ...studentsB.map((s) => ({
      id: generateId(),
      student_id: s.student.id,
      batch_id: batchId,
      assigned_class: "1B" as AssignedClass,
      algorithm_version: "serpentine-v1.0",
      balance_score: balanceScore,
      manual_override: false,
      override_by: null,
      override_reason: null,
      override_at: null,
      assigned_at: now,
      updated_at: now,
    })),
  ];

  return {
    classA,
    classB,
    overallBalanceScore: balanceScore,
    warnings,
    placements,
  };
}

/**
 * Metric calculator for a specific class roster
 */
export function buildClassBalanceMetrics(
  className: AssignedClass,
  students: StudentProfile[]
): ClassBalance {
  const total = students.length;
  const male_count = students.filter((s) => s.student.gender === "L").length;
  const female_count = students.filter((s) => s.student.gender === "P").length;
  const red_flag_count = students.filter((s) => s.has_any_red_flag).length;

  const validScores = students
    .map((s) => s.overall_score)
    .filter((score): score is number => score !== null && !isNaN(score));

  const avg_score =
    validScores.length > 0
      ? validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length
      : 0;

  const reading_level_distribution: Record<ReadingLevel, number> = {
    L1: 0,
    L2: 0,
    L3: 0,
    L4: 0,
  };

  students.forEach((s) => {
    if (s.reading_level) {
      reading_level_distribution[s.reading_level] =
        (reading_level_distribution[s.reading_level] || 0) + 1;
    }
  });

  return {
    class: className,
    students,
    total,
    male_count,
    female_count,
    red_flag_count,
    avg_score: Number(avg_score.toFixed(2)),
    reading_level_distribution,
    balance_score: 100,
  };
}
