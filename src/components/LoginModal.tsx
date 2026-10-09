'use client';

import React, { useState } from 'react';
import { UserAccount } from '@/types';
import { X, LogIn, Lock, User, ShieldCheck, AlertCircle, KeyRound } from 'lucide-react';
import { verifyPassword } from '@/lib/auth-crypto';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  users,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim().toLowerCase();
    let foundUser: UserAccount | null = null;
    for (const u of users) {
      if (u.username.toLowerCase() === trimmedUser) {
        const isMatched = await verifyPassword(password, u.password);
        if (isMatched) {
          foundUser = u;
          break;
        }
      }
    }

    if (foundUser) {
      onLoginSuccess(foundUser);
      onClose();
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác!');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <LogIn className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-base text-slate-100">
                Đăng Nhập Tài Khoản
              </h2>
              <p className="text-[11px] text-slate-400">Phân quyền Admin &amp; Thành viên</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-4">
          {/* Username */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tên đăng nhập
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError('');
                }}
                placeholder="VD: admin, thanhvien2..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="Nhập mật khẩu"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-9 pr-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-500/20"
            >
              Đăng Nhập
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
