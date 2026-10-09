'use client';

import React from 'react';
import { Expense, Member, UserAccount } from '@/types';
import { calculateBalances, calculatePairwiseDebts, formatVND } from '@/lib/settlement-algorithm';
import { CATEGORIES_CONFIG } from '@/lib/constants';
import {
  PlusCircle,
  QrCode,
  TrendingUp,
  CreditCard,
  ArrowRight,
  Sparkles,
  Receipt,
  Scale,
  CheckCircle2,
} from 'lucide-react';

interface HomeTabProps {
  members: Member[];
  expenses: Expense[];
  currentUser: UserAccount | null;
  onOpenAddExpense: () => void;
  onNavigateToTab: (tab: 'OVERVIEW' | 'EXPENSES' | 'DEBTS' | 'PAYMENT') => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  members,
  expenses,
  currentUser,
  onOpenAddExpense,
  onNavigateToTab,
}) => {
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgPerPerson = totalSpend > 0 ? totalSpend / (members.length || 4) : 0;
  const debts = calculatePairwiseDebts(members, expenses);
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const balances = calculateBalances(members, expenses);

  // User's specific debt status
  const currentMemberId = currentUser?.memberId;
  const myDebtsToPay = debts.filter((d) => d.fromMemberId === currentMemberId);
  const myDebtsToReceive = debts.filter((d) => d.toMemberId === currentMemberId);

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/30 text-slate-100 relative overflow-hidden shadow-xl">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">👋</span>
              <h2 className="text-lg sm:text-xl font-black text-slate-100">
                Xin chào, {currentUser?.displayName || 'Thành viên'}!
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-md">
              Kỳ hiện tại có <strong className="text-emerald-400">{expenses.length} khoản chi</strong> với tổng số tiền <strong className="text-emerald-400">{formatVND(totalSpend)}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenAddExpense}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-95"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>+ Thêm Chi Tiêu Mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => onNavigateToTab('OVERVIEW')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer group transition"
        >
          <div>
            <p className="text-xs font-medium text-slate-400">Tổng chi cả nhóm</p>
            <p className="text-xl font-black text-emerald-400 mt-0.5">
              {formatVND(totalSpend)}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 group-hover:text-emerald-400 transition flex items-center gap-1">
              <span>Xem tổng quan</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('DEBTS')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer group transition"
        >
          <div>
            <p className="text-xs font-medium text-slate-400">Lệnh chuyển tiền</p>
            <p className="text-xl font-black text-amber-400 mt-0.5">
              {debts.length} giao dịch
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 group-hover:text-amber-400 transition flex items-center gap-1">
              <span>Xem công nợ 1-1</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => onNavigateToTab('PAYMENT')}
          className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex items-center justify-between cursor-pointer group transition"
        >
          <div>
            <p className="text-xs font-medium text-slate-400">Thanh toán VietQR</p>
            <p className="text-base font-bold text-slate-200 mt-0.5">
              Quét mã tức thì
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5 group-hover:text-teal-400 transition flex items-center gap-1">
              <span>Mở cổng QR</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Personalized Action Box for Logged in Member */}
      {currentMemberId && (myDebtsToPay.length > 0 || myDebtsToReceive.length > 0) && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <span>🎯</span>
            <span>Nhiệm vụ thanh toán của bạn:</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Need to pay */}
            {myDebtsToPay.map((d) => {
              const toMem = memberMap.get(d.toMemberId);
              return (
                <div
                  key={d.id}
                  onClick={() => onNavigateToTab('PAYMENT')}
                  className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between cursor-pointer hover:bg-rose-500/15 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{toMem?.avatar}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        Cần trả cho {toMem?.name}
                      </p>
                      <p className="text-[10px] text-rose-400">Bấm để quét mã VietQR</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-rose-400 font-mono">
                    {formatVND(d.amount)}
                  </span>
                </div>
              );
            })}

            {/* Need to receive */}
            {myDebtsToReceive.map((d) => {
              const fromMem = memberMap.get(d.fromMemberId);
              return (
                <div
                  key={d.id}
                  onClick={() => onNavigateToTab('PAYMENT')}
                  className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between cursor-pointer hover:bg-emerald-500/15 transition"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{fromMem?.avatar}</span>
                    <div>
                      <p className="text-xs font-bold text-slate-200">
                        {fromMem?.name} cần trả bạn
                      </p>
                      <p className="text-[10px] text-emerald-400">Nhận qua STK của bạn</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-400 font-mono">
                    +{formatVND(d.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Activity List Preview */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Khoản chi gần đây</span>
          </h3>
          <button
            onClick={() => onNavigateToTab('EXPENSES')}
            className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
          >
            <span>Xem tất cả ({expenses.length})</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="divide-y divide-slate-800/60 mt-2">
          {expenses.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">
              Chưa có khoản chi nào. Bấm nút <strong>&quot;+ Thêm Chi Tiêu Mới&quot;</strong> để bắt đầu!
            </div>
          ) : (
            expenses.slice(0, 3).map((exp) => {
              const payer = memberMap.get(exp.payerId);
              const catConfig = CATEGORIES_CONFIG[exp.category] || CATEGORIES_CONFIG.OTHER;
              return (
                <div key={exp.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-lg">{catConfig.icon}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-200 truncate">{exp.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {payer?.name} chi • {new Date(exp.date).toLocaleDateString('vi-VN')}
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-emerald-400 font-mono shrink-0">
                    {formatVND(exp.amount)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
