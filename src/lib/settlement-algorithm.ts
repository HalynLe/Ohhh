import { DebtPayment, Expense, Member } from '@/types';

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
  expenses: Expense[]
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
    b.netBalance = Math.round(b.totalPaid - b.totalConsumed);
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
  expenses: Expense[]
): DebtPayment[] {
  const debts: DebtPayment[] = [];
  const memberMap = new Map(members.map((m) => [m.id, m]));

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

      for (const exp of expenses) {
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

      const diff = totalAPaidForB - totalBPaidForA;
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
  expenses: Expense[]
): DebtPayment[] {
  const balances = calculateBalances(members, expenses);

  interface PersonAmount {
    id: string;
    amount: number;
  }

  const debtors: PersonAmount[] = [];
  const creditors: PersonAmount[] = [];

  for (const member of members) {
    const net = balances[member.id].netBalance;
    if (net < -1) {
      debtors.push({ id: member.id, amount: Math.abs(net) });
    } else if (net > 1) {
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
  mode: 'PAIRWISE' | 'OPTIMAL' = 'PAIRWISE'
): DebtPayment[] {
  if (mode === 'OPTIMAL') {
    return calculateOptimalDebts(members, expenses);
  }
  return calculatePairwiseDebts(members, expenses);
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
