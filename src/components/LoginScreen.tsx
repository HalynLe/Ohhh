'use client';

import React, { useState } from 'react';
import { UserAccount } from '@/types';
import { LogIn, Lock, User, ShieldCheck, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { verifyPassword, isPasswordHashed, hashPassword } from '@/lib/auth-crypto';

interface LoginScreenProps {
  users: UserAccount[];
  onLoginSuccess: (user: UserAccount) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLoginSuccess,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const trimmedUser = username.trim().toLowerCase();

    // 1. Kiểm tra trong danh sách người dùng hiện tại
    let foundUser: UserAccount | null = null;
    for (const u of users) {
      if (u.username.toLowerCase() === trimmedUser) {
        const isMatched = await verifyPassword(password, u.password);
        if (isMatched) {
          foundUser = { ...u };
          // Nếu mật khẩu cũ lưu plain text, tự động nâng cấp lên SHA-256 hash
          if (!isPasswordHashed(foundUser.password)) {
            foundUser.password = await hashPassword(password);
          }
          break;
        }
      }
    }

    // 2. Nếu chưa thấy, gọi API lấy dữ liệu mới nhất từ Supabase Cloud
    if (!foundUser) {
      try {
        const res = await fetch('/api/sync', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.state && data.state.users) {
            for (const u of data.state.users as UserAccount[]) {
              if (u.username.toLowerCase() === trimmedUser) {
                const isMatched = await verifyPassword(password, u.password);
                if (isMatched) {
                  foundUser = { ...u };
                  if (!isPasswordHashed(foundUser.password)) {
                    foundUser.password = await hashPassword(password);
                  }
                  break;
                }
              }
            }
          }
        }
      } catch {
        // Ignore network error
      }
    }

    setIsLoading(false);

    if (foundUser) {
      onLoginSuccess(foundUser);
    } else {
      setError('Tên đăng nhập hoặc mật khẩu không chính xác!');
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden font-sans">
      {/* Background glowing gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10 animate-fadeIn">
        {/* Brand Card */}
        <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/30 backdrop-blur-xl text-slate-100">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/20 mx-auto mb-3.5 border-2 border-emerald-500/40 bg-slate-900 p-0.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.jpg"
                alt="EquiPay Logo"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              EquiPay
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống Quản lý Chi tiêu &amp; Kết toán VietQR Nhóm
            </p>
          </div>

          {/* Security Notice */}
          <div className="mb-5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="leading-tight">
              Vui lòng đăng nhập để truy cập dữ liệu công nợ và chuyển khoản của nhóm.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Tên đăng nhập
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="Nhập tên đăng nhập (VD: admin...)"
                  autoFocus
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Nhập mật khẩu"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-10 pr-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-sm transition shadow-lg shadow-emerald-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-slate-950" />
                <span>ĐĂNG NHẬP VÀO HỆ THỐNG</span>
              </button>
            </div>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-600 mt-4">
          EquiPay Security • Dữ liệu mã hóa và bảo mật riêng tư
        </p>
      </div>
    </div>
  );
};
