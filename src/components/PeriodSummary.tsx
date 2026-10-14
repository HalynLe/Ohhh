import { GroupState } from '@/types';
import { calculateDebtsByMode, formatVND, getRecordedPayments, splitDebtSources } from '@/lib/settlement-algorithm';

export function PeriodSummary({ state }: { state: GroupState }) {
  const payments = getRecordedPayments(state);
  const debts = calculateDebtsByMode(state.members, state.expenses, state.settlementMode, payments, state.carriedDebts);
  const nameOf = (id: string) => state.members.find((member) => member.id === id)?.name || 'Thành viên cũ';
  const stats = [
    ['Nợ đầu kỳ', (state.carriedDebts || []).reduce((sum, debt) => sum + debt.amount, 0)],
    ['Chi tiêu kỳ này', state.expenses.reduce((sum, expense) => sum + expense.amount, 0)],
    ['Đã chuyển trả trong kỳ', payments.reduce((sum, payment) => sum + payment.amount, 0)],
    ['Còn nợ / Chuyển kỳ sau', debts.reduce((sum, debt) => sum + debt.amount, 0)],
  ] as const;
  return (
    <section className="space-y-3 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h2 className="font-bold text-emerald-300">Tổng kết kỳ hiện tại</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(([label, amount]) => <div key={label} className="rounded-xl bg-slate-950 p-3">
          <p className="text-xs text-slate-400">{label}</p><p className="font-bold mt-1">{formatVND(amount)}</p>
        </div>)}
      </div>
      <p className="text-xs text-slate-400">Chốt kỳ chỉ lưu lịch sử chi tiêu và thanh toán. Nợ chưa trả được giữ lại cho kỳ sau. Tổng chi tiêu gồm cả phần mỗi người tự chi cho mình.</p>
      {debts.length > 0 && <details>
        <summary className="cursor-pointer text-sm text-teal-300">Xem nợ kỳ trước và phát sinh kỳ này ({debts.length} khoản)</summary>
        <div className="mt-3 space-y-3">
          {debts.map((debt) => {
            const split = splitDebtSources(state, debt);
            return <div key={debt.id} className="rounded-xl bg-slate-950 p-3 text-sm space-y-1">
              <p>{nameOf(debt.fromMemberId)} → {nameOf(debt.toMemberId)}: <strong className="text-amber-400">{formatVND(debt.amount)}</strong></p>
              {state.settlementMode === 'OPTIMAL' ? <p className="text-xs text-slate-400">Số nợ sau bù trừ tối ưu cả nhóm, gồm số dư chuyển từ kỳ trước.</p> : <>
                <p className="text-xs text-slate-400">Nợ kỳ trước còn lại: {formatVND(split.previousAmount)} · Phát sinh kỳ này còn lại: {formatVND(split.currentAmount)}</p>
                {split.sources.map((source, index) => <p key={`${source.periodId}_${index}`} className="text-xs text-slate-500">Từ {source.title}: {formatVND(source.amount)}</p>)}
              </>}
            </div>;
          })}
        </div>
      </details>}
    </section>
  );
}
