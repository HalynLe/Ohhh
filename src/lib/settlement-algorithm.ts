import { DebtPayment, Expense, Member, RecordedPayment, GroupState, CarriedDebt } from '@/types';

export interface MemberBalance {
  member: Member;
  totalPaid: number;
  totalConsumed: number;
  netBalance: number; // > 0: nhận lại, < 0: nợ cần trả, = 0: hòa
}

/**
 * Tính toán tổng chi, tổng tiêu và số dư ròng của từng thành viên
 */
export function calculateBalances(
  members: Member[],
  expenses: Expense[],
  payments: RecordedPayment[] = [],
  carriedDebts: CarriedDebt[] = []
): Record<string, MemberBalance> {
  const balances: Record<string, MemberBalance> = {};

  // Khởi tạo số dư 0 cho tất cả thành viên
  for (const m of members) {
    balances[m.id] = {
      member: m,
      totalPaid: 0,
      totalConsumed: 0,
      netBalance: 0,
    };
  }

  // Duyệt qua từng khoản chi
  for (const exp of expenses) {
    const payerId = exp.payerId;
    const beneficiaries =
      exp.beneficiaryIds && exp.beneficiaryIds.length > 0
        ? exp.beneficiaryIds
        : members.map((m) => m.id);

    if (balances[payerId]) {
      balances[payerId].totalPaid += exp.amount;
    }

    const sharePerPerson = exp.amount / beneficiaries.length;
    for (const benId of beneficiaries) {
      if (balances[benId]) {
        balances[benId].totalConsumed += sharePerPerson;
      }
    }
  }

  // Tính số dư ròng (làm tròn số nguyên để tránh lẻ xu)
  for (const m of members) {
    const b = balances[m.id];
    b.netBalance = Math.round(b.totalPaid - b.totalConsumed + carriedDebts.reduce((sum, d) => sum + (d.toMemberId === m.id ? d.amount : 0) - (d.fromMemberId === m.id ? d.amount : 0), 0) + payments.reduce((sum, p) => sum + (p.fromMemberId === m.id ? p.amount : 0) - (p.toMemberId === m.id ? p.amount : 0), 0));
  }

  return balances;
}

/**
 * THUẬT TOÁN BÙ TRỪ TRỰC TIẾP TỪNG CẶP 1-1 (PAIRWISE SETTLEMENT - MẶC ĐỊNH)
 * Chỉ bù trừ đúng giữa 2 người (A và B):
 * - A chi cho B những khoản nào
 * - B chi cho A những khoản nào
 * - Bù trừ trực tiếp chênh lệch giữa A và B, không gộp chung với người thứ 3 (C, D)
 */
export function calculatePairwiseDebts(
  members: Member[],
  expenses: Expense[],
  payments: RecordedPayment[] = [],
  carriedDebts: CarriedDebt[] = []
): DebtPayment[] {
  const debts: DebtPayment[] = [];
  // Opening balances are used only for debt calculation, never expense totals.
  const accountingExpenses: Expense[] = [...expenses, ...carriedDebts.map((debt) => ({
    id: `opening_${debt.id}`, title: `Nợ kỳ trước: ${debt.sources.map((source) => source.title).join(', ')}`,
    amount: debt.amount, payerId: debt.toMemberId, beneficiaryIds: [debt.fromMemberId],
    category: 'OTHER' as const, date: '',
  }))];

  // Duyệt qua từng cặp thành viên (i < j để không lặp)
  for (let i = 0; i < members.length; i++) {
    for (let j = i + 1; j < members.length; j++) {
      const memberA = members[i];
      const memberB = members[j];

      // A chi cho B
      const aPaidForB: { title: string; amount: number }[] = [];
      let totalAPaidForB = 0;

      // B chi cho A
      const bPaidForA: { title: string; amount: number }[] = [];
      let totalBPaidForA = 0;

      for (const exp of accountingExpenses) {
        const beneficiaries =
          exp.beneficiaryIds && exp.beneficiaryIds.length > 0
            ? exp.beneficiaryIds
            : members.map((m) => m.id);

        const sharePerPerson = exp.amount / beneficiaries.length;

        // Nếu A là người trả và B là người được hưởng
        if (exp.payerId === memberA.id && beneficiaries.includes(memberB.id)) {
          aPaidForB.push({
            title: exp.title,
            amount: Math.round(sharePerPerson),
          });
          totalAPaidForB += sharePerPerson;
        }

        // Nếu B là người trả và A là người được hưởng
        if (exp.payerId === memberB.id && beneficiaries.includes(memberA.id)) {
          bPaidForA.push({
            title: exp.title,
            amount: Math.round(sharePerPerson),
          });
          totalBPaidForA += sharePerPerson;
        }
      }

      // Round the original balance before applying whole-dong repayments.
      // Otherwise a half-dong share can reappear as a reverse one-dong debt.
      const originalDiff = totalAPaidForB - totalBPaidForA;
      let paidOffset = 0;
      for (const payment of payments) {
        if (payment.fromMemberId === memberA.id && payment.toMemberId === memberB.id) {
          totalAPaidForB += payment.amount;
          paidOffset += payment.amount;
          aPaidForB.push({ title: 'Đã thanh toán', amount: payment.amount });
        } else if (payment.fromMemberId === memberB.id && payment.toMemberId === memberA.id) {
          totalBPaidForA += payment.amount;
          paidOffset -= payment.amount;
          bPaidForA.push({ title: 'Đã thanh toán', amount: payment.amount });
        }
      }
      const diff = Math.sign(originalDiff) * Math.round(Math.abs(originalDiff)) + paidOffset;
      const roundedDiff = Math.round(Math.abs(diff));

      // Tạo lệnh chuyển tiền nếu có chênh lệch nợ (> 0đ)
      if (roundedDiff > 0) {
        if (diff > 0) {
          // B nợ A
          debts.push({
            id: `debt_${memberB.id}_${memberA.id}`,
            fromMemberId: memberB.id, // B trả
            toMemberId: memberA.id,   // cho A
            amount: roundedDiff,
            isPaid: false,
            breakdown: {
              theyOweMe: aPaidForB, // Các khoản A chi mà B dùng
              iOweThem: bPaidForA,  // Các khoản B chi mà A dùng
              totalTheyOweMe: Math.round(totalAPaidForB),
              totalIOweThem: Math.round(totalBPaidForA),
            },
          });
        } else {
          // A nợ B
          debts.push({
            id: `debt_${memberA.id}_${memberB.id}`,
            fromMemberId: memberA.id, // A trả
            toMemberId: memberB.id,   // cho B
            amount: roundedDiff,
            isPaid: false,
            breakdown: {
              theyOweMe: bPaidForA, // Các khoản B chi mà A dùng
              iOweThem: aPaidForB,  // Các khoản A chi mà B dùng
              totalTheyOweMe: Math.round(totalBPaidForA),
              totalIOweThem: Math.round(totalAPaidForB),
            },
          });
        }
      }
    }
  }

  return debts;
}

/**
 * Thuật toán tối ưu hóa bù trừ công nợ tối thiểu (Min-Cash-Flow)
 */
export function calculateOptimalDebts(
  members: Member[],
  expenses: Expense[],
  payments: RecordedPayment[] = [],
  carriedDebts: CarriedDebt[] = []
): DebtPayment[] {
  const balances = calculateBalances(members, expenses, payments, carriedDebts);

  interface PersonAmount {
    id: string;
    amount: number;
  }

  const debtors: PersonAmount[] = [];
  const creditors: PersonAmount[] = [];

  for (const member of members) {
    const net = balances[member.id].netBalance;
    if (net < 0) {
      debtors.push({ id: member.id, amount: Math.abs(net) });
    } else if (net > 0) {
      creditors.push({ id: member.id, amount: net });
    }
  }

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const debts: DebtPayment[] = [];
  let dIdx = 0;
  let cIdx = 0;

  while (dIdx < debtors.length && cIdx < creditors.length) {
    const debtor = debtors[dIdx];
    const creditor = creditors[cIdx];

    const settleAmount = Math.min(debtor.amount, creditor.amount);
    const roundedAmount = Math.round(settleAmount);

    if (roundedAmount > 0) {
      debts.push({
        id: `debt_${debtor.id}_${creditor.id}`,
        fromMemberId: debtor.id,
        toMemberId: creditor.id,
        amount: roundedAmount,
        isPaid: false,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount < 1) dIdx++;
    if (creditor.amount < 1) cIdx++;
  }

  return debts;
}

/**
 * Hàm gọi tính nợ theo chế độ đã chọn (mặc định PAIRWISE 1-1)
 */
export function calculateDebtsByMode(
  members: Member[],
  expenses: Expense[],
  mode: 'PAIRWISE' | 'OPTIMAL' = 'PAIRWISE',
  payments: RecordedPayment[] = [],
  carriedDebts: CarriedDebt[] = []
): DebtPayment[] {
  if (mode === 'OPTIMAL') {
    return calculateOptimalDebts(members, expenses, payments, carriedDebts);
  }
  return calculatePairwiseDebts(members, expenses, payments, carriedDebts);
}

/**
 * Định dạng tiền tệ VND đẹp mắt
 */
export function formatVND(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Preserve confirmations from the previous paid-flag format. */
export function getRecordedPayments(state: GroupState, includeUndone = false): RecordedPayment[] {
  const payments = [...(state.payments || [])];
  for (const from of state.members) for (const to of state.members) {
    if (from.id === to.id) continue;
    const id = `debt_${from.id}_${to.id}`;
    const paid = state.paidDebts?.[id];
    if (paid && Number.isFinite(paid.amount) && paid.amount > 0) {
      payments.push({ id: `legacy_${id}`, fromMemberId: from.id, toMemberId: to.id,
        amount: paid.amount, paidAt: paid.paidAt, isPaid: true });
    }
  }
  return includeUndone ? payments : payments.filter((payment) => !payment.undoneAt);
}

export function recordDebtPayment(state: GroupState, requested: DebtPayment): GroupState {
  const payments = getRecordedPayments(state);
  const current = calculateDebtsByMode(state.members, state.expenses, state.settlementMode, payments, state.carriedDebts)
    .find((debt) => debt.id === requested.id);
  // Reject repeated clicks and stale amounts.
  if (!current || current.amount !== requested.amount) return state;
  return { ...state, paidDebts: {}, payments: [...getRecordedPayments(state, true), {
    ...current, id: `payment_${crypto.randomUUID()}`, isPaid: true, paidAt: new Date().toISOString(),
  }] };
}

/** Undo one confirmation without replacing newer expenses or other payments. */
export function undoDebtPayment(state: GroupState, paymentId: string): GroupState {
  const payments = getRecordedPayments(state, true);
  if (!payments.some((payment) => payment.id === paymentId && !payment.undoneAt)) return state;
  return {
    ...state,
    paidDebts: {},
    payments: payments.map((payment) => payment.id === paymentId
      ? { ...payment, undoneAt: new Date().toISOString() }
      : payment),
  };
}

/** Split remaining direct-pair debt, allocating repayments to oldest balances first. */
export function splitDebtSources(state: GroupState, debt: DebtPayment) {
  const currentDebts = calculatePairwiseDebts(state.members, state.expenses);
  const newAmount = currentDebts.find((item) => item.id === debt.id)?.amount || 0;
  const opening = (state.carriedDebts || []).find((item) => item.id === debt.id);
  const oldRemaining = Math.min(opening?.amount || 0, Math.max(0, debt.amount - newAmount));
  let toSkip = (opening?.amount || 0) - oldRemaining;
  const sources = (opening?.sources || []).flatMap((source) => {
    const skipped = Math.min(toSkip, source.amount);
    toSkip -= skipped;
    return source.amount > skipped ? [{ ...source, amount: source.amount - skipped }] : [];
  });
  return { sources, previousAmount: oldRemaining, currentAmount: debt.amount - oldRemaining };
}

export function getClosingDebts(state: GroupState, periodId: string, title: string): CarriedDebt[] {
  return calculateDebtsByMode(state.members, state.expenses, state.settlementMode,
    getRecordedPayments(state), state.carriedDebts).map((debt) => {
      // Optimized transfers can change counterparties; the closed period retains
      // the opening balances and transfer details needed to trace that netting.
      const split = state.settlementMode === 'OPTIMAL'
        ? { sources: [], currentAmount: debt.amount }
        : splitDebtSources(state, debt);
      return { ...debt, sources: [...split.sources,
        ...(split.currentAmount > 0 ? [{ periodId, title, amount: split.currentAmount }] : [])] };
    });
}
