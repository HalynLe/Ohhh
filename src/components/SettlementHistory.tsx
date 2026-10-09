'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, History, ChevronDown } from 'lucide-react';
import { Member, SettlementPeriod } from '@/types';
import { formatVND } from '@/lib/settlement-algorithm';

const dateOptions = { timeZone: 'Asia/Ho_Chi_Minh' };
function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa có ngày' : date.toLocaleDateString('vi-VN', dateOptions);
}

function monthOf(period: SettlementPeriod) {
  const date = new Date(period.settledAt || period.endDate);
  if (Number.isNaN(date.getTime())) return 'Chưa xác định tháng';
  const parts = new Intl.DateTimeFormat('vi-VN', { ...dateOptions, month: '2-digit', year: 'numeric' }).formatToParts(date);
  return `${parts.find((part) => part.type === 'month')?.value}/${parts.find((part) => part.type === 'year')?.value}`;
}

export function SettlementHistory({ history, members }: { history: SettlementPeriod[]; members: Member[] }) {
  const [selectedMonth, setSelectedMonth] = useState('ALL');
  const sorted = [...history].sort((a, b) =>
    (Date.parse(b.settledAt || b.endDate) || 0) - (Date.parse(a.settledAt || a.endDate) || 0)
  );
  const months = [...new Set(sorted.map(monthOf))];
  const visible = selectedMonth === 'ALL' ? sorted : sorted.filter((period) => monthOf(period) === selectedMonth);
  const total = visible.reduce((sum, period) => sum + period.totalAmount, 0);

  return (
    <section className="space-y-6 animate-fadeIn">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-emerald-300">
        <ArrowLeft className="w-4 h-4" /> Về trang chi tiêu
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">Các kỳ đã hoàn tất</p>
          <h1 className="text-2xl sm:text-3xl font-black flex items-center gap-3">
            <History className="w-7 h-7 text-purple-400 shrink-0" /> Lịch sử chốt sổ
          </h1>
          <p className="text-sm text-slate-400 mt-2">Xem lại chi tiêu và trạng thái thanh toán tại thời điểm chốt sổ. Các kỳ được nhóm theo tháng chốt.</p>
        </div>
        <label className="text-xs text-slate-400 flex flex-col gap-2 shrink-0">
          Lọc theo tháng chốt sổ
          <select value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-purple-400 focus:outline-none">
            <option value="ALL">Tất cả các tháng</option>
            {months.map((month) => <option key={month} value={month}>{month}</option>)}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <p className="text-xs text-slate-400">Số kỳ đã chốt</p>
          <p className="mt-2 text-2xl font-black">{visible.length}</p>
        </div>
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-5">
          <p className="text-xs text-slate-400">Tổng chi các kỳ đang xem</p>
          <p className="mt-2 text-lg sm:text-2xl font-black text-emerald-400 break-words">{formatVND(total)}</p>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-700 p-10 text-center">
          <CalendarDays className="w-10 h-10 text-slate-500 mx-auto mb-4" />
          <h2 className="font-bold">{history.length === 0 ? 'Chưa có kỳ chốt sổ nào' : 'Không có kỳ chốt sổ trong tháng này'}</h2>
          <p className="mt-2 text-sm text-slate-400">Khi chọn “Chốt sổ & Bắt đầu kỳ mới” ở trang thanh toán, toàn bộ kỳ sẽ tự động được lưu tại đây.</p>
        </div>
      ) : months.filter((month) => selectedMonth === 'ALL' || month === selectedMonth).map((month) => (
        <section key={month} className="space-y-3" aria-label={`Tháng ${month}`}>
          <h2 className="text-base font-bold flex items-center gap-2"><CalendarDays className="w-4 h-4 text-purple-400" /> Tháng {month}</h2>
          {visible.filter((period) => monthOf(period) === month).map((period) => {
            const memberMap = new Map((period.members || members).map((member) => [member.id, member.name]));
            const nameOf = (id: string) => memberMap.get(id) || 'Thành viên cũ';
            return (
              <details key={period.id} className="group rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden">
                <summary className="list-none cursor-pointer p-4 sm:p-5 flex items-center justify-between gap-3 focus-visible:outline-2 focus-visible:outline-purple-400 [&::-webkit-details-marker]:hidden">
                  <div className="min-w-0">
                    <p className="text-xs text-emerald-400 mb-1">Đã chốt · {formatDate(period.settledAt || period.endDate)}</p>
                    <h3 className="font-bold break-words">{period.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{period.expenses.length} khoản chi · {formatDate(period.startDate)} – {formatDate(period.endDate)}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm sm:text-lg font-black text-emerald-400">{formatVND(period.totalAmount)}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400 group-open:rotate-180 transition" />
                  </div>
                </summary>
                <div className="border-t border-slate-800 p-4 sm:p-5 grid lg:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-bold text-sm mb-3">Các khoản chi ({period.expenses.length})</h4>
                    {period.expenses.length === 0 && <p className="text-sm text-slate-500">Kỳ này không có khoản chi.</p>}
                    <ul className="space-y-2">
                      {period.expenses.map((expense) => (
                        <li key={expense.id} className="rounded-xl bg-slate-950 p-3 text-sm">
                          <div className="flex justify-between gap-3"><span className="break-words min-w-0">{expense.title}</span><strong className="shrink-0">{formatVND(expense.amount)}</strong></div>
                          <p className="text-xs text-slate-400 mt-1">{nameOf(expense.payerId)} đã chi · {formatDate(expense.date)}</p>
                          <p className="text-xs text-slate-500 mt-1">Chia cho: {expense.beneficiaryIds.map(nameOf).join(', ') || 'Không có'}</p>
                          {expense.note && <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap break-words">{expense.note}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-bold text-sm mb-3">Công nợ khi chốt ({period.debts.length})</h4>
                    {period.debts.length === 0 && <p className="text-sm text-slate-500">Không có công nợ cần chuyển trả.</p>}
                    <ul className="space-y-2">
                      {period.debts.map((debt) => (
                        <li key={debt.id} className="rounded-xl bg-slate-950 p-3 text-sm space-y-2">
                          <div className="flex flex-wrap items-center gap-2"><span>{nameOf(debt.fromMemberId)}</span><ArrowRight className="w-3 h-3 text-slate-500" /><span className="text-emerald-300">{nameOf(debt.toMemberId)}</span></div>
                          <div className="flex flex-wrap items-center justify-between gap-2"><strong className="text-amber-400">{formatVND(debt.amount)}</strong><span className={`text-xs ${debt.isPaid ? 'text-emerald-400' : 'text-slate-400'}`}>{debt.isPaid ? 'Đã trả' : 'Chưa đánh dấu đã trả'}</span></div>
                          {debt.isPaid && debt.paidAt && <p className="text-xs text-slate-500">Đánh dấu ngày {formatDate(debt.paidAt)}</p>}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </details>
            );
          })}
        </section>
      ))}
    </section>
  );
}
