'use client';

import { useState } from 'react';
import { useAuth, ConsolidatedReport } from '@/contexts/auth-context';

const VALID_PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'ANUAL'];
const CURRENT_YEAR = new Date().getFullYear();

export function ReportRegistration() {
  const { user, projects, reports, addReport, addLog } = useAuth();
  const [step, setStep] = useState<'project' | 'period' | 'type' | 'details'>('project');
  const [selectedProject, setSelectedProject] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [reportType, setReportType] = useState<'financial' | 'physical'>('financial');
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleReset = () => {
    setStep('project');
    setSelectedProject('');
    setSelectedPeriod('');
    setReportType('financial');
    setFormData({});
    setFileName('');
    setError('');
    setSuccess('');
  };

  const handleProjectSelect = () => {
    if (!selectedProject) {
      setError('Por favor selecciona un proyecto');
      return;
    }

    const project = projects.find((p) => p.id === selectedProject);
    if (!project) {
      setError('Proyecto no encontrado');
      return;
    }

    if (!project.enabled) {
      setError('El proyecto seleccionado no está habilitado');
      return;
    }

    setError('');
    setStep('period');
  };

  const handlePeriodSelect = () => {
    if (!selectedPeriod) {
      setError('Por favor selecciona un período');
      return;
    }

    if (!VALID_PERIODS.includes(selectedPeriod)) {
      setError('Período no válido');
      return;
    }

    // Check for duplicates
    const existingReport = reports.find(
      (r) =>
        r.projectId === selectedProject &&
        r.period === selectedPeriod &&
        r.year === CURRENT_YEAR &&
        r.reportType === reportType
    );

    if (existingReport) {
      setError('Ya existe un reporte para este proyecto, período y tipo');
      return;
    }

    // Check budget
    const project = projects.find((p) => p.id === selectedProject);
    if (project) {
      const projectReports = reports.filter((r) => r.projectId === selectedProject);
      const totalSpent = projectReports.reduce(
        (sum, r) => sum + (r.data.expenditure || 0),
        0
      );

      if (totalSpent + (formData.expenditure || 0) > project.budget) {
        setError('Presupuesto insuficiente para este reporte');
        return;
      }
    }

    setError('');
    setStep('type');
  };

  const handleTypeSelect = () => {
    setError('');
    setStep('details');
  };

  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = ['pdf', 'xlsx', 'xls', 'csv'];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      setError('Archivo no válido. Se aceptan: PDF, XLSX, XLS, CSV');
      return;
    }

    setFileName(file.name);
    setError('');
  };

  const handleSubmit = () => {
    const project = projects.find((p) => p.id === selectedProject);

    if (!project) {
      setError('Proyecto no encontrado');
      return;
    }

    if (!fileName) {
      setError('Por favor adjunta un archivo');
      return;
    }

    // Final validations
    if (!formData.amount || formData.amount <= 0) {
      setError('Monto debe ser mayor a 0');
      return;
    }

    if (!formData.description || formData.description.trim() === '') {
      setError('Descripción requerida');
      return;
    }

    const newReport: ConsolidatedReport = {
      id: `report-${Date.now()}`,
      projectId: selectedProject,
      year: CURRENT_YEAR,
      period: selectedPeriod,
      reportType,
      data: formData,
      fileName,
      createdAt: new Date(),
      createdBy: user?.id || 'unknown',
    };

    addReport(newReport);

    // Add audit log
    addLog({
      id: `log-${Date.now()}`,
      action: 'CREATE_REPORT',
      reportId: newReport.id,
      userId: user?.id || 'unknown',
      timestamp: new Date(),
      details: `Reporte creado para ${project.name}, período ${selectedPeriod}`,
    });

    setSuccess(`Reporte registrado exitosamente: ${fileName}`);
    setTimeout(() => {
      handleReset();
    }, 2000);
  };

  const enabledProjects = projects.filter((p) => p.enabled);

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Registrar Reporte Consolidado</h2>

      {/* Step 1: Project Selection */}
      {step === 'project' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Proyecto
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Elige un proyecto --</option>
              {enabledProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}) - Presupuesto: ${p.budget.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          <button
            onClick={handleProjectSelect}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Step 2: Period Selection */}
      {step === 'period' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Proyecto: <span className="font-bold">{projects.find((p) => p.id === selectedProject)?.name}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Período
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Elige un período --</option>
              {VALID_PERIODS.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>
          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('project')}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400"
            >
              Atrás
            </button>
            <button
              onClick={handlePeriodSelect}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Report Type Selection */}
      {step === 'type' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Proyecto: <span className="font-bold">{projects.find((p) => p.id === selectedProject)?.name}</span>
          </p>
          <p className="text-gray-600">
            Período: <span className="font-bold">{selectedPeriod}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Reporte
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="financial"
                  checked={reportType === 'financial'}
                  onChange={(e) => setReportType(e.target.value as 'financial')}
                  className="mr-2"
                />
                <span className="text-gray-700">Reporte Financiero</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="physical"
                  checked={reportType === 'physical'}
                  onChange={(e) => setReportType(e.target.value as 'physical')}
                  className="mr-2"
                />
                <span className="text-gray-700">Reporte Físico</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setStep('period')}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400"
            >
              Atrás
            </button>
            <button
              onClick={handleTypeSelect}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Details and File Upload */}
      {step === 'details' && (
        <div className="space-y-4">
          <p className="text-gray-600">
            Proyecto: <span className="font-bold">{projects.find((p) => p.id === selectedProject)?.name}</span>
          </p>
          <p className="text-gray-600">
            Período: <span className="font-bold">{selectedPeriod}</span> | Tipo:{' '}
            <span className="font-bold">{reportType === 'financial' ? 'Financiero' : 'Físico'}</span>
          </p>

          <div className="border-t pt-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto / Cantidad
                </label>
                <input
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => handleFormChange('amount', parseFloat(e.target.value))}
                  placeholder="0.00"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  placeholder="Describe los detalles del reporte..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjuntar Archivo (PDF, XLSX, XLS, CSV)
                </label>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.xlsx,.xls,.csv"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {fileName && <p className="mt-2 text-sm text-green-600">Archivo: {fileName}</p>}
              </div>
            </div>
          </div>

          {error && <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
          {success && <div className="p-3 bg-green-100 text-green-700 rounded text-sm">{success}</div>}

          <div className="flex gap-3">
            <button
              onClick={() => setStep('type')}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-medium hover:bg-gray-400"
            >
              Atrás
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
            >
              Registrar Reporte
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
