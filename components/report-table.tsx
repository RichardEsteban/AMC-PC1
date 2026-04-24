'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { UploadModal, UploadFormData } from './upload-modal';

// ─── Types ────────────────────────────────────────────────────────────────────
export type Quarter = 'Q1' | 'Q2' | 'Q3' | 'Q4';

export const QUARTERS: { key: Quarter; label: string }[] = [
  { key: 'Q1', label: '1er Trimestre' },
  { key: 'Q2', label: '2do Trimestre' },
  { key: 'Q3', label: '3er Trimestre' },
  { key: 'Q4', label: '4to Trimestre' },
];

export interface UploadedFile {
  name: string;
  reportType?: string;
  date?: string;
  blobUrl: string;
  annexes: { id: string; name: string; blobUrl: string; date?: string }[];
}

export type FilesState = Record<string, UploadedFile>;

// ─── Sub-components ───────────────────────────────────────────────────────────
function PdfDocIcon() {
  return (
    <svg viewBox="0 0 52 62" className="w-11 h-[52px] drop-shadow-sm" fill="none">
      <rect width="52" height="62" rx="5" fill="#1e2a3b" />
      <path d="M36 0L52 16H37a1 1 0 01-1-1V0z" fill="#2d3f56" />
      <path d="M36 0L52 16L36 16Z" fill="#374e6b" />
      <rect x="4" y="34" width="44" height="20" rx="3" fill="#E53E3E" />
      <text x="26" y="49" textAnchor="middle" fill="white" fontSize="10"
        fontWeight="800" fontFamily="Arial, Helvetica, sans-serif" letterSpacing="1.5">
        PDF
      </text>
      <rect x="8" y="22" width="26" height="2" rx="1" fill="white" fillOpacity="0.2" />
      <rect x="8" y="27" width="18" height="2" rx="1" fill="white" fillOpacity="0.12" />
    </svg>
  );
}

function UploadButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group mx-auto flex flex-col items-center justify-center w-[72px] h-[84px] border-2 border-dashed border-gray-300 rounded-xl transition-all duration-200 hover:border-blue-500 hover:bg-blue-50/70 hover:shadow-sm"
    >
      <div className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors duration-200">
        <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
        </svg>
      </div>
      <span className="text-[10px] font-semibold text-gray-400 group-hover:text-blue-500 mt-1.5 tracking-wide transition-colors">
        Agregar PDF
      </span>
    </button>
  );
}

function EmptyCell() {
  return (
    <div className="mx-auto flex items-center justify-center w-[72px] h-[84px]">
      <span className="text-gray-300 text-2xl font-light select-none">—</span>
    </div>
  );
}

// ─── Main ReportTable component ───────────────────────────────────────────────
interface ReportTableProps {
  readOnly?: boolean;
  files: FilesState;
  onFilesChange?: (files: FilesState) => void;
  selectedYear?: number;
}

export function ReportTable({ readOnly = false, files, onFilesChange, selectedYear }: ReportTableProps) {
  void selectedYear;
  const { projects } = useAuth();
  const [hoveredAnnex, setHoveredAnnex] = useState<string | null>(null);

  const fileInputs = useRef<Map<string, HTMLInputElement>>(new Map());
  const annexInput = useRef<HTMLInputElement | null>(null);
  const pendingAnnex = useRef<string | null>(null);
  const editingAnnexId = useRef<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalContext, setModalContext] = useState<{ type: 'main' | 'annex'; k: string; annexId?: string } | null>(null);
  const [activeActionsCell, setActiveActionsCell] = useState<string | null>(null);

  const ck = (id: string, q: Quarter) => `${id}-${q}`;

  const triggerUpload = (k: string) => {
    setModalContext({ type: 'main', k });
    setModalOpen(true);
  };

  const handleModalSubmit = (data: UploadFormData) => {
    if (!modalContext || !onFilesChange) return;
    const { type, k, annexId } = modalContext;
    const blobUrl = URL.createObjectURL(data.file);

    if (type === 'main') {
      onFilesChange({
        ...files,
        [k]: {
          ...files[k],
          name: data.name,
          reportType: data.reportType,
          date: data.date,
          blobUrl,
          annexes: files[k]?.annexes ?? [],
        },
      });
    } else {
      const newAnnex = { id: annexId || Math.random().toString(36).substr(2, 9), name: data.name, blobUrl, date: data.date };
      if (annexId) {
        onFilesChange({
          ...files,
          [k]: {
            ...files[k],
            annexes: files[k].annexes.map(a => a.id === annexId ? newAnnex : a),
          },
        });
      } else {
        onFilesChange({
          ...files,
          [k]: {
            ...files[k],
            annexes: [...(files[k]?.annexes ?? []), newAnnex],
          },
        });
      }
    }
  };

  const handleRemove = (k: string) => {
    if (!onFilesChange) return;
    const next = { ...files };
    if (next[k]?.blobUrl) URL.revokeObjectURL(next[k].blobUrl);
    delete next[k];
    onFilesChange(next);
  };

  const handleAddAnnex = (k: string) => {
    setModalContext({ type: 'annex', k });
    setModalOpen(true);
  };

  const handleEditAnnex = (k: string, annexId: string) => {
    setModalContext({ type: 'annex', k, annexId });
    setModalOpen(true);
  };

  const handleRemoveAnnex = (k: string, annexId: string) => {
    if (!onFilesChange) return;
    const annexToRemove = files[k]?.annexes.find(a => a.id === annexId);
    if (annexToRemove?.blobUrl) URL.revokeObjectURL(annexToRemove.blobUrl);
    
    onFilesChange({
      ...files,
      [k]: {
        ...files[k],
        annexes: files[k].annexes.filter(a => a.id !== annexId),
      },
    });
  };

  const enabledProjects = projects.filter(p => p.enabled);

  // Helper to get initial data for modal
  const getModalInitialData = () => {
    if (!modalContext) return null;
    const { type, k, annexId } = modalContext;
    if (type === 'main' && files[k]) {
      return {
        name: files[k].name,
        reportType: files[k].reportType,
        date: files[k].date,
      };
    }
    if (type === 'annex' && annexId && files[k]) {
      const annex = files[k].annexes.find(a => a.id === annexId);
      if (annex) return { name: annex.name, date: annex.date };
    }
    return null;
  };

  return (
    <div className="w-full">
      {/* Upload Modal */}
      <UploadModal 
        isOpen={modalOpen} 
        onClose={() => {
          setModalOpen(false);
          setModalContext(null);
        }} 
        onSubmit={handleModalSubmit}
        initialData={getModalInitialData()}
        isAnnex={modalContext?.type === 'annex'}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-2xl shadow-xl border border-gray-200/80">
        <table className="w-full border-collapse">
          {/* Header */}
          <thead>
            <tr style={{ background: 'linear-gradient(135deg, #1e2a3b 0%, #2c3e55 100%)' }}>
              <th className="px-7 py-5 text-left text-sm font-bold text-white tracking-wide w-1/4 border-r border-white/10">
                Informe
              </th>
              {QUARTERS.map((q, i) => (
                <th
                  key={q.key}
                  className={`px-4 py-5 text-center text-sm font-bold text-white tracking-wide ${i < QUARTERS.length - 1 ? 'border-r border-white/10' : ''}`}
                >
                  {q.label}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {enabledProjects.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-14 text-gray-400 text-sm bg-white">
                  No hay informes disponibles.
                </td>
              </tr>
            )}

            {enabledProjects.map((project, idx) => (
              <tr
                key={project.id}
                className={`transition-colors duration-150 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} hover:bg-blue-50/20`}
              >
                {/* Informe name */}
                <td className="px-7 py-5 align-middle border-r border-gray-200">
                  <p className="text-sm font-bold text-gray-800 leading-snug">{project.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 font-medium">{project.code}</p>
                </td>

                {/* Quarter cells */}
                {QUARTERS.map((q, qi) => {
                  const k = ck(project.id, q.key);
                  const uf = files[k];
                  return (
                    <td
                      key={q.key}
                      className={`px-3 py-5 text-center align-middle ${qi < QUARTERS.length - 1 ? 'border-r border-gray-200' : ''}`}
                    >
                      {uf ? (
                        /* ── File uploaded ── */
                        /* ── Files container ── */
                        <div className="flex flex-col items-center justify-center gap-6 w-full h-full py-2">
                          {/* ── Main Report ── */}
                          <div className="flex flex-col items-center justify-center gap-2 w-full">
                            <div className="relative flex flex-col items-center text-center">
                              <PdfDocIcon />
                              <p className="text-xs text-gray-800 font-semibold mt-2 max-w-[120px] text-center break-words leading-tight" title={uf.name}>
                                {uf.name}
                              </p>
                              {uf.date && (
                                <p className="text-[9px] text-gray-500 font-medium mt-1">
                                  {uf.date}
                                </p>
                              )}
                            </div>

                            {/* ── EDIT mode actions ── */}
                            {!readOnly && (
                              <div className="flex flex-col gap-[5px] w-[90px]">
                                {activeActionsCell === k ? (
                                  <>
                                    <button
                                      onClick={() => triggerUpload(k)}
                                      className="w-full py-[5px] text-[11px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                                    >
                                      Modificar
                                    </button>
                                    <button
                                      onClick={() => handleRemove(k)}
                                      className="w-full py-[5px] text-[11px] font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 active:scale-95 transition-all shadow-sm"
                                    >
                                      Remover
                                    </button>
                                    <button
                                      onClick={() => handleAddAnnex(k)}
                                      className="w-full py-[5px] text-[11px] font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 active:scale-95 transition-all shadow-sm"
                                    >
                                      + Anexo
                                    </button>
                                    <button
                                      onClick={() => setActiveActionsCell(null)}
                                      className="w-full py-[5px] text-[11px] font-semibold text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 active:scale-95 transition-all shadow-sm mt-1"
                                    >
                                      Cancelar
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => setActiveActionsCell(k)}
                                    className="w-full py-[5px] text-[11px] font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 active:scale-95 transition-all shadow-sm"
                                  >
                                    Editar
                                  </button>
                                )}
                              </div>
                            )}

                            {/* ── READ-ONLY mode: download only ── */}
                            {readOnly && (
                              <div className="flex flex-col gap-[5px] w-[90px]">
                                <a
                                  href={uf.blobUrl}
                                  download={uf.name}
                                  className="w-full py-[5px] text-[11px] font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm text-center inline-block"
                                >
                                  ↓ Descargar
                                </a>
                              </div>
                            )}
                          </div>

                          {/* ── Annexes ── */}
                          {uf.annexes.length > 0 && (
                            <div className="flex flex-col gap-4 pt-4 border-t border-gray-200/60 w-full items-center mt-2">
                              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-slate-50 px-2 rounded-full border border-gray-200">
                                Anexos
                              </span>
                              <div className="flex flex-row flex-wrap items-center justify-center gap-6 w-full">
                                {uf.annexes.map((a) => (
                                  <div key={a.id} className="flex flex-col items-center justify-center gap-2">
                                    <div className="relative flex flex-col items-center text-center">
                                      <PdfDocIcon />
                                      <p className="text-xs text-gray-800 font-semibold mt-2 max-w-[120px] text-center break-words leading-tight" title={a.name}>
                                        {a.name}
                                      </p>
                                      {a.date && (
                                        <p className="text-[9px] text-gray-500 font-medium mt-1">
                                          {a.date}
                                        </p>
                                      )}
                                      <span className="absolute -top-2 -right-2 px-1.5 py-0.5 rounded bg-amber-500 text-white text-[8px] font-bold shadow">
                                        ANEXO
                                      </span>
                                    </div>

                                    {!readOnly && (
                                      <div className="flex flex-col gap-[5px] w-[90px]">
                                        {activeActionsCell === `${k}-annex-${a.id}` ? (
                                          <>
                                            <button
                                              onClick={() => handleEditAnnex(k, a.id)}
                                              className="w-full py-[5px] text-[11px] font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow-sm"
                                            >
                                              Modificar
                                            </button>
                                            <button
                                              onClick={() => handleRemoveAnnex(k, a.id)}
                                              className="w-full py-[5px] text-[11px] font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 active:scale-95 transition-all shadow-sm"
                                            >
                                              Remover
                                            </button>
                                            <button
                                              onClick={() => setActiveActionsCell(null)}
                                              className="w-full py-[5px] text-[11px] font-semibold text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 active:scale-95 transition-all shadow-sm mt-1"
                                            >
                                              Cancelar
                                            </button>
                                          </>
                                        ) : (
                                          <button
                                            onClick={() => setActiveActionsCell(`${k}-annex-${a.id}`)}
                                            className="w-full py-[5px] text-[11px] font-semibold text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 active:scale-95 transition-all shadow-sm"
                                          >
                                            Editar
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {readOnly && (
                                      <div className="flex flex-col gap-[5px] w-[90px]">
                                        <a
                                          href={a.blobUrl}
                                          download={a.name}
                                          className="w-full py-[5px] text-[11px] font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-sm text-center inline-block"
                                        >
                                          ↓ Descargar
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ── Empty cell ── */
                        readOnly
                          ? <EmptyCell />
                          : <UploadButton onClick={() => triggerUpload(k)} />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
