'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { GroupState, UserAccount } from '@/types';
import {
  Users,
  History,
  ShieldCheck,
  Database,
  Lock,
  UserCog,
  LogIn,
  LogOut,
  User,
} from 'lucide-react';

interface NavbarProps {
  state: GroupState;
  onUpdateState: (newState: GroupState) => void;
  onOpenMembers: () => void;
  onOpenSync: () => void;
  onOpenUserManager: () => void;
  onOpenLogin: () => void;
  currentUser: UserAccount | null;
  onLogout: () => void;
  isAdminUnlocked: boolean;
  setIsAdminUnlocked: (unlocked: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  state,
  onUpdateState,
  onOpenMembers,
  onOpenSync,
  onOpenUserManager,
  onOpenLogin,
  currentUser,
  onLogout,
  isAdminUnlocked,
  setIsAdminUnlocked,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState(state.groupName);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      onUpdateState({ ...state, groupName: tempTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const handleAdminToggle = () => {
    if (isAdminUnlocked) {
      setIsAdminUnlocked(false);
    } else {
      setShowPinModal(true);
      setPinInput('');
      setPinError(false);
    }
  };

  const handleVerifyPin = () => {
    const correctPin = state.adminPin || '1234';
    if (pinInput === correctPin) {
      setIsAdminUnlocked(true);
      setShowPinModal(false);
    } else {
      setPinError(true);
    }
  };

  const isAdmin = currentUser?.role === 'ADMIN' || isAdminUnlocked;

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="w-full max-w-[1700px] mx-auto px-4 sm:px-8 lg:px-12 py-3 sm:py-4 flex items-center justify-between gap-3">
          {/* Logo & Group Name */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl overflow-hidden shadow-lg shadow-emerald-500/20 shrink-0 border border-emerald-500/30 bg-slate-900">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="EquiPay Logo"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="min-w-0">
              {isEditingTitle ? (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={(e) => setTempTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTitle()}
                    onBlur={handleSaveTitle}
                    autoFocus
                    className="bg-slate-800 border border-slate-700 text-white text-xs sm:text-sm font-bold rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              ) : (
                <div
                  className="flex items-center gap-1.5 group cursor-pointer"
                  onClick={() => setIsEditingTitle(true)}
                >
                  <h1 className="font-bold text-xs sm:text-base truncate text-slate-100 group-hover:text-emerald-400 transition">
                    {state.groupName}
                  </h1>
                  <span className="text-[10px] text-slate-400 hidden sm:inline">✏️</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  4 Thành viên
                </span>
                <span>•</span>
                <span>VietQR Napas 247</span>
              </div>
            </div>
          </div>

          {/* Action Buttons & Auth */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* User Account / Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 rounded-xl p-1">
                <div className="px-2 py-0.5 flex items-center gap-1 text-xs">
                  {currentUser.role === 'ADMIN' ? (
                    <span className="text-amber-400 font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">{currentUser.displayName}</span>
                    </span>
                  ) : (
                    <span className="text-blue-400 font-medium flex items-center gap-0.5">
                      <User className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">{currentUser.displayName}</span>
                    </span>
                  )}
                </div>

                {/* Admin-only User Manager Button */}
                {currentUser.role === 'ADMIN' && (
                  <button
                    onClick={onOpenUserManager}
                    className="p-1 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 transition"
                    title="Quản lý & Cấp tài khoản người dùng"
                  >
                    <UserCog className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Logout */}
                <button
                  onClick={onLogout}
                  className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition"
                  title="Đăng xuất"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 border border-emerald-500/40 text-emerald-300 font-bold transition shadow-sm"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                <span>Đăng nhập</span>
              </button>
            )}

            {/* Member Settings */}
            <button
              onClick={onOpenMembers}
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title={isAdmin ? 'Quản lý thông tin 4 thành viên & Ngân hàng' : 'Thông tin tài khoản & Ngân hàng của tôi'}
            >
              {isAdmin ? (
                <>
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span className="hidden sm:inline">4 Thành viên</span>
                </>
              ) : (
                <>
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Hồ sơ của tôi</span>
                </>
              )}
            </button>

            {/* Settlement History */}
            <Link
              href="/history"
              className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition"
              title="Lịch sử các kỳ chốt sổ"
            >
              <History className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">Lịch sử ({state.history.length})</span>
            </Link>

            {/* Cloud Sync */}
            <button
              onClick={onOpenSync}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition"
              title="Đồng bộ Supabase & Sao lưu"
            >
              <Database className="w-4 h-4 text-teal-400" />
            </button>
          </div>
        </div>
      </header>

      {/* Admin PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xs w-full p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-center font-bold text-lg mb-1">Mở khóa Quản Trị Viên</h3>
            <p className="text-center text-xs text-slate-400 mb-4">
              Nhập mã PIN để chốt sổ & kết toán nợ (Mặc định: <strong className="text-amber-400">1234</strong>)
            </p>

            <input
              type="password"
              maxLength={6}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleVerifyPin()}
              placeholder="Nhập mã PIN"
              autoFocus
              className="w-full text-center text-2xl tracking-widest font-mono bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 mb-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />

            {pinError && (
              <p className="text-rose-400 text-xs text-center mb-3">Mã PIN không đúng! Thử 1234</p>
            )}

            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => setShowPinModal(false)}
                className="py-2 px-3 rounded-xl bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleVerifyPin}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm transition"
              >
                Mở khóa
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
