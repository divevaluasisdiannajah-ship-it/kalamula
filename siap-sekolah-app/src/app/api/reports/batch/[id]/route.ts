export const runtime = 'edge';
import { NextResponse } from "next/server";
import { findById } from "@/lib/db";
import { getBatchStudentProfiles } from "@/lib/profiles";
import type { Batch, StudentProfile } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const batch = findById<Batch>("batches", id);

    if (!batch) {
      return NextResponse.json(
        { success: false, error: "Batch tidak ditemukan" },
        { status: 404 }
      );
    }

    const profiles = getBatchStudentProfiles(id);

    // TaRL (Teaching at the Right Level) Literacy Stations
    const tarlGroupA: StudentProfile[] = []; // Pra-Literasi L1 & L2 (Intervensi)
    const tarlGroupB: StudentProfile[] = []; // Penguatan Membaca L3 & L4 (Penguatan)
    const tarlUnassessed: StudentProfile[] = [];

    profiles.forEach((p) => {
      if (p.reading_level === "L1" || p.reading_level === "L2") {
        tarlGroupA.push(p);
      } else if (p.reading_level === "L3" || p.reading_level === "L4") {
        tarlGroupB.push(p);
      } else {
        tarlUnassessed.push(p);
      }
    });

    // Red Flag students
    const redFlagStudents = profiles.filter((p) => p.has_any_red_flag);

    // Pos averages across batch
    const posAverages: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const posCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    profiles.forEach((p) => {
      for (let pos = 1; pos <= 5; pos++) {
        const score = p.pos_scores[pos];
        if (score !== null) {
          posAverages[pos] += score;
          posCounts[pos]++;
        }
      }
    });

    for (let pos = 1; pos <= 5; pos++) {
      posAverages[pos] =
        posCounts[pos] > 0
          ? Number((posAverages[pos] / posCounts[pos]).toFixed(2))
          : 0;
    }

    // Recommendation Package
    const recommendationPackage = {
      tarl: {
        groupA: {
          title: "Kategori Literasi A (Intervensi Pra-Literasi / L1–L2)",
          description: "Fokus pada pengenalan bentuk visual, bunyi huruf (fonik dasar), dan motorik halus jemari.",
          students: tarlGroupA,
          strategies: [
            "Gunakan kartu bergambar (flashcard) dengan asosiasi bunyi konkret (misal: 'A - Apel').",
            "Aktivitas sensorik: melukis huruf di pasir warna atau membentuk huruf dari plastisin.",
            "Latihan cengkeraman pensil fungsional (tripod grasp) dengan krayon segitiga.",
          ],
        },
        groupB: {
          title: "Kategori Literasi B (Penguatan Membaca / L3–L4)",
          description: "Fokus pada kelancaran membaca suku kata KV, kata bermakna, dan pemahaman cerita.",
          students: tarlGroupB,
          strategies: [
            "Pojok baca mandiri dengan buku cerita bergambar bertingkat (graded readers).",
            "Permainan menyusun kartu kata menjadi kalimat sederhana yang utuh.",
            "Tanya jawab inferensial ringan: 'Mengapa tokoh di cerita bersedih?'",
          ],
        },
        unassessed: tarlUnassessed,
      },
      mpls: {
        title: "Panduan Masa Transisi MPLS (2 Minggu Pertama)",
        guidelines: [
          {
            day: "Minggu 1 (Hari 1-3)",
            focus: "Adaptasi Emosi & Pengenalan Lingkungan",
            activity: "Penyambutan ramah di gerbang sekolah, orientasi letak toilet & ruang kelas, serta ice breaking lingkaran.",
          },
          {
            day: "Minggu 1 (Hari 4-5)",
            focus: "Budaya Antre & Kemandirian Self-Care",
            activity: "Simulasi melepas sepatu, merapikan tas, cuci tangan 6 langkah, dan etika meminta bantuan kepada guru.",
          },
          {
            day: "Minggu 2 (Hari 6-8)",
            focus: "Eksplorasi Gerak & Sosialisasi",
            activity: "Permainan estafet bola sederhana di halaman (motorik kasar) dan permainan menyusun balok bersama (kerjasama).",
          },
          {
            day: "Minggu 2 (Hari 9-10)",
            focus: "Pemetaan Minat & Kesepakatan Kelas",
            activity: "Menggambar bebas hal yang disukai, membuat kesepakatan kelas yang ramah anak dengan simbol gambar.",
          },
        ],
      },
      kurikulumMerdeka: {
        title: "Penyesuaian Alur Tujuan Pembelajaran (ATP) Kurikulum Merdeka Fase A",
        points: [
          "Bagi siswa di Kategori Literasi A, tunda target menulis kalimat panjang; utamakan fonik dan ekspresi lisan.",
          "Gunakan diferensiasi proses: lembar kerja bergambar untuk kelompok A dan teks pendek berpola untuk kelompok B.",
          "Integrasikan penilaian formatif non-tes: observasi portofolio gambar dan anekdot bermain.",
        ],
      },
      redFlagIntervention: {
        title: "Strategi Pendampingan Siswa dengan Sinyal Red Flag",
        students: redFlagStudents,
        guidelines: [
          "Duduk di barisan depan dengan akses pandangan jelas ke arah guru.",
          "Gunakan instruksi 1 langkah konkret (bukan multi-instruksi panjang).",
          "Sediakan 'calm-down corner' dengan bantal empuk untuk siswa yang rentan tantrum atau overstimulasi.",
          "Jadwalkan komunikasi personal dengan orang tua dalam 2 minggu pertama untuk menyelaraskan pola asuh di rumah.",
        ],
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        batch,
        totalStudents: profiles.length,
        evaluatedCount: profiles.filter((p) => p.completion_rate === 100).length,
        posAverages,
        recommendationPackage,
        profiles,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

