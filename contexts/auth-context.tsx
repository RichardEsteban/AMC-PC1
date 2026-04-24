'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// Types
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  budget: number;
  year: number;
  enabled: boolean;
}

export interface ConsolidatedReport {
  id: string;
  projectId: string;
  year: number;
  period: string;
  reportType: 'financial' | 'physical';
  data: Record<string, any>;
  fileName: string;
  createdAt: Date;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  action: string;
  reportId?: string;
  userId: string;
  timestamp: Date;
  details: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  projects: Project[];
  reports: ConsolidatedReport[];
  logs: AuditLog[];
  addReport: (report: ConsolidatedReport) => void;
  addLog: (log: AuditLog) => void;
  getReportsByFilters: (filters: {
    type?: 'financial' | 'physical';
    year?: number;
    period?: string;
    projectId?: string;
  }) => ConsolidatedReport[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock data
const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-001',
    name: 'Consolidado de proyectos',
    code: 'CONS-2024',
    budget: 5000000,
    year: 2024,
    enabled: true,
  },
];

const MOCK_USERS = [
  { id: 'user-001', email: 'admin@example.com', password: 'admin123', name: 'Admin User' },
  { id: 'user-002', email: 'report@example.com', password: 'report123', name: 'Reportero' },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<ConsolidatedReport[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500));

    const mockUser = MOCK_USERS.find((u) => u.email === email && u.password === password);

    if (!mockUser) {
      return { success: false, error: 'Credenciales inválidas' };
    }

    const userData: User = {
      id: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
    };

    setUser(userData);

    // Add login log
    setLogs((prev) => [
      ...prev,
      {
        id: `log-${Date.now()}`,
        action: 'LOGIN',
        userId: userData.id,
        timestamp: new Date(),
        details: `Usuario ${userData.email} inició sesión`,
      },
    ]);

    return { success: true };
  }, []);

  const logout = useCallback(() => {
    if (user) {
      setLogs((prev) => [
        ...prev,
        {
          id: `log-${Date.now()}`,
          action: 'LOGOUT',
          userId: user.id,
          timestamp: new Date(),
          details: `Usuario ${user.email} cerró sesión`,
        },
      ]);
    }
    setUser(null);
  }, [user]);

  const addReport = useCallback((report: ConsolidatedReport) => {
    setReports((prev) => [...prev, report]);
  }, []);

  const addLog = useCallback((log: AuditLog) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  const getReportsByFilters = useCallback(
    (filters: {
      type?: 'financial' | 'physical';
      year?: number;
      period?: string;
      projectId?: string;
    }) => {
      return reports.filter((report) => {
        if (filters.type && report.reportType !== filters.type) return false;
        if (filters.year && report.year !== filters.year) return false;
        if (filters.period && report.period !== filters.period) return false;
        if (filters.projectId && report.projectId !== filters.projectId) return false;
        return true;
      });
    },
    [reports]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    projects: MOCK_PROJECTS,
    reports,
    logs,
    addReport,
    addLog,
    getReportsByFilters,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
