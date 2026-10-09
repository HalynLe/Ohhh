'use client';

import React from 'react';
import { Home, BarChart3, Receipt, Scale, QrCode } from 'lucide-react';

export type AppTab = 'HOME' | 'OVERVIEW' | 'EXPENSES' | 'DEBTS' | 'PAYMENT';

interface TabNavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  expenseCount: number;
  debtCount: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  expenseCount,
  debtCount,
}) => {
  const tabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'HOME', label: 'Trang chủ', icon: <Home className="w-4 h-4" /> },
    { id: 'OVERVIEW', label: 'Tổng quan', icon: <BarChart3 className="w-4 h-4" /> },
    {
      id: 'EXPENSES',
      label: 'Chi tiết',
      icon: <Receipt className="w-4 h-4" />,
      badge: expenseCount,
    },
    {
      id: 'DEBTS',
      label: 'Công nợ',
      icon: <Scale className="w-4 h-4" />,
      badge: debtCount > 0 ? debtCount : undefined,
    },
    {
      id: 'PAYMENT',
      label: 'Thanh toán QR',
      icon: <QrCode className="w-4 h-4" />,
    },
  ];

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 backdrop-blur-md shadow-lg">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`py-2 px-1 sm:px-3 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-xs font-bold transition relative ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <span className={isActive ? 'text-slate-950' : 'text-emerald-400'}>
                {tab.icon}
              </span>
              <span className="truncate text-[10px] sm:text-xs">{tab.label}</span>

              {tab.badge !== undefined && tab.badge > 0 && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold leading-tight ${
                    isActive
                      ? 'bg-slate-950 text-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
