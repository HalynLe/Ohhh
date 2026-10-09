'use client';

import React, { useState, useEffect } from 'react';
import { Expense, ExpenseCategory, Member } from '@/types';
import { CATEGORIES_CONFIG } from '@/lib/constants';
import { formatVND } from '@/lib/settlement-algorithm';
import { X, Check, DollarSign, Tag, Users, Calendar, AlertCircle } from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<Expense, 'id'>, editId?: string) => void;
  members: Member[];
  editExpense?: Expense | null;
}

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000, 1000000];

const SUGGESTIONS = [
  'Ăn trưa / Tối',
  'Cà phê / Trà sữa',
  'Lẩu / Nướng',
  'Grab / Xăng xe',
  'Vé xem phim',
  'Mua đồ siêu thị',
  'Tiền phòng / Khách sạn',
  'Điện / Nước / Wifi',
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  members,
  editExpense,
}) => {
  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [payerId, setPayerId] = useState(members[0]?.id || '');
  const [beneficiaryIds, setBeneficiaryIds] = useState<string[]>(members.map((m) => m.id));
  const [category, setCategory] = useState<ExpenseCategory>('FOOD');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editExpense) {
      setTitle(editExpense.title);
      setAmountStr(editExpense.amount.toString());
      setPayerId(editExpense.payerId);
      setBeneficiaryIds(
        editExpense.beneficiaryIds && editExpense.beneficiaryIds.length > 0
          ? editExpense.beneficiaryIds
          : members.map((m) => m.id)
      );
      setCategory(editExpense.category);
      setDate(editExpense.date.split('T')[0]);
      setNote(editExpense.note || '');
    } else {
      setTitle('');
      setAmountStr('');
      setPayerId(members[0]?.id || '');
      setBeneficiaryIds(members.map((m) => m.id));
      setCategory('FOOD');
      setDate(new Date().toISOString().split('T')[0]);
      setNote('');
    }
    setError('');
  }, [editExpense, isOpen, members]);

  if (!isOpen) return null;

  const currentAmount = parseFloat(amountStr.replace(/[^0-9]/g, '')) || 0;
  const splitCount = beneficiaryIds.length;
  const amountPerPerson = splitCount > 0 ? Math.round(currentAmount / splitCount) : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(raw);
    setError('');
  };

  const handleAddQuickAmount = (val: number) => {
    const nextVal = currentAmount + val;
    setAmountStr(nextVal.toString());
    setError('');
  };

  const toggleBeneficiary = (mId: string) => {
    if (beneficiaryIds.includes(mId)) {
      if (beneficiaryIds.length === 1) {
        setError('Phải có ít nhất 1 người chia tiền!');
        return;
      }
      setBeneficiaryIds(beneficiaryIds.filter((id) => id !== mId));
    } else {
      setBeneficiaryIds([...beneficiaryIds, mId]);
    }
    setError('');
  };

  const handleSelectAllBeneficiaries = () => {
    setBeneficiaryIds(members.map((m) => m.id));
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tên khoản chi!');
      return;
    }
    if (currentAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ (> 0 đ)!');
      return;
    }
    if (beneficiaryIds.length === 0) {
      setError('Vui lòng chọn ít nhất 1 người chia tiền!');
      return;
    }

    onSave(
      {
        title: title.trim(),
        amount: currentAmount,
        payerId,
        beneficiaryIds,
        category,
        date: new Date(date).toISOString(),
        note: note.trim() || undefined,
      },
      editExpense?.id
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">💸</span>
            <h2 className="font-black text-lg sm:text-xl text-slate-100">
              {editExpense ? 'Chỉnh sửa khoản chi' : 'Thêm khoản chi mới'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Số tiền (VND) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={currentAmount > 0 ? currentAmount.toLocaleString('vi-VN') : ''}
                onChange={handleAmountChange}
                placeholder="0"
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 px-4 text-2xl sm:text-3xl font-black text-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-right pr-14"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">
                VND
              </span>
            </div>

            {/* Quick amount chips */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => handleAddQuickAmount(val)}
                  className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition"
                >
                  +{val >= 1000000 ? `${val / 1000000}M` : `${val / 1000}k`}
                </button>
              ))}
            </div>
          </div>

          {/* Title & Suggestions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Tên khoản chi <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="VD: Tiền lẩu bò, Vé xem phim..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {/* Suggestions */}
            <div className="flex flex-wrap gap-1 mt-2">
              {SUGGESTIONS.slice(0, 4).map((sug) => (
                <button
                  type="button"
                  key={sug}
                  onClick={() => setTitle(sug)}
                  className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Danh mục
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {(Object.keys(CATEGORIES_CONFIG) as ExpenseCategory[]).map((cat) => {
                const conf = CATEGORIES_CONFIG[cat];
                const isSelected = category === cat;
                return (
                  <button
                    type="button"
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition text-xs ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="text-base">{conf.icon}</span>
                    <span className="text-[10px] truncate max-w-full">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Who paid? (Payer) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Ai đã trả tiền? <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {members.map((m) => {
                const isPayer = payerId === m.id;
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => setPayerId(m.id)}
                    className={`p-2.5 rounded-xl border flex items-center gap-2 transition ${
                      isPayer
                        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-500/10'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0"
                      style={{ backgroundColor: `${m.color}30` }}
                    >
                      {m.avatar || '👤'}
                    </div>
                    <span className="text-xs truncate">{m.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split with whom? (Beneficiaries) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Chia cho những ai? ({beneficiaryIds.length}/{members.length})
              </label>
              <button
                type="button"
                onClick={handleSelectAllBeneficiaries}
                className="text-[11px] text-emerald-400 hover:underline font-semibold"
              >
                Chọn tất cả 4 người
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {members.map((m) => {
                const isChecked = beneficiaryIds.includes(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleBeneficiary(m.id)}
                    className={`p-2 rounded-xl border flex items-center justify-between transition ${
                      isChecked
                        ? 'bg-blue-500/15 border-blue-500 text-blue-300 font-medium'
                        : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs">{m.avatar}</span>
                      <span className="text-xs truncate">{m.name}</span>
                    </div>
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center text-[10px] ${
                        isChecked ? 'bg-blue-500 text-white' : 'border border-slate-700'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Split preview banner */}
            {currentAmount > 0 && splitCount > 0 && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Mỗi người chịu ({splitCount} người):
                </span>
                <span className="font-bold text-emerald-400">
                  {formatVND(amountPerPerson)}
                </span>
              </div>
            )}
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Ngày chi
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Ghi chú thêm (Tùy chọn)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Địa chỉ quán, chi tiết..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs sm:text-sm transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs sm:text-sm transition shadow-lg shadow-emerald-500/20"
            >
              {editExpense ? 'Cập nhật' : 'Thêm khoản chi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
