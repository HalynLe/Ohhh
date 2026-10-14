export interface Bank {
  id: string;
  code: string;
  name: string;
  shortName: string;
  bin: string;
  logo?: string;
}

export interface Member {
  id: string;
  name: string;
  avatar: string;
  color: string;
  bankBin: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  isAdmin?: boolean;
}

export type UserRole = 'ADMIN' | 'MEMBER';

export interface UserAccount {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: UserRole;
  memberId?: string; // Gán vào thành viên cụ thể trong nhóm
  createdAt: string;
}

export type ExpenseCategory = 
  | 'FOOD' 
  | 'DRINK' 
  | 'SHOPPING' 
  | 'TRANSPORT' 
  | 'ACCOMMODATION' 
  | 'ENTERTAINMENT' 
  | 'UTILITIES' 
  | 'OTHER';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  payerId: string;
  beneficiaryIds: string[];
  category: ExpenseCategory;
  date: string;
  note?: string;
  createdBy?: string;
}

export interface DebtPayment {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
  breakdown?: {
    theyOweMe: { title: string; amount: number }[];
    iOweThem: { title: string; amount: number }[];
    totalTheyOweMe: number;
    totalIOweThem: number;
  };
}

export interface RecordedPayment extends DebtPayment {
  paidAt: string;
  undoneAt?: string;
}

export interface CarriedDebt extends DebtPayment {
  sources: { periodId: string; title: string; amount: number }[];
}

export interface SettlementPeriod {
  openingDebts?: CarriedDebt[];
  carriedDebts?: CarriedDebt[];
  payments?: RecordedPayment[];
  members?: Member[];
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  expenses: Expense[];
  debts: DebtPayment[];
  status: 'COMPLETED';
  settledAt?: string;
  closedBy?: string;
}

export interface GroupState {
  carriedDebts?: CarriedDebt[];
  payments?: RecordedPayment[];
  groupName: string;
  members: Member[];
  expenses: Expense[];
  history: SettlementPeriod[];
  adminPin?: string;
  settlementMode?: 'PAIRWISE' | 'OPTIMAL';
  paidDebts?: Record<string, { amount: number; paidAt: string }>;
  users: UserAccount[];
}
