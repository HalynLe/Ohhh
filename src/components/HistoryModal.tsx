'use client';

import React, { useState } from 'react';
import { SettlementPeriod, Member } from '@/types';
import { formatVND } from '@/lib/settlement-algorithm';
import { X, History, Calendar, CheckCircle2, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SettlementPeriod[];
  members: Member[];
  onDeleteHistoryItem?: (id: string) => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  members,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl text-slate-100 my-auto max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-100">
                Lịch Sử Các Kỳ Chốt Sổ ({history.length})
              </h2>
              <p className="text-xs text-slate-400">Các đợt kết toán chi tiêu đã hoàn tất</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History List Body */}
        <div className="overflow-y-auto py-4 space-y-3 flex-1 pr-1">
          {history.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-xl mb-2">
                📜
              </div>
              <p className="text-sm font-semibold text-slate-400">Chưa có kỳ kết toán nào trong quá khứ</p>
              <p className="text-xs text-slate-500 mt-1">Khi bạn bấm &quot;Chốt sổ &amp; Bắt đầu kỳ mới&quot;, kỳ đó sẽ lưu tại đây.</p>
            </div>
          ) : (
            history.map((period) => {
              const isExpanded = expandedId === period.id;
              return (
                <div
                  key={period.id}
                  className="bg-slate-950 border border-slate-800/90 rounded-2xl p-4 transition"
                >
                  <div
                    onClick={() => toggleExpand(period.id)}
                    className="flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-200 text-sm sm:text-base">
                          {period.title}
                        </h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Đã chốt
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(period.settledAt || period.endDate).toLocaleDateString('vi-VN')}
                        <span>•</span>
                        <span>{period.expenses.length} khoản chi</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Tổng chi</p>
                        <p className="text-sm sm:text-base font-black text-emerald-400">
                          {formatVND(period.totalAmount)}
                        </p>
                      </div>
                      <div className="text-slate-500">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-3 animate-fadeIn">
                      {/* Debts summary */}
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                          Lệnh chuyển tiền đã chốt ({period.debts.length})
                        </h5>
                        <div className="space-y-1.5">
                          {period.debts.map((debt, idx) => {
                            const from = memberMap.get(debt.fromMemberId)?.name || 'Thành viên';
                            const to = memberMap.get(debt.toMemberId)?.name || 'Thành viên';
                            return (
                              <div
                                key={idx}
                                className="bg-slate-900/80 rounded-xl p-2.5 flex items-center justify-between text-xs"
                              >
                                <div className="flex items-center gap-1.5 font-medium text-slate-300">
                                  <span>{from}</span>
                                  <ArrowRight className="w-3 h-3 text-emerald-400" />
                                  <span className="text-emerald-300 font-semibold">{to}</span>
                                </div>
                                <span className="font-bold text-amber-400">
                                  {formatVND(debt.amount)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Expenses included in this period */}
                      <div>
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                          Các khoản chi trong kỳ
                        </h5>
                        <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                          {period.expenses.map((exp) => (
                            <div
                              key={exp.id}
                              className="flex items-center justify-between py-1 border-b border-slate-900 text-slate-400"
                            >
                              <span className="truncate">{exp.title}</span>
                              <span className="font-semibold text-slate-200 shrink-0">
                                {formatVND(exp.amount)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
