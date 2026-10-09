'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DebtPayment, Expense, GroupState, Member, UserAccount } from '@/types';
import {
  getInitialState,
  saveState,
  archiveCurrentPeriod,
  getCurrentUser,
  setCurrentUser,
  INITIAL_STATE,
  hasPendingSync,
  setPendingSync,
} from '@/lib/storage';
import {
  fetchCloudState,
  pushCloudState,
  subscribeToCloudChanges,
} from '@/lib/supabase';
import { Navbar } from '@/components/Navbar';
import { TabNavigation, AppTab } from '@/components/TabNavigation';
import { HomeTab } from '@/components/tabs/HomeTab';
import { OverviewTab } from '@/components/tabs/OverviewTab';
import { ExpensesTab } from '@/components/tabs/ExpensesTab';
import { DebtsTab } from '@/components/tabs/DebtsTab';
import { PaymentTab } from '@/components/tabs/PaymentTab';
import { AddExpenseModal } from '@/components/AddExpenseModal';
import { MemberSettingsModal } from '@/components/MemberSettingsModal';
import { SettlementHistory } from '@/components/SettlementHistory';
import { CloudSyncModal } from '@/components/CloudSyncModal';
import { UserManagerModal } from '@/components/UserManagerModal';
import { LoginScreen } from '@/components/LoginScreen';
import { calculatePairwiseDebts } from '@/lib/settlement-algorithm';
import { hashPassword, isPasswordHashed } from '@/lib/auth-crypto';

export default function EquiPayApp({ view = 'dashboard' }: { view?: 'dashboard' | 'history' } = {}) {
  const [state, setState] = useState<GroupState>(INITIAL_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentUser, setCurrentUserState] = useState<UserAccount | null>(null);
  const stateRef = useRef(INITIAL_STATE);
  const localRevision = useRef(0);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<AppTab>('HOME');

  // Modals state
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<string | null>(null);
  const [isSyncOpen, setIsSyncOpen] = useState(false);
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);

  // Admin permission
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  // Nâng cấp tài khoản cũ theo danh sách 4 thành viên mà không đụng đến chi tiêu/lịch sử.
  // Việc chuẩn hóa được áp dụng cho cả snapshot local và snapshot Supabase khi tải dữ liệu.
  const ensureHashedUsers = useCallback(async (targetState: GroupState): Promise<GroupState> => {
    const desired = [
      { username: 'nhi', displayName: 'Nhi', memberId: 'mem_1', role: 'ADMIN' as const, hash: '45f84b5b6ac050493b22e1aa74d177737b08a97608607b15ddf45df630da5754' },
      { username: 'zang', displayName: 'Zang', memberId: 'mem_2', role: 'MEMBER' as const, hash: '6d2be5590cf9c4bf0f0f1c6a283ed66e10bd0653c9707b5249865c5006595d89' },
      { username: 'tuyen', displayName: 'Tuyền', memberId: 'mem_3', role: 'MEMBER' as const, hash: '87afbcf24167e0141be6f9a1f37b46020d8af117b0e80aae15b301ad3736718c' },
      { username: 'vy', displayName: 'Vy', memberId: 'mem_4', role: 'MEMBER' as const, hash: 'af9f6231db518ef7a1f7becafba572eaae99158d2994ddaa0bbcd3836017cf65' },
    ];
    const oldUsers = targetState.users || [];
    const usedIds = new Set<string>();
    const managedUsers: UserAccount[] = await Promise.all(desired.map(async (item, index) => {
      const existing = oldUsers.find((u) =>
        index === 0
          ? (u.id === 'usr_admin' || u.username.toLowerCase() === 'admin' || u.username.toLowerCase() === 'nhi' || (u.role === 'ADMIN' && u.memberId === 'mem_1'))
          : (u.memberId === item.memberId || u.username.toLowerCase() === item.username)
      );
      const id = existing?.id || (index === 0 ? 'usr_admin' : `usr_${item.username}`);
      usedIds.add(id);
      const shouldResetInitialPassword = !existing || existing.username.toLowerCase() !== item.username;
      const password = shouldResetInitialPassword
        ? item.hash
        : (existing && isPasswordHashed(existing.password) ? existing.password : await hashPassword(existing?.password || ''));
      return {
        ...(existing || {} as UserAccount),
        id,
        username: item.username,
        password,
        displayName: item.displayName,
        role: item.role,
        memberId: item.memberId,
        createdAt: existing?.createdAt || new Date().toISOString(),
      };
    }));
    const otherUsers = oldUsers.filter((u) => !usedIds.has(u.id) &&
      !['admin', 'nhi', 'zang', 'tuyen', 'vy'].includes(u.username.toLowerCase()) &&
      !['mem_1', 'mem_2', 'mem_3', 'mem_4'].includes(u.memberId || '')
    );
    const wantedNames: Record<string, string> = { mem_1: 'Nhi', mem_2: 'Zang', mem_3: 'Tuyền', mem_4: 'Vy' };
    const members = (targetState.members || []).map((member) =>
      wantedNames[member.id] ? { ...member, name: wantedNames[member.id], isAdmin: member.id === 'mem_1' } : member
    );
    const nextState: GroupState = { ...targetState, members, users: [...managedUsers, ...otherUsers] };
    const changed = JSON.stringify(nextState.members) !== JSON.stringify(targetState.members) ||
      JSON.stringify(nextState.users) !== JSON.stringify(targetState.users || []);
    return changed ? nextState : targetState;
  }, []);

  const syncState = useCallback(async (newState: GroupState, revision: number) => {
    try {
      const result = await pushCloudState(newState);
      if (revision !== localRevision.current) return;
      if (result.success) {
        setPendingSync(false);
      } else {
        showToast('Đã lưu trên máy; chưa đồng bộ cloud: ' + result.error);
      }
    } catch (err) {
      console.warn('Cloud sync error:', err);
      showToast('Đã lưu trên máy; sẽ thử đồng bộ lại khi có mạng.');
    }
  }, [showToast]);

  const updateState = useCallback((newState: GroupState) => {
    localRevision.current += 1;
    stateRef.current = newState;
    setPendingSync(true);
    setState(newState);
    saveState(newState);

    // Tự động đẩy dữ liệu lên Supabase Cloud DB ngầm
    void syncState(newState, localRevision.current);
  }, [syncState]);

  // Load initial state and attempt Cloud Database fetch on mount
  useEffect(() => {
    const loaded = getInitialState();
    stateRef.current = loaded;
    // Hydrate browser-only storage after the server-rendered loading screen.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState(loaded);
    const user = getCurrentUser();
    setCurrentUserState(user);
    if (user?.role === 'ADMIN') {
      setIsAdminUnlocked(true);
    }
    setIsLoaded(true);

    let disposed = false;

    // Retry local changes before accepting an older cloud snapshot.
    const refreshCloud = async () => {
      if (hasPendingSync()) {
        // Local pending changes are authoritative; migrate them before retrying the cloud write.
        const pendingState = stateRef.current;
        const migratedPending = await ensureHashedUsers(pendingState);
        if (disposed) return;
        if (migratedPending !== pendingState) {
          stateRef.current = migratedPending;
          setState(migratedPending);
          saveState(migratedPending);
          const active = getCurrentUser();
          if (active) {
            const migratedActive = migratedPending.users.find((u) => u.id === active.id) ||
              (active.username.toLowerCase() === 'admin' ? migratedPending.users.find((u) => u.username === 'nhi') : undefined);
            if (migratedActive) {
              setCurrentUser(migratedActive);
              setCurrentUserState(migratedActive);
            }
          }
          await syncState(migratedPending, localRevision.current);
        } else {
          await syncState(pendingState, localRevision.current);
        }
        return;
      }
      const revision = localRevision.current;
      const res = await fetchCloudState();
      if (disposed || hasPendingSync() || revision !== localRevision.current) return;
      const sourceState = res.state || stateRef.current;
      const nextState = await ensureHashedUsers(sourceState);
      if (disposed || hasPendingSync() || revision !== localRevision.current) return;
      if (nextState.members?.length >= 4) {
        stateRef.current = nextState;
        setState(nextState);
        saveState(nextState);
        const active = getCurrentUser();
        if (active) {
          const migratedActive = nextState.users.find((u) => u.id === active.id) ||
            (active.username.toLowerCase() === 'admin' ? nextState.users.find((u) => u.username === 'nhi') : undefined);
          if (migratedActive) {
            setCurrentUser(migratedActive);
            setCurrentUserState(migratedActive);
          }
        }
        if (!res.error && (nextState !== sourceState || !res.state)) updateState(nextState);
      }
    };
    void refreshCloud();

    // Lắng nghe thay đổi Realtime từ Supabase (khi người khác thêm chi tiêu)
    const unsubscribe = subscribeToCloudChanges((remoteState) => {
      if (!disposed && !hasPendingSync() && remoteState && remoteState.members) {
        localRevision.current += 1;
        stateRef.current = remoteState;
        setState(remoteState);
        saveState(remoteState);
        showToast('Dữ liệu vừa được cập nhật từ thiết bị khác! 🔄');
      }
    });

    // Tự động kiểm tra và tải lại dữ liệu mới nhất khi người dùng mở lại tab hoặc có mạng
    window.addEventListener('focus', refreshCloud);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') refreshCloud();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('online', refreshCloud);

    return () => {
      disposed = true;
      if (unsubscribe) unsubscribe();
      window.removeEventListener('focus', refreshCloud);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('online', refreshCloud);
    };
  }, [ensureHashedUsers, showToast, syncState, updateState]);

  // Auth Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUserState(user);
    setCurrentUser(user);
    if (user.role === 'ADMIN') {
      setIsAdminUnlocked(true);
    }
    showToast(`Xin chào, ${user.displayName}! 🎉`);
  };

  const handleLogout = () => {
    setCurrentUserState(null);
    setCurrentUser(null);
    setIsAdminUnlocked(false);
    showToast('Đã đăng xuất tài khoản an toàn.');
  };

  const handleSaveUsers = (updatedUsers: UserAccount[]) => {
    updateState({ ...state, users: updatedUsers });
    showToast('Đã cập nhật danh sách tài khoản!');
  };

  // Expense Handlers
  const handleSaveExpense = (
    expenseData: Omit<Expense, 'id'>,
    editId?: string
  ) => {
    if (editId) {
      const updated = state.expenses.map((e) =>
        e.id === editId ? { ...expenseData, id: editId } : e
      );
      updateState({ ...state, expenses: updated });
      showToast('Đã cập nhật khoản chi thành công! ✨');
    } else {
      const newExp: Expense = {
        ...expenseData,
        id: `exp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdBy: currentUser?.displayName || undefined,
      };
      updateState({
        ...state,
        expenses: [newExp, ...state.expenses],
      });
      showToast('Đã thêm khoản chi mới! 🎉');
    }
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa khoản chi này?')) {
      const filtered = state.expenses.filter((e) => e.id !== expenseId);
      updateState({ ...state, expenses: filtered });
      showToast('Đã xóa khoản chi.');
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditExpense(expense);
    setIsAddExpenseOpen(true);
  };

  const handleAddNewExpenseClick = () => {
    setEditExpense(null);
    setIsAddExpenseOpen(true);
  };

  // Member Handlers
  const handleSaveMembers = (updatedMembers: Member[], newPin?: string) => {
    updateState({
      ...state,
      members: updatedMembers,
      adminPin: newPin || state.adminPin,
    });
    showToast('Đã lưu thông tin 4 thành viên & Ngân hàng! 💳');
  };

  const handleEditMemberClick = (member: Member) => {
    if (!isAdmin && currentUser?.memberId && member.id !== currentUser.memberId) {
      showToast('🔒 Bạn chỉ có quyền chỉnh sửa thông tin của chính mình!');
      setSelectedMemberForEdit(currentUser.memberId);
    } else {
      setSelectedMemberForEdit(member.id);
    }
    setIsMembersOpen(true);
  };

  // Settlement Finalize
  const handleArchivePeriod = (title: string) => {
    const nextState = archiveCurrentPeriod(stateRef.current, title);
    updateState(nextState);
    showToast(`Đã chốt sổ "${title}" và lưu vào lịch sử! 🚀`);
    setActiveTab('HOME');
  };

  const handleTogglePaid = (debt: DebtPayment) => {
    const current = stateRef.current;
    const paidDebts = { ...current.paidDebts };
    if (paidDebts[debt.id]?.amount === debt.amount) {
      delete paidDebts[debt.id];
    } else {
      paidDebts[debt.id] = { amount: debt.amount, paidAt: new Date().toISOString() };
    }
    updateState({ ...current, paidDebts });
  };

  // Import Backup
  const handleImportState = (imported: GroupState) => {
    updateState(imported);
    showToast('Đã nhập dữ liệu thành công!');
  };

  const isAdmin = currentUser?.role === 'ADMIN' || isAdminUnlocked;
  const debts = calculatePairwiseDebts(state.members, state.expenses);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs">Đang tải EquiPay...</p>
        </div>
      </div>
    );
  }

  // BẮT BUỘC ĐĂNG NHẬP: Nếu chưa đăng nhập, hiển thị màn hình LoginScreen toàn trang
  if (!currentUser) {
    return (
      <LoginScreen
        users={state.users || []}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-2xl shadow-xl animate-fadeIn text-xs sm:text-sm flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        state={state}
        onUpdateState={updateState}
        onOpenMembers={() => {
          setSelectedMemberForEdit(null);
          setIsMembersOpen(true);
        }}
        onOpenSync={() => setIsSyncOpen(true)}
        onOpenUserManager={() => setIsUserManagerOpen(true)}
        onOpenLogin={() => {}}
        currentUser={currentUser}
        onLogout={handleLogout}
        isAdminUnlocked={isAdmin}
        setIsAdminUnlocked={setIsAdminUnlocked}
      />

      {/* Main Container Full Width */}
      <main className="flex-1 w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-5 sm:py-7 space-y-6">
        {view === 'history' ? (
          <SettlementHistory history={state.history} members={state.members} />
        ) : (
          <>
            {/* 5 Tab Navigation Bar */}
            <TabNavigation
              activeTab={activeTab}
              onTabChange={setActiveTab}
              expenseCount={state.expenses.length}
              debtCount={debts.length}
            />

            {/* Tab Content Display */}
            {activeTab === 'HOME' && (
              <HomeTab
                members={state.members}
                expenses={state.expenses}
                currentUser={currentUser}
                onOpenAddExpense={handleAddNewExpenseClick}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'OVERVIEW' && (
              <OverviewTab
                members={state.members}
                expenses={state.expenses}
                onEditMember={handleEditMemberClick}
                onNavigateToDebts={() => setActiveTab('DEBTS')}
              />
            )}

            {activeTab === 'EXPENSES' && (
              <ExpensesTab
                expenses={state.expenses}
                members={state.members}
                onEditExpense={handleEditExpense}
                onDeleteExpense={handleDeleteExpense}
                onOpenAddExpense={handleAddNewExpenseClick}
              />
            )}

            {activeTab === 'DEBTS' && (
              <DebtsTab
                members={state.members}
                expenses={state.expenses}
                currentUser={currentUser}
                onNavigateToPayment={() => setActiveTab('PAYMENT')}
              />
            )}

            {activeTab === 'PAYMENT' && (
              <PaymentTab
                state={state}
                currentUser={currentUser}
                onArchivePeriod={handleArchivePeriod}
                onTogglePaid={handleTogglePaid}
                isAdminUnlocked={isAdmin}
                onUnlockAdmin={() => {
                  setIsAdminUnlocked(true);
                }}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>
          💎 EquiPay • Quản Lý &amp; Kết Toán Chi Tiêu Nhóm 4 Người • VietQR Napas 247
        </p>
      </footer>

      {/* Modals */}
      <UserManagerModal
        isOpen={isUserManagerOpen}
        onClose={() => setIsUserManagerOpen(false)}
        users={state.users || []}
        members={state.members}
        onSaveUsers={handleSaveUsers}
        currentUser={currentUser}
      />

      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditExpense(null);
        }}
        onSave={handleSaveExpense}
        members={state.members}
        editExpense={editExpense}
      />

      <MemberSettingsModal
        isOpen={isMembersOpen}
        onClose={() => {
          setIsMembersOpen(false);
          setSelectedMemberForEdit(null);
        }}
        members={state.members}
        onSaveMembers={handleSaveMembers}
        adminPin={state.adminPin}
        selectedMemberId={selectedMemberForEdit}
        currentUser={currentUser}
      />

      <CloudSyncModal
        isOpen={isSyncOpen}
        onClose={() => setIsSyncOpen(false)}
        state={state}
        onImportState={handleImportState}
      />
    </div>
  );
}
