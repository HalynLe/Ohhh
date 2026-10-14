import { DEFAULT_ADMIN_USER, DEFAULT_MEMBERS } from './constants';
import { Expense, GroupState, SettlementPeriod, UserAccount } from '@/types';
import { getClosingDebts, getRecordedPayments } from './settlement-algorithm';

const STORAGE_KEY = 'EQUIPAY_STATE_V3';
const AUTH_KEY = 'EQUIPAY_CURRENT_USER_V3';
const PENDING_SYNC_KEY = 'EQUIPAY_PENDING_SYNC_V1';

export function hasPendingSync(): boolean {
  return typeof window !== 'undefined' && localStorage.getItem(PENDING_SYNC_KEY) === 'true';
}

export function setPendingSync(pending: boolean): void {
  if (pending) localStorage.setItem(PENDING_SYNC_KEY, 'true');
  else localStorage.removeItem(PENDING_SYNC_KEY);
}

const INITIAL_EXPENSES: Expense[] = [];

export const INITIAL_STATE: GroupState = {
  groupName: 'Nhóm Chi Tiêu 4 Người 🚀',
  members: DEFAULT_MEMBERS,
  expenses: INITIAL_EXPENSES,
  history: [],
  adminPin: '1234',
  settlementMode: 'PAIRWISE',
  users: [DEFAULT_ADMIN_USER],
};

export function getInitialState(): GroupState {
  if (typeof window === 'undefined') return INITIAL_STATE;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.members && parsed.members.length >= 4) {
        return {
          ...INITIAL_STATE,
          ...parsed,
          users: parsed.users && parsed.users.length > 0 ? parsed.users : [DEFAULT_ADMIN_USER],
          settlementMode: parsed.settlementMode || 'PAIRWISE',
        };
      }
    }
  } catch (err) {
    console.error('Failed to load from storage:', err);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_STATE));
  } catch {
    // Ignore
  }
  return INITIAL_STATE;
}

export function saveState(state: GroupState): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error('Failed to save to storage:', err);
  }
}

/**
 * Quản lý phiên đăng nhập hiện tại
 */
export function getCurrentUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // Ignore
  }
  return null;
}

export function setCurrentUser(user: UserAccount | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  } catch {
    // Ignore
  }
}

/**
 * Đóng kỳ hiện tại và lưu vào lịch sử
 */
export function archiveCurrentPeriod(
  state: GroupState,
  title: string
): GroupState {
  const totalAmount = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  // A repeated click after closing must not create another empty period.
  if (state.expenses.length === 0 && getRecordedPayments(state, true).length === 0) return state;
  const periodId = `period_${crypto.randomUUID()}`;
  const periodTitle = title.trim() || `Kỳ kết toán ${new Date().toLocaleDateString('vi-VN')}`;
  const debts = getClosingDebts(state, periodId, periodTitle);

  const newPeriod: SettlementPeriod = {
    members: state.members.map((member) => ({ ...member })),
    id: periodId,
    title: periodTitle,
    openingDebts: state.carriedDebts || [],
    carriedDebts: debts,
    payments: getRecordedPayments(state, true),
    startDate:
      state.expenses.length > 0
        ? state.expenses[state.expenses.length - 1].date
        : new Date().toISOString(),
    endDate: new Date().toISOString(),
    totalAmount,
    expenses: [...state.expenses],
    debts: [...getRecordedPayments(state), ...debts],
    status: 'COMPLETED',
    settledAt: new Date().toISOString(),
  };

  const newState: GroupState = {
    ...state,
    expenses: [],
    carriedDebts: debts,
    paidDebts: {},
    payments: [],
    history: [newPeriod, ...state.history],
  };

  saveState(newState);
  return newState;
}
