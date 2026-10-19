import * as XLSX from "xlsx";

export const runtime = "edge";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const className = id ? `Kelas_${id.toUpperCase()}` : "Kelas";

    const wb = XLSX.utils.book_new();

    const headers = [
      "NISN",
      "Nama_Lengkap",
      "Nama_Panggilan",
      "Jenis_Kelamin",
      "Kelompok_Diferensiasi",
      "Catatan_Khusus",
    ];

    const exampleRows = [
      ["0134567801", "Ahmad Zaki Al-Fatih", "Zaki", "L", "Kelompok Reguler", "Tertarik sains dan berhitung"],
      ["0134567802", "Aisyah Humaira Putri", "Aisyah", "P", "Kelompok Pengayaan", "Literasi tinggi, gemar membaca"],
      ["0134567803", "Bilal Habibi Pratama", "Bilal", "L", "Kelompok Intervensi", "Perlu bimbingan regulasi diri"],
      ["0134567804", "Clarissa Kayla Azzahra", "Clarissa", "P", "Kelompok Reguler", "Mandiri dan tekun"],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...exampleRows]);

    ws["!cols"] = [
      { wch: 16 }, // NISN
      { wch: 28 }, // Nama_Lengkap
      { wch: 16 }, // Nama_Panggilan
      { wch: 14 }, // Jenis_Kelamin (L/P)
      { wch: 24 }, // Kelompok_Diferensiasi
      { wch: 36 }, // Catatan_Khusus
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");

    const excelBuffer = XLSX.write(wb, { type: "array", bookType: "xlsx" });

    return new Response(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="template_siswa_${className}.xlsx"`,
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
