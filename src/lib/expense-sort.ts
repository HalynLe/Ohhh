import type { Expense } from '@/types';

/** Show the newest purchase dates first without changing the stored order. */
export function sortExpensesByDate(expenses: readonly Expense[]): Expense[] {
  return [...expenses].sort((a, b) =>
    (Date.parse(b.date) || 0) - (Date.parse(a.date) || 0)
  );
}
