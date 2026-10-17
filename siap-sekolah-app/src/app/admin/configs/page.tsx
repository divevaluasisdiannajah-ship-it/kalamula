"use client";
export const runtime = 'edge';

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type { AssessmentConfig, Indicator, RedFlag, FoundationNumber } from "@/types";
import { FOUNDATION_LABELS } from "@/types";

interface ConfigParsed extends Omit<AssessmentConfig, "indicators_json" | "red_flags_json"> {
  indicators: Indicator[];
  red_flags: RedFlag[];
}

function parseConfig(cfg: AssessmentConfig): ConfigParsed {
  return {
    ...cfg,
    indicators: JSON.parse(cfg.indicators_json || "[]"),
    red_flags: JSON.parse(cfg.red_flags_json || "[]"),
  };
}

export default function AssessmentConfigPage() {
  const [configs, setConfigs] = useState<ConfigParsed[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedPos, setExpandedPos] = useState<number | null>(1); // Default expand Pos 1

  // Editor state
  const [editMode, setEditMode] = useState<number | null>(null);
  const [editIndicators, setEditIndicators] = useState<Indicator[]>([]);
  const [editRedFlags, setEditRedFlags] = useState<RedFlag[]>([]);
  const [saving, setSaving] = useState(false);

  const loadConfigs = useCallback(async () => {
    try {
      const res = await fetch("/api/configs");
      if (res.ok) {
        const data = await res.json();
        const parsed = (data.data || []).map(parseConfig);
        setConfigs(parsed.sort((a: ConfigParsed, b: ConfigParsed) => a.pos_number - b.pos_number));
      }
    } catch {
      /* offline */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const startEdit = (cfg: ConfigParsed) => {
    setEditMode(cfg.pos_number);
    setEditIndicators(JSON.parse(JSON.stringify(cfg.indicators)));
    setEditRedFlags(JSON.parse(JSON.stringify(cfg.red_flags)));
    setExpandedPos(cfg.pos_number);
  };

  const cancelEdit = () => {
    setEditMode(null);
    setEditIndicators([]);
    setEditRedFlags([]);
  };

  const saveConfig = async (cfg: ConfigParsed) => {
    setSaving(true);
    try {
      await fetch(`/api/configs/${cfg.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indicators_json: JSON.stringify(editIndicators),
          red_flags_json: JSON.stringify(editRedFlags),
        }),
      });
      setEditMode(null);
      loadConfigs();
    } catch {
      alert("Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  // ─── Indicator CRUD ───────────────────────────────────────
  const addIndicator = () => {
    const posNum = editMode || 1;
    const newId = `${posNum}.${editIndicators.length + 1}`;
    // Smart default foundation based on pos
    const defaultFoundation: FoundationNumber =
      posNum === 1 ? 3 : posNum === 2 ? 5 : posNum === 3 ? 4 : posNum === 4 ? 2 : 6;

    setEditIndicators([
      ...editIndicators,
      {
        id: newId,
        label: "",
        description: "",
        foundation: defaultFoundation,
        score_descriptors: { 1: "", 2: "", 3: "", 4: "" },
      },
    ]);
  };

  const updateIndicator = (idx: number, field: string, value: string) => {
    const updated = [...editIndicators];
    if (field === "label") updated[idx] = { ...updated[idx], label: value };
    else if (field === "description") updated[idx] = { ...updated[idx], description: value };
    setEditIndicators(updated);
  };

  const updateIndicatorFoundation = (idx: number, foundation: FoundationNumber) => {
    const updated = [...editIndicators];
    updated[idx] = { ...updated[idx], foundation };
    setEditIndicators(updated);
  };

  const updateScoreDescriptor = (idx: number, score: number, value: string) => {
    const updated = [...editIndicators];
    updated[idx].score_descriptors = { ...updated[idx].score_descriptors, [score]: value };
    setEditIndicators(updated);
  };

  const removeIndicator = (idx: number) => {
    setEditIndicators(editIndicators.filter((_, i) => i !== idx));
  };

  // ─── Red Flag CRUD ────────────────────────────────────────
  const addRedFlag = () => {
    const posNum = editMode || 1;
    const newId = `rf-${posNum}-${editRedFlags.length + 1}`;
    setEditRedFlags([...editRedFlags, { id: newId, label: "", severity: "moderate" }]);
  };

  const updateRedFlag = (idx: number, field: string, value: string) => {
    const updated = [...editRedFlags];
    if (field === "label") updated[idx] = { ...updated[idx], label: value };
    else if (field === "severity")
      updated[idx] = { ...updated[idx], severity: value as "critical" | "moderate" };
    setEditRedFlags(updated);
  };

  const removeRedFlag = (idx: number) => {
    setEditRedFlags(editRedFlags.filter((_, i) => i !== idx));
  };

  const scoreLabels: Record<number, string> = { 1: "BM", 2: "MB", 3: "MM", 4: "MK" };
  const scoreColors: Record<number, string> = {
    1: "text-[#565C58] bg-[#FAF8F5] border border-[#DDD7CE]",
    2: "text-[#8C3713] bg-[#F9E6DC] border border-[#F1CFC0]",
    3: "text-[#486B5A] bg-[#E4EFE9] border border-[#CBE0D4]",
    4: "text-[#22352B] bg-[#E4EFE9] border border-[#486B5A] font-extrabold",
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-5 font-sans">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-1">
        <Link
          href="/admin"
          className="bg-white border border-[#E8E2D8] text-[#22352B] px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-[#FAF8F5] transition flex items-center gap-1 shadow-xs"
        >
          <i className="mdi mdi-chevron-left text-base" />
          <span>Dashboard Admin</span>
        </Link>
        <span className="bg-[#E4EAF2] text-[#36506C] text-[11px] font-extrabold px-2.5 py-0.5 rounded-full">
          RUBRIK ASESMEN
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#22352B] tracking-tight">
          Rubrik &amp; Indikator Asesmen
        </h1>
        <p className="text-xs text-[#565C58] mt-1">
          Kelola deskripsi capaian belajar dan parameter sinyal pendampingan untuk Pos 1 s.d. Pos 5
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#565C58] text-xs font-medium animate-pulse">
          Memuat konfigurasi rubrik...
        </div>
      ) : configs.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-[#E8E2D8]/60 shadow-sm space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center mx-auto">
            <i className="mdi mdi-tune-vertical text-3xl" />
          </div>
          <p className="text-[#22352B] font-extrabold text-base">Belum Ada Rubrik Asesmen</p>
          <p className="text-xs text-[#565C58]">
            Konfigurasi rubrik untuk Pos 1 s.d. Pos 5 belum dimuat.
          </p>
          <button
            onClick={loadConfigs}
            className="bg-[#B85627] hover:bg-[#A34A1F] text-white font-extrabold px-5 py-2.5 text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            Muat Ulang Rubrik
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {configs.map((cfg) => {
            const isExpanded = expandedPos === cfg.pos_number;
            const isEditing = editMode === cfg.pos_number;

            return (
              <div
                key={cfg.id}
                className="bg-white rounded-3xl border border-[#E8E2D8]/60 shadow-sm overflow-hidden transition-all"
              >
                {/* Pos Header */}
                <button
                  type="button"
                  onClick={() => setExpandedPos(isExpanded ? null : cfg.pos_number)}
                  className="w-full p-4.5 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5]/80 transition cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#E4EAF2] text-[#36506C] flex items-center justify-center shadow-xs flex-shrink-0 font-extrabold text-sm">
                      <span>P{cfg.pos_number}</span>
                    </div>
                    <div>
                      <p className="font-extrabold text-base text-[#22352B]">{cfg.pos_name}</p>
                      <p className="text-xs text-[#565C58] mt-0.5">
                        {cfg.indicators.length} indikator &bull; {cfg.red_flags.length} catatan khusus
                      </p>
                    </div>
                  </div>
                  <i
                    className={`mdi mdi-chevron-right text-2xl text-[#787F7A] transition-transform duration-200 ${
                      isExpanded ? "rotate-90 text-[#22352B]" : ""
                    }`}
                  />
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 space-y-4 border-t border-[#FAF8F5]">
                    {/* Description */}
                    {cfg.pos_description && (
                      <p className="text-xs text-[#565C58] italic bg-[#FAF8F5] p-3.5 rounded-2xl border border-[#E8E2D8] leading-relaxed">
                        &ldquo;{cfg.pos_description}&rdquo;
                      </p>
                    )}

                    {/* Edit Trigger & Cetak Lembar Fisik */}
                    {!isEditing && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(cfg)}
                          className="bg-[#B85627] hover:bg-[#A34A1F] text-white font-extrabold px-4 py-2 text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <i className="mdi mdi-pencil-outline text-base" />
                          <span>Edit Rubrik Pos Ini</span>
                        </button>
                        <Link
                          href={`/reports/rubric/${cfg.pos_number}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#FAF8F5] hover:bg-[#EFECE4] text-[#486B5A] border border-[#CBD5D0] font-extrabold px-4 py-2 text-xs rounded-xl shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                          title="Cetak Lembar Observasi Fisik Pos Ini (A4)"
                        >
                          <i className="mdi mdi-printer text-base" />
                          <span>Cetak Lembar Fisik (A4)</span>
                        </Link>
                      </div>
                    )}

                    {/* Indicators */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-extrabold text-[#787F7A] uppercase tracking-wider flex items-center gap-1.5">
                        <i className="mdi mdi-check-all text-base text-[#486B5A]" />
                        <span>Indikator Capaian Belajar</span>
                      </h4>

                      <div className="space-y-3">
                        {(isEditing ? editIndicators : cfg.indicators).map((ind, idx) => (
                          <div
                            key={ind.id}
                            className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E8E2D8] space-y-2.5"
                          >
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-mono text-[#486B5A] font-bold px-2 py-0.5 bg-[#E4EFE9] rounded-lg">
                                    {ind.id}
                                  </span>
                                  <input
                                    value={ind.label}
                                    onChange={(e) => updateIndicator(idx, "label", e.target.value)}
                                    placeholder="Label indikator..."
                                    className="flex-1 min-w-[180px] h-9 rounded-xl px-3 text-xs bg-white text-[#22352B] border border-[#DDD7CE] focus:outline-none"
                                  />
                                  <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-[#DDD7CE]">
                                    <label className="text-[11px] font-extrabold text-[#565C58] whitespace-nowrap">Pondasi:</label>
                                    <select
                                      value={ind.foundation || 1}
                                      onChange={(e) => updateIndicatorFoundation(idx, Number(e.target.value) as FoundationNumber)}
                                      className="h-7 text-xs bg-transparent text-[#22352B] font-bold focus:outline-none cursor-pointer"
                                    >
                                      {([1, 2, 3, 4, 5, 6] as FoundationNumber[]).map((f) => (
                                        <option key={f} value={f}>
                                          P{f}: {FOUNDATION_LABELS[f].short}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeIndicator(idx)}
                                    className="p-1.5 bg-white text-[#8C3713] rounded-xl border border-[#F1CFC0] cursor-pointer hover:bg-[#F9E6DC] transition"
                                  >
                                    <i className="mdi mdi-close text-base" />
                                  </button>
                                </div>
                                <input
                                  value={ind.description}
                                  onChange={(e) => updateIndicator(idx, "description", e.target.value)}
                                  placeholder="Deskripsi fokus pengamatan..."
                                  className="w-full h-9 rounded-xl px-3 text-xs bg-white text-[#22352B] border border-[#DDD7CE] focus:outline-none"
                                />
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                  {([1, 2, 3, 4] as const).map((score) => (
                                    <div key={score} className={`rounded-xl p-2 text-xs ${scoreColors[score]}`}>
                                      <span className="text-[10px] font-bold block">
                                        Skor {score} ({scoreLabels[score]})
                                      </span>
                                      <input
                                        value={ind.score_descriptors[score]}
                                        onChange={(e) => updateScoreDescriptor(idx, score, e.target.value)}
                                        placeholder={`Deskripsi skor ${score}`}
                                        className="w-full text-[11px] bg-transparent border-0 focus:outline-none text-[#22352B] mt-0.5"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-mono text-[#486B5A] font-bold px-2 py-0.5 bg-[#E4EFE9] rounded-lg">
                                    {ind.id}
                                  </span>
                                  <p className="text-xs sm:text-sm font-bold text-[#22352B]">{ind.label}</p>
                                  {ind.foundation && FOUNDATION_LABELS[ind.foundation] && (
                                    <span
                                      className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${FOUNDATION_LABELS[ind.foundation].badgeBg} ${FOUNDATION_LABELS[ind.foundation].badgeText} border border-current/20 flex items-center gap-1 shadow-2xs`}
                                      title={FOUNDATION_LABELS[ind.foundation].name}
                                    >
                                      <i className="mdi mdi-cube-outline text-xs" />
                                      <span>Pondasi {ind.foundation}: {FOUNDATION_LABELS[ind.foundation].short}</span>
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#565C58] ml-7 mb-2 leading-relaxed">
                                  {ind.description}
                                </p>
                                <div className="ml-7 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {([1, 2, 3, 4] as const).map((score) => (
                                    <div key={score} className={`rounded-xl px-2.5 py-1.5 ${scoreColors[score]}`}>
                                      <span className="text-[10px] font-bold">
                                        {score} ({scoreLabels[score]}):{" "}
                                      </span>
                                      <span className="text-[10px] leading-tight font-medium">
                                        {ind.score_descriptors[score]}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}

                        {isEditing && (
                          <button
                            type="button"
                            onClick={addIndicator}
                            className="w-full h-10 bg-[#E4EFE9] text-[#486B5A] rounded-xl text-xs font-bold border border-[#CBE0D4] hover:bg-[#D4E2D8] transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <i className="mdi mdi-plus text-base" />
                            <span>Tambah Indikator</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Red Flags */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-xs font-extrabold text-[#787F7A] uppercase tracking-wider flex items-center gap-1.5">
                        <i className="mdi mdi-alert-outline text-base text-[#8C3713]" />
                        <span>Sinyal Kebutuhan Pendampingan (Catatan Khusus)</span>
                      </h4>

                      <div className="space-y-2">
                        {(isEditing ? editRedFlags : cfg.red_flags).map((rf, idx) => (
                          <div
                            key={rf.id}
                            className="bg-[#FDF7F4] rounded-2xl p-3 border border-[#F1CFC0]"
                          >
                            {isEditing ? (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                  value={rf.label}
                                  onChange={(e) => updateRedFlag(idx, "label", e.target.value)}
                                  placeholder="Deskripsi catatan perhatian khusus..."
                                  className="flex-1 h-9 rounded-xl px-3 text-xs bg-white text-[#22352B] border border-[#F1CFC0] focus:outline-none"
                                />
                                <div className="flex items-center gap-2">
                                  <select
                                    value={rf.severity}
                                    onChange={(e) => updateRedFlag(idx, "severity", e.target.value)}
                                    className="h-9 rounded-xl px-2.5 text-xs bg-white font-bold text-[#22352B] border border-[#F1CFC0] focus:outline-none"
                                  >
                                    <option value="critical">Critical</option>
                                    <option value="moderate">Moderate</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => removeRedFlag(idx)}
                                    className="p-1.5 bg-white text-[#8C3713] rounded-xl border border-[#F1CFC0] cursor-pointer"
                                  >
                                    <i className="mdi mdi-close text-base" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                    rf.severity === "critical"
                                      ? "bg-[#F9E6DC] text-[#8C3713]"
                                      : "bg-[#FAF8F5] text-[#565C58]"
                                  }`}
                                >
                                  {rf.severity.toUpperCase()}
                                </span>
                                <span className="text-xs text-[#22352B] font-semibold">{rf.label}</span>
                              </div>
                            )}
                          </div>
                        ))}

                        {isEditing && (
                          <button
                            type="button"
                            onClick={addRedFlag}
                            className="w-full h-10 bg-[#F9E6DC] text-[#8C3713] rounded-xl text-xs font-bold border border-[#F1CFC0] hover:bg-[#F2D7CA] transition flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <i className="mdi mdi-plus text-base" />
                            <span>Tambah Catatan Khusus</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Save / Cancel Controls */}
                    {isEditing && (
                      <div className="flex gap-2.5 pt-3 border-t border-[#E8E2D8]">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="flex-1 py-2.5 rounded-xl bg-[#F3EFE6] text-[#22352B] text-xs font-bold hover:bg-[#EAE4D8] transition"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => saveConfig(cfg)}
                          disabled={saving}
                          className="flex-1 py-2.5 rounded-xl bg-[#B85627] hover:bg-[#A34A1F] text-white text-xs font-extrabold shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
                        >
                          <i className="mdi mdi-content-save-outline text-base" />
                          <span>{saving ? "Menyimpan..." : "Simpan Rubrik"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
