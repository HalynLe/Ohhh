'use client';

import React from 'react';
import { Expense, Member } from '@/types';
import { ExpenseList } from '@/components/ExpenseList';

interface ExpensesTabProps {
  expenses: Expense[];
  members: Member[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
  onOpenAddExpense: () => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  members,
  onEditExpense,
  onDeleteExpense,
  onOpenAddExpense,
}) => {
  return (
    <div className="space-y-4 animate-fadeIn">
      <ExpenseList
        expenses={expenses}
        members={members}
        onEditExpense={onEditExpense}
        onDeleteExpense={onDeleteExpense}
        onOpenAddExpense={onOpenAddExpense}
      />
    </div>
  );
};
