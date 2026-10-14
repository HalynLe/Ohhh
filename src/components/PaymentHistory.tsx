'use client';

import { Member, RecordedPayment } from '@/types';
import { formatVND } from '@/lib/settlement-algorithm';

function dateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Không rõ thời gian' : date.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
}

export function PaymentHistory({ payments, members, onUndoPayment }: {
  payments: RecordedPayment[];
  members: Member[];
  onUndoPayment?: (id: string) => void;
}) {
  const nameOf = (id: string) => members.find((member) => member.id === id)?.name || 'Thành viên cũ';
  return (
    <details className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
      <summary className="cursor-pointer font-bold text-teal-300">Xem lại & hoàn tác đã trả ({payments.length})</summary>
      <p className="text-xs text-slate-400 mt-3">Các lần xác nhận trong kỳ hiện tại. Hoàn tác sẽ cộng lại khoản đã trả vào công nợ; không thực hiện giao dịch ngân hàng.</p>
      {payments.length === 0 && <p className="text-sm text-slate-500 mt-4">Chưa có khoản nào được đánh dấu đã trả trong kỳ này.</p>}
      <ul className="mt-4 space-y-3">
        {[...payments].reverse().map((payment) => (
          <li key={payment.id} className="rounded-xl bg-slate-950 p-3 space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
              <span>{nameOf(payment.fromMemberId)} → {nameOf(payment.toMemberId)}</span>
              <strong className={payment.undoneAt ? 'text-slate-500 line-through' : 'text-emerald-400'}>{formatVND(payment.amount)}</strong>
            </div>
            <p className="text-xs text-slate-400">Đánh dấu đã trả: {dateTime(payment.paidAt)}</p>
            {payment.undoneAt ? (
              <p className="text-xs text-amber-400">Đã hoàn tác: {dateTime(payment.undoneAt)}</p>
            ) : onUndoPayment && (
              <button type="button" onClick={() => onUndoPayment(payment.id)}
                aria-label={`Hoàn tác ${nameOf(payment.fromMemberId)} trả ${nameOf(payment.toMemberId)} ${formatVND(payment.amount)}`}
                className="rounded-lg border border-amber-500/30 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/10">
                Hoàn tác đã trả
              </button>
            )}
            {payment.breakdown && (
              <details className="text-xs text-slate-400">
                <summary className="cursor-pointer">Xem diễn giải tại lúc xác nhận</summary>
                <p className="mt-2">{nameOf(payment.toMemberId)} đã chi / chuyển cho {nameOf(payment.fromMemberId)}:</p>
                {payment.breakdown.theyOweMe.map((item, index) => <p key={index} className="mt-1">{item.title}: {formatVND(item.amount)}</p>)}
                <p className="mt-2">Trừ khoản {nameOf(payment.fromMemberId)} đã chi / chuyển ngược lại:</p>
                {payment.breakdown.iOweThem.length === 0 ? <p>0 ₫</p> : payment.breakdown.iOweThem.map((item, index) => <p key={index} className="mt-1">{item.title}: {formatVND(item.amount)}</p>)}
              </details>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}
