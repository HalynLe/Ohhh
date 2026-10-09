'use client';

import React from 'react';
import { Expense, Member } from '@/types';
import { calculateBalances, calculatePairwiseDebts, formatVND } from '@/lib/settlement-algorithm';
import { CATEGORIES_CONFIG } from '@/lib/constants';
import {
  TrendingUp,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CreditCard,
  Building,
  PieChart,
  Scale,
  ArrowRight,
} from 'lucide-react';

interface OverviewTabProps {
  members: Member[];
  expenses: Expense[];
  onEditMember: (member: Member) => void;
  onNavigateToDebts?: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  members,
  expenses,
  onEditMember,
  onNavigateToDebts,
}) => {
  const balances = calculateBalances(members, expenses);
  const debts = calculatePairwiseDebts(members, expenses);
  const memberMap = new Map(members.map((m) => [m.id, m]));
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgPerPerson = totalSpend > 0 ? totalSpend / (members.length || 4) : 0;

  // Category Breakdown calculation
  const categoryTotals: Record<string, number> = {};
  for (const exp of expenses) {
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Top Banner Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Tổng chi kỳ này</p>
            <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5">
              {formatVND(totalSpend)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Trung bình / người (4 người)</p>
            <p className="text-xl sm:text-2xl font-black text-blue-400 mt-0.5">
              {formatVND(avgPerPerson)}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-slate-400">Số khoản chi tiêu</p>
            <p className="text-xl sm:text-2xl font-black text-purple-400 mt-0.5">
              {expenses.length} khoản
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
            <PieChart className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4 Members Balance Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tình trạng công nợ 4 thành viên
          </h2>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Bấm vào thẻ để đổi thông tin ngân hàng
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {members.map((member) => {
            const b = balances[member.id] || {
              totalPaid: 0,
              totalConsumed: 0,
              netBalance: 0,
            };

            const isCreditor = b.netBalance > 0;
            const isDebtor = b.netBalance < 0;
            const isSettled = b.netBalance === 0;

            return (
              <div
                key={member.id}
                onClick={() => onEditMember(member)}
                className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 rounded-2xl p-4 flex flex-col justify-between transition group cursor-pointer relative overflow-hidden"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: member.color }}
                />

                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 shadow-inner"
                        style={{
                          backgroundColor: `${member.color}20`,
                          border: `2px solid ${member.color}`,
                        }}
                      >
                        {member.avatar || '👤'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-bold text-slate-100 text-sm truncate group-hover:text-emerald-400 transition">
                            {member.name}
                          </h3>
                          {member.isAdmin && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-300 font-semibold rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {member.bankName} •{' '}
                          {member.accountNumber
                            ? `${member.accountNumber.slice(-4)}`
                            : 'Chưa có STK'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Net Balance Status */}
                  <div className="mb-3">
                    {isCreditor && (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-0.5">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            Được nhận lại
                          </span>
                        </div>
                        <p className="text-base sm:text-lg font-black text-emerald-400 mt-0.5 font-mono">
                          +{formatVND(b.netBalance)}
                        </p>
                      </div>
                    )}

                    {isDebtor && (
                      <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] text-rose-400 font-medium flex items-center gap-0.5">
                            <ArrowDownRight className="w-3.5 h-3.5" />
                            Cần trả nợ
                          </span>
                        </div>
                        <p className="text-base sm:text-lg font-black text-rose-400 mt-0.5 font-mono">
                          -{formatVND(Math.abs(b.netBalance))}
                        </p>
                      </div>
                    )}

                    {isSettled && (
                      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          Đã cân bằng
                        </div>
                        <p className="text-base sm:text-lg font-bold text-slate-300 mt-0.5 font-mono">
                          0 đ
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub details: Paid vs Consumed */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <div>
                    <span>Đã chi: </span>
                    <span className="font-semibold text-slate-200">
                      {formatVND(b.totalPaid)}
                    </span>
                  </div>
                  <div>
                    <span>Dùng: </span>
                    <span className="font-semibold text-slate-200">
                      {formatVND(b.totalConsumed)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Synchronized Debt Transfers Summary */}
      {debts.length > 0 && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 text-slate-100">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Scale className="w-4 h-4" />
              <span>Các lệnh chuyển tiền cần thực hiện ({debts.length})</span>
            </h3>
            {onNavigateToDebts && (
              <button
                onClick={onNavigateToDebts}
                className="text-xs text-emerald-400 hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>Xem chi tiết &amp; Quét QR</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-2">
            {debts.map((debt) => {
              const fromMem = memberMap.get(debt.fromMemberId);
              const toMem = memberMap.get(debt.toMemberId);
              return (
                <div
                  key={debt.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800/90 flex items-center justify-between gap-2 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm">{fromMem?.avatar}</span>
                    <span className="font-bold text-slate-200 truncate">{fromMem?.name}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-sm">{toMem?.avatar}</span>
                    <span className="font-bold text-emerald-300 truncate">{toMem?.name}</span>
                  </div>

                  <span className="font-black text-amber-400 font-mono text-sm shrink-0">
                    {formatVND(debt.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Breakdown */}
      {Object.keys(categoryTotals).length > 0 && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-4 sm:p-5 text-slate-100">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
            <PieChart className="w-4 h-4 text-emerald-400" />
            <span>Phân loại theo danh mục chi tiêu</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {Object.entries(categoryTotals).map(([cat, amount]) => {
              const config =
                CATEGORIES_CONFIG[cat as keyof typeof CATEGORIES_CONFIG] ||
                CATEGORIES_CONFIG.OTHER;
              const percent = totalSpend > 0 ? Math.round((amount / totalSpend) * 100) : 0;
              return (
                <div
                  key={cat}
                  className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-lg">{config.icon}</span>
                    <span className="font-bold text-slate-200 truncate">{config.label}</span>
                  </div>
                  <p className="font-black text-emerald-400 font-mono text-sm">
                    {formatVND(amount)}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{percent}% tổng chi tiêu</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
