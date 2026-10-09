'use client';

import React, { useState } from 'react';
import { Expense, ExpenseCategory, Member } from '@/types';
import { CATEGORIES_CONFIG } from '@/lib/constants';
import { formatVND } from '@/lib/settlement-algorithm';
import {
  Search,
  Filter,
  Edit2,
  Trash2,
  Receipt,
  Calendar,
  UserCheck,
  ChevronRight,
} from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  members: Member[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenAddExpense: () => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({
  expenses,
  members,
  onEditExpense,
  onDeleteExpense,
  onOpenAddExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPayer, setFilterPayer] = useState<string>('ALL');
  const [filterCat, setFilterCat] = useState<string>('ALL');

  const memberMap = new Map(members.map((m) => [m.id, m]));

  const filteredExpenses = expenses.filter((exp) => {
    const matchSearch =
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.note && exp.note.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchPayer = filterPayer === 'ALL' || exp.payerId === filterPayer;
    const matchCat = filterCat === 'ALL' || exp.category === filterCat;
    return matchSearch && matchPayer && matchCat;
  });

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-6 text-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <span>Danh sách khoản chi ({expenses.length})</span>
          </h2>
          <p className="text-xs text-slate-400">Các khoản chi tiêu của kỳ hiện tại</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search bar */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm khoản chi..."
              className="w-full sm:w-40 bg-slate-950 border border-slate-800 rounded-xl py-1.5 pl-8 pr-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Filter by Payer */}
          <select
            value={filterPayer}
            onChange={(e) => setFilterPayer(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả người chi</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.avatar} {m.name}
              </option>
            ))}
          </select>

          {/* Filter by Category */}
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">Tất cả danh mục</option>
            {(Object.keys(CATEGORIES_CONFIG) as ExpenseCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORIES_CONFIG[cat].icon} {CATEGORIES_CONFIG[cat].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Expense Items List */}
      <div className="mt-4 space-y-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center text-2xl mb-3">
              🍃
            </div>
            <p className="text-sm font-semibold text-slate-400">
              {expenses.length === 0
                ? 'Chưa có khoản chi nào trong kỳ này!'
                : 'Không tìm thấy khoản chi phù hợp với bộ lọc.'}
            </p>
            {expenses.length === 0 && (
              <button
                onClick={onOpenAddExpense}
                className="mt-3 text-xs px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold transition"
              >
                + Thêm khoản chi đầu tiên
              </button>
            )}
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const payer = memberMap.get(exp.payerId);
            const catConfig = CATEGORIES_CONFIG[exp.category] || CATEGORIES_CONFIG.OTHER;
            const benCount = exp.beneficiaryIds ? exp.beneficiaryIds.length : members.length;
            const splitAmount = Math.round(exp.amount / benCount);

            return (
              <div
                key={exp.id}
                className="bg-slate-950/60 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-3 transition group"
              >
                {/* Left: Category Icon & Details */}
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 ${catConfig.bg}`}
                  >
                    {catConfig.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-200 text-sm sm:text-base truncate">
                        {exp.title}
                      </h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 font-medium shrink-0">
                        {catConfig.label}
                      </span>
                    </div>

                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-400 mt-1">
                      {/* Payer */}
                      <span className="flex items-center gap-1">
                        <span className="text-slate-500">Chi bởi:</span>
                        <strong className="text-slate-200 font-semibold flex items-center gap-0.5">
                          <span>{payer?.avatar}</span>
                          <span>{payer?.name}</span>
                        </strong>
                      </span>

                      <span>•</span>

                      {/* Beneficiaries count */}
                      <span className="text-slate-400">
                        Chia {benCount} người ({formatVND(splitAmount)}/người)
                      </span>

                      <span>•</span>

                      {/* Date */}
                      <span className="text-slate-500">
                        {new Date(exp.date).toLocaleDateString('vi-VN')}
                      </span>
                    </div>

                    {exp.note && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                        Ghi chú: {exp.note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Amount & Actions */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-base sm:text-lg font-black text-emerald-400">
                      {formatVND(exp.amount)}
                    </p>
                    {/* Avatars of beneficiaries */}
                    <div className="flex items-center justify-end -space-x-1 mt-0.5">
                      {exp.beneficiaryIds.map((benId) => {
                        const m = memberMap.get(benId);
                        if (!m) return null;
                        return (
                          <span
                            key={benId}
                            title={`Chia cho ${m.name}`}
                            className="w-4 h-4 rounded-full bg-slate-800 text-[9px] flex items-center justify-center border border-slate-900 shadow-sm"
                          >
                            {m.avatar}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  {/* Edit / Delete Buttons */}
                  <div className="flex items-center gap-1 opacity-80 sm:opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onEditExpense(exp)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Chỉnh sửa"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                      title="Xóa khoản chi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
