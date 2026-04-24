'use client';

import { useState, useRef, useEffect } from 'react';

export interface UploadFormData {
  name: string;
  reportType: string;
  date: string;
  file: File;
}

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UploadFormData) => void;
  initialData?: { name: string; reportType?: string; date?: string } | null;
  isAnnex?: boolean;
}

export function UploadModal({ isOpen, onClose, onSubmit, initialData, isAnnex }: UploadModalProps) {
  const [name, setName] = useState('');
  const [reportType, setReportType] = useState('Físico/Financiero');
  const [date, setDate] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
      setReportType(initialData?.reportType || 'Físico/Financiero');
      setDate(initialData?.date || new Date().toISOString().split('T')[0]);
      setFile(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !file) return;
    onSubmit({ name, reportType, date, file });
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!name) {
        setName(selectedFile.name);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-bold text-gray-800">{isAnnex ? 'Subir Anexo' : 'Subir Informe Principal'}</h2>
          <p className="text-xs text-gray-500 mt-0.5">Complete los datos y adjunte el archivo PDF.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          {/* Nombre del archivo */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Nombre del Archivo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Informe de Avance Q1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              required
            />
          </div>

          {/* Tipo de Informe */}
          {!isAnnex && (
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
                Tipo de Informe
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow bg-white"
                required={!isAnnex}
              >
                <option value="Físico/Financiero">Físico/Financiero</option>
                <option value="Técnico">Técnico</option>
              </select>
            </div>
          )}

          {/* Fecha */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Fecha de Emisión
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow"
              required
            />
          </div>

          {/* Archivo PDF */}
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">
              Documento PDF
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`w-full border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50'
                }`}
            >
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />

              {file ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-emerald-700 text-center truncate w-full px-4">
                    {file.name}
                  </p>
                  <p className="text-[10px] text-emerald-600/80 font-medium mt-1 uppercase tracking-wider">
                    Archivo seleccionado
                  </p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-sm font-semibold text-gray-600">Click para seleccionar archivo</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Solo formato PDF</p>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!name || !file}
              className="flex-1 px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm"
            >
              {isAnnex ? 'Guardar Anexo' : 'Guardar Informe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
