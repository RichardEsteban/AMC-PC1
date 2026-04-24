'use client';

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/auth-context';

const VALID_PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'ANUAL'];
const CURRENT_YEAR = new Date().getFullYear();

export function ReportVisualization() {
  const { projects, reports, addLog, user } = useAuth();
  const [filters, setFilters] = useState({
    type: '' as 'financial' | 'physical' | '',
    year: CURRENT_YEAR,
    period: '',
    projectId: '',
  });

  const [sortBy, setSortBy] = useState<'date' | 'project' | 'amount'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredReports = useMemo(() => {
    let result = reports;

    if (filters.type) {
      result = result.filter((r) => r.reportType === filters.type);
    }

    if (filters.year) {
      result = result.filter((r) => r.year === filters.year);
    }

    if (filters.period) {
      result = result.filter((r) => r.period === filters.period);
    }

    if (filters.projectId) {
      result = result.filter((r) => r.projectId === filters.projectId);
    }

    // Sort
    result.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'date') {
        compareValue = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'project') {
        const projectA = projects.find((p) => p.id === a.projectId)?.name || '';
        const projectB = projects.find((p) => p.id === b.projectId)?.name || '';
        compareValue = projectA.localeCompare(projectB);
      } else if (sortBy === 'amount') {
        compareValue = (a.data.amount || 0) - (b.data.amount || 0);
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return result;
  }, [filters, reports, projects, sortBy, sortOrder]);

  const handleFilterChange = (field: string, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Log filter action
    addLog({
      id: `log-${Date.now()}`,
      action: 'FILTER_REPORTS',
      userId: user?.id || 'unknown',
      timestamp: new Date(),
      details: `Filtrado por ${field}: ${value}`,
    });
  };

  const handleSort = (newSortBy: 'date' | 'project' | 'amount') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('asc');
    }
  };

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || 'N/A';
  };

  const getTotalAmount = () => {
    return filteredReports.reduce((sum, r) => sum + (r.data.amount || 0), 0);
  };

  return (
    <div className="w-full space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">Visualizar Reportes Consolidados</h2>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Reporte
            </label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos</option>
              <option value="financial">Financiero</option>
              <option value="physical">Físico</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Año
            </label>
            <input
              type="number"
              value={filters.year}
              onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              min="2020"
              max={CURRENT_YEAR}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Período
            </label>
            <select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos</option>
              {VALID_PERIODS.map((period) => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proyecto
            </label>
            <select
              value={filters.projectId}
              onChange={(e) => handleFilterChange('projectId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Todos</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary */}
      {filteredReports.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Reportes encontrados</p>
              <p className="text-2xl font-bold text-gray-800">{filteredReports.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Monto total</p>
              <p className="text-2xl font-bold text-green-600">
                ${getTotalAmount().toLocaleString('es-ES', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Reports Table */}
      {filteredReports.length > 0 ? (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('project')}>
                  Proyecto {sortBy === 'project' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                  Período / Año
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('amount')}>
                  Monto {sortBy === 'amount' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSort('date')}>
                  Fecha {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">
                  Archivo
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report, index) => (
                <tr key={report.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {getProjectName(report.projectId)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      report.reportType === 'financial'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {report.reportType === 'financial' ? 'Financiero' : 'Físico'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-800">
                    {report.period} / {report.year}
                  </td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">
                    ${(report.data.amount || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(report.createdAt).toLocaleDateString('es-ES')}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className="text-blue-600 font-medium cursor-pointer hover:underline">
                      {report.fileName}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <p className="text-gray-600">No hay reportes que coincidan con los filtros seleccionados.</p>
        </div>
      )}
    </div>
  );
}
