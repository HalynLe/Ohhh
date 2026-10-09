'use client';

import React from 'react';
import { Expense, Member } from '@/types';
import { calculateBalances, formatVND } from '@/lib/settlement-algorithm';
import { TrendingUp, ArrowDownRight, ArrowUpRight, CheckCircle2, QrCode, PlusCircle, CreditCard } from 'lucide-react';

interface BalanceOverviewProps {
  members: Member[];
  expenses: Expense[];
  onOpenAddExpense: () => void;
  onOpenSettlement: () => void;
  onEditMember: (member: Member) => void;
}

export const BalanceOverview: React.FC<BalanceOverviewProps> = ({
  members,
  expenses,
  onOpenAddExpense,
  onOpenSettlement,
  onEditMember,
}) => {
  const balances = calculateBalances(members, expenses);
  const totalSpend = expenses.reduce((sum, e) => sum + e.amount, 0);
  const avgPerPerson = totalSpend > 0 ? totalSpend / (members.length || 4) : 0;

  return (
    <div className="space-y-4">
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

        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg shadow-emerald-950/40">
          <div>
            <p className="text-xs font-medium text-emerald-100">Hành động chính</p>
            <p className="text-base font-bold mt-0.5">Kết toán & Chốt nợ</p>
          </div>
          <button
            onClick={onOpenSettlement}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white text-slate-950 font-bold text-xs hover:bg-emerald-50 transition shadow active:scale-95"
          >
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Kết toán QR</span>
          </button>
        </div>
      </div>

      {/* 4 Members Balance Cards */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tình trạng công nợ 4 thành viên
          </h2>
          <span className="text-xs text-slate-400">Bấm vào thẻ để đổi thông tin ngân hàng</span>
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
                {/* Top indicator color bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: member.color }}
                />

                <div>
                  {/* Avatar & Header */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 shadow-inner"
                        style={{ backgroundColor: `${member.color}20`, border: `2px solid ${member.color}` }}
                      >
                        {member.avatar || '👤'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <h3 className="font-bold text-slate-100 text-sm truncate group-hover:text-emerald-400 transition">
                            {member.name}
                          </h3>
                          {member.isAdmin && (
                            <span className="text-[10px] px-1 py-0.2 bg-amber-500/20 text-amber-300 font-semibold rounded">
                              Admin
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 truncate">
                          {member.bankName} • {member.accountNumber ? `${member.accountNumber.slice(-4)}` : 'Chưa có STK'}
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
                        <p className="text-base sm:text-lg font-black text-emerald-400 mt-0.5">
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
                        <p className="text-base sm:text-lg font-black text-rose-400 mt-0.5">
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
                        <p className="text-base sm:text-lg font-bold text-slate-300 mt-0.5">
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
                    <span className="font-semibold text-slate-200">{formatVND(b.totalPaid)}</span>
                  </div>
                  <div>
                    <span>Dùng: </span>
                    <span className="font-semibold text-slate-200">{formatVND(b.totalConsumed)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onOpenAddExpense}
          className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition active:scale-[0.98]"
        >
          <PlusCircle className="w-5 h-5 text-slate-950" />
          <span>Thêm khoản chi mới</span>
        </button>

        <button
          onClick={onOpenSettlement}
          className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm flex items-center justify-center gap-2 transition active:scale-[0.98]"
          title="Kết toán và tạo mã VietQR"
        >
          <QrCode className="w-5 h-5 text-emerald-400" />
          <span className="hidden sm:inline">Chốt sổ & VietQR</span>
        </button>
      </div>
    </div>
  );
};
