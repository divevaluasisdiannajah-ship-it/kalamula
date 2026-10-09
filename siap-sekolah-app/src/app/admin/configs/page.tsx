"use client";

import { useEffect, useState, useCallback } from "react";
import {
  SlidersHorizontal,
  PencilSimple,
  ListChecks,
  Warning,
  FloppyDisk,
  X,
  Plus,
  CaretRight,
} from "@phosphor-icons/react";
import type { AssessmentConfig, Indicator, RedFlag } from "@/types";

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
  const [expandedPos, setExpandedPos] = useState<number | null>(null);

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
    } catch { /* offline */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConfigs(); }, [loadConfigs]);

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
    } catch { alert("Gagal menyimpan perubahan"); }
    finally { setSaving(false); }
  };

  // ─── Indicator CRUD ───────────────────────────────────────
  const addIndicator = () => {
    const posNum = editMode || 1;
    const newId = `${posNum}.${editIndicators.length + 1}`;
    setEditIndicators([...editIndicators, {
      id: newId, label: "", description: "",
      score_descriptors: { 1: "", 2: "", 3: "", 4: "" },
    }]);
  };

  const updateIndicator = (idx: number, field: string, value: string) => {
    const updated = [...editIndicators];
    if (field === "label") updated[idx] = { ...updated[idx], label: value };
    else if (field === "description") updated[idx] = { ...updated[idx], description: value };
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
    else if (field === "severity") updated[idx] = { ...updated[idx], severity: value as "critical" | "moderate" };
    setEditRedFlags(updated);
  };

  const removeRedFlag = (idx: number) => {
    setEditRedFlags(editRedFlags.filter((_, i) => i !== idx));
  };

  const scoreLabels: Record<number, string> = { 1: "BM", 2: "MB", 3: "MM", 4: "MK" };
  const scoreColors: Record<number, string> = {
    1: "text-[#565C58] bg-[#FAF8F5] border border-[#E5E0D8]",
    2: "text-[#8C4620] bg-[#FAF0E8] border border-[#F2D8C7]",
    3: "text-[#3D7A5A] bg-[#F0F4F1] border border-[#D4E2D8]",
    4: "text-[#1E2320] bg-[#E2EBE5] border border-[#C2D6C8] font-bold",
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 font-sans">
      {/* Header */}
      <div>
        <h1 className="font-brand text-2xl font-bold text-[#1E2320] tracking-tight">Rubrik Asesmen</h1>
        <p className="text-xs sm:text-sm text-[#565C58] mt-0.5">
          Kelola indikator dan catatan perhatian khusus untuk setiap pos observasi
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#565C58] text-xs font-medium animate-pulse">Memuat konfigurasi...</div>
      ) : configs.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 sm:p-12 text-center border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)]">
          <SlidersHorizontal weight="light" size={44} className="text-[#787F7A] mx-auto mb-3" />
          <p className="text-[#1E2320] font-bold text-base">Belum Ada Rubrik Asesmen</p>
          <p className="text-xs text-[#565C58] mt-1 mb-4">
            Konfigurasi rubrik untuk Pos 1 s.d. Pos 5 belum dimuat atau belum dibuat.
          </p>
          <button
            onClick={loadConfigs}
            className="h-11 bg-[#C9733B] hover:bg-[#B8632E] text-white font-bold px-6 text-xs sm:text-sm rounded-xl shadow-xs transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
          >
            Muat Ulang Rubrik
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {configs.map((cfg) => {
            const isExpanded = expandedPos === cfg.pos_number;
            const isEditing = editMode === cfg.pos_number;

            return (
              <div key={cfg.id} className="bg-white rounded-2xl border border-[#E8E2D8] shadow-[0_4px_20px_-2px_rgba(30,35,32,0.04)] overflow-hidden transition-all hover:shadow-[0_8px_24px_-2px_rgba(30,35,32,0.08)]">
                {/* Pos Header */}
                <button
                  onClick={() => setExpandedPos(isExpanded ? null : cfg.pos_number)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-[#FAF8F5] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#F0F4F1] text-[#3D7A5A] flex items-center justify-center shadow-xs flex-shrink-0 font-bold text-xs border border-[#D4E2D8]">
                      <span>P{cfg.pos_number}</span>
                    </div>
                    <div>
                      <p className="font-bold text-sm sm:text-base text-[#1E2320]">{cfg.pos_name}</p>
                      <p className="text-xs text-[#565C58] mt-0.5">
                        {cfg.indicators.length} indikator &bull; {cfg.red_flags.length} catatan perhatian khusus
                      </p>
                    </div>
                  </div>
                  <CaretRight
                    weight="bold"
                    size={17}
                    className={`text-[#787F7A] transition-transform duration-200 ${
                      isExpanded ? "rotate-90 text-[#1E2320]" : ""
                    }`}
                  />
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1 space-y-4 border-t border-[#FAF8F5]">
                    {/* Description */}
                    {cfg.pos_description && (
                      <p className="text-xs text-[#565C58] italic bg-[#FAF8F5] p-3.5 rounded-xl border border-[#E8E2D8] leading-relaxed">
                        &ldquo;{cfg.pos_description}&rdquo;
                      </p>
                    )}

                    {/* Action buttons */}
                    {!isEditing && (
                      <div>
                        <button
                          onClick={() => startEdit(cfg)}
                          className="h-10 bg-[#C9733B] hover:bg-[#B8632E] text-white font-bold px-4 text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95 focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                        >
                          <PencilSimple weight="light" size={15} />
                          <span>Edit Rubrik</span>
                        </button>
                      </div>
                    )}

                    {/* Indicators */}
                    <div>
                      <h4 className="text-xs font-bold text-[#1E2320] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <ListChecks weight="light" size={17} className="text-[#3D7A5A]" />
                        <span>Indikator Capaian Belajar</span>
                      </h4>
                      <div className="space-y-3">
                        {(isEditing ? editIndicators : cfg.indicators).map((ind, idx) => (
                          <div key={ind.id} className="bg-[#FAF8F5] rounded-2xl p-4 border border-[#E8E2D8] space-y-2.5">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-[#3D7A5A] font-bold px-2 py-0.5 bg-[#F0F4F1] rounded-lg border border-[#D4E2D8]">{ind.id}</span>
                                  <input
                                    value={ind.label}
                                    onChange={(e) => updateIndicator(idx, "label", e.target.value)}
                                    placeholder="Label indikator"
                                    className="flex-1 h-10 rounded-xl px-3 text-xs bg-white text-[#1E2320] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
                                  />
                                  <button
                                    onClick={() => removeIndicator(idx)}
                                    className="text-[#C9733B] hover:text-[#B8632E] p-2 bg-white rounded-xl border border-[#F2D8C7] cursor-pointer"
                                    aria-label="Hapus Indikator"
                                  >
                                    <X weight="light" size={15} />
                                  </button>
                                </div>
                                <input
                                  value={ind.description}
                                  onChange={(e) => updateIndicator(idx, "description", e.target.value)}
                                  placeholder="Deskripsi indikator"
                                  className="w-full h-10 rounded-xl px-3 text-xs bg-white text-[#1E2320] border border-[#E5E0D8] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
                                />
                                <div className="grid grid-cols-2 gap-1.5 pt-1">
                                  {([1, 2, 3, 4] as const).map((score) => (
                                    <div key={score} className={`rounded-xl p-2.5 ${scoreColors[score]}`}>
                                      <span className="text-[10px] font-bold block mb-0.5">
                                        Skor {score} ({scoreLabels[score]})
                                      </span>
                                      <input
                                        value={ind.score_descriptors[score]}
                                        onChange={(e) => updateScoreDescriptor(idx, score, e.target.value)}
                                        placeholder={`Deskripsi skor ${score}`}
                                        className="w-full text-[11px] bg-transparent border-0 focus:outline-none text-[#1E2320]"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-mono text-[#3D7A5A] font-bold px-2 py-0.5 bg-[#F0F4F1] rounded-lg border border-[#D4E2D8]">{ind.id}</span>
                                  <p className="text-xs sm:text-sm font-bold text-[#1E2320]">{ind.label}</p>
                                </div>
                                <p className="text-xs text-[#565C58] ml-8 mb-2 leading-relaxed">{ind.description}</p>
                                <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                  {([1, 2, 3, 4] as const).map((score) => (
                                    <div key={score} className={`rounded-xl px-2.5 py-1.5 ${scoreColors[score]}`}>
                                      <span className="text-[10px] font-bold">{score} ({scoreLabels[score]}): </span>
                                      <span className="text-[10px] leading-tight">{ind.score_descriptors[score]}</span>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                        ))}

                        {isEditing && (
                          <button
                            onClick={addIndicator}
                            className="w-full h-11 bg-[#F0F4F1] text-[#3D7A5A] rounded-xl text-xs font-bold border border-[#D4E2D8] hover:bg-[#D4E2D8] transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                          >
                            <Plus weight="light" size={15} />
                            <span>Tambah Indikator</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Red Flags */}
                    <div>
                      <h4 className="text-xs font-bold text-[#1E2320] uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                        <Warning weight="light" size={17} className="text-[#C9733B]" />
                        <span>Sinyal Kebutuhan Pendampingan (Catatan Khusus)</span>
                      </h4>
                      <div className="space-y-2">
                        {(isEditing ? editRedFlags : cfg.red_flags).map((rf, idx) => (
                          <div key={rf.id} className="bg-[#FAF0E8] rounded-xl p-3 border border-[#F2D8C7]">
                            {isEditing ? (
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                <input
                                  value={rf.label}
                                  onChange={(e) => updateRedFlag(idx, "label", e.target.value)}
                                  placeholder="Deskripsi catatan perhatian"
                                  className="flex-1 h-10 rounded-xl px-3 text-xs bg-white text-[#1E2320] border border-[#F2D8C7] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
                                />
                                <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                                  <select
                                    value={rf.severity}
                                    onChange={(e) => updateRedFlag(idx, "severity", e.target.value)}
                                    className="h-10 rounded-xl px-3 text-xs bg-white font-bold text-[#1E2320] border border-[#F2D8C7] focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2 focus-visible:outline-none"
                                  >
                                    <option value="critical">Critical</option>
                                    <option value="moderate">Moderate</option>
                                  </select>
                                  <button
                                    onClick={() => removeRedFlag(idx)}
                                    className="text-[#C9733B] hover:text-[#B8632E] p-2 bg-white rounded-xl border border-[#F2D8C7] cursor-pointer"
                                    aria-label="Hapus Red Flag"
                                  >
                                    <X weight="light" size={15} />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  rf.severity === "critical" ? "bg-[#FAF0E8] text-[#C9733B] border border-[#F2D8C7] font-black" : "bg-[#FAF8F5] text-[#565C58] border border-[#E5E0D8]"}`}>
                                  {rf.severity.toUpperCase()}
                                </span>
                                <span className="text-xs text-[#1E2320] font-medium">{rf.label}</span>
                              </div>
                            )}
                          </div>
                        ))}

                        {isEditing && (
                          <button
                            onClick={addRedFlag}
                            className="w-full h-11 bg-[#FAF0E8] text-[#C9733B] rounded-xl text-xs font-bold border border-[#F2D8C7] hover:bg-[#F7EAE5] transition-colors flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                          >
                            <Plus weight="light" size={15} />
                            <span>Tambah Catatan Khusus</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Save/Cancel Buttons */}
                    {isEditing && (
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={cancelEdit}
                          className="flex-1 h-11 bg-[#FAF8F5] hover:bg-[#EBE6DF] text-[#1E2320] text-xs font-bold rounded-xl border border-[#E5E0D8] transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                        >
                          Batal
                        </button>
                        <button
                          onClick={() => saveConfig(cfg)}
                          disabled={saving}
                          className="flex-1 h-11 bg-[#1E2320] hover:bg-[#2C332E] text-white text-xs font-bold rounded-xl shadow-xs transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#5C7C68] focus-visible:ring-offset-2"
                        >
                          <FloppyDisk weight="light" size={16} />
                          <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
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
