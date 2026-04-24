'use client';

import { useState } from 'react';
import { ReportTable, FilesState } from './report-table';

type ActiveView = 'register' | 'visualize';

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR - i);

// ─── Sidebar card item ────────────────────────────────────────────────────────
interface SideCardProps {
  number: string;
  action: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  accentColor: string;
  accentBg: string;
}

function SideCard({ number, action, description, icon, active, onClick, accentColor, accentBg }: SideCardProps) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full text-left rounded-2xl p-4 transition-all duration-300 border-2 group
        ${active
          ? 'border-transparent shadow-xl scale-[1.02]'
          : 'border-gray-200/80 bg-white/70 hover:border-gray-300 hover:shadow-md hover:scale-[1.01]'
        }
      `}
      style={active ? { background: 'linear-gradient(145deg, #1e2a3b 0%, #2c3e55 100%)' } : {}}
    >
      {/* Number + icon row */}
      <div className="flex items-center justify-between mb-3">
        <span className={`text-xs font-black tracking-[0.2em] ${active ? 'text-white/40' : 'text-gray-300'}`}>
          {number}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm transition-all duration-200"
          style={{
            background: active ? 'rgba(255,255,255,0.12)' : accentBg,
          }}
        >
          <span style={{ color: active ? 'white' : accentColor }}>{icon}</span>
        </div>
      </div>

      {/* Action label */}
      <p className={`text-[13px] font-extrabold mb-1 uppercase tracking-wide leading-tight ${active ? 'text-white' : 'text-gray-700'}`}>
        {action}
      </p>

      {/* Description */}
      <p className={`text-[11px] leading-snug ${active ? 'text-blue-200' : 'text-gray-400 group-hover:text-gray-500'}`}>
        {description}
      </p>

      {/* Active indicator bar */}
      {active && (
        <div className="mt-3 h-0.5 rounded-full bg-white/20" />
      )}
    </button>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const UploadIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
  </svg>
);

const ViewIcon = (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
      d="M9 17v-2m3 2v-4m3 4v-6M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  // ← Shared state lifted here so both views see the same files
  const [files, setFiles] = useState<FilesState>({});

  return (
    <div className="flex min-h-screen" style={{ background: 'linear-gradient(150deg, #f0f4f8 0%, #e6ecf3 100%)' }}>

      {/* ══════════════════════════════════════════
          SIDEBAR — new card design
      ══════════════════════════════════════════ */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: 'linear-gradient(180deg, #f7f9fc 0%, #edf1f7 100%)', boxShadow: '3px 0 16px rgba(30,42,59,0.08)' }}>

        {/* Brand header */}
        <div className="px-5 pt-6 pb-5">
          <div className="flex items-center gap-3 mb-1">
            <div>
              <p className="font-black text-gray-900 text-sm leading-tight tracking-tight uppercase">CONCURSO DE PROYECTOS DE INVESTIGACIÓN</p>
            </div>
          </div>
        </div>

        {/* Thin separator */}
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-4" />

        {/* Nav cards */}
        <nav className="px-4 flex flex-col gap-2 flex-1 mt-2">
          {['ACCESO', 'POSTULACIÓN', 'SEGUIMIENTO', 'REPORTES'].map((moduleName) => {
            const isActive = moduleName === 'REPORTES';
            return (
              <button
                key={moduleName}
                className={`
                  w-full text-left rounded-xl px-4 py-3 transition-all duration-300 font-bold text-xs tracking-wider
                  ${isActive 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30 translate-x-1' 
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'
                  }
                `}
              >
                {moduleName}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 mt-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mb-3" />
          <p className="text-[10px] text-gray-400 font-medium">© {CURRENT_YEAR} Sistema de Reportes</p>
        </div>
      </aside>

      {/* ══════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header className="bg-white border-b border-gray-200/80 shadow-sm px-8 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900 leading-tight">
              Gestión de Reportes
            </h1>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-8 overflow-auto">
          <ReportTable
            readOnly={false}
            files={files}
            onFilesChange={setFiles}
            selectedYear={selectedYear}
          />
        </main>
      </div>
    </div>
  );
}
