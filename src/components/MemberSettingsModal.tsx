'use client';

import React, { useState, useEffect } from 'react';
import { Member, UserAccount } from '@/types';
import { VIETNAM_BANKS } from '@/lib/constants';
import { X, Check, Building, CreditCard, User, Shield, Key, Lock } from 'lucide-react';

interface MemberSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: Member[];
  onSaveMembers: (updatedMembers: Member[], newPin?: string) => void;
  adminPin?: string;
  selectedMemberId?: string | null;
  currentUser?: UserAccount | null;
}

const AVATAR_OPTIONS = ['👨‍💼', '🏄‍♂️', '👩‍🎨', '🚀', '🐱', '🐼', '🦁', '🥑', '⚡', '☕', '🌟', '🎯'];

export const MemberSettingsModal: React.FC<MemberSettingsModalProps> = ({
  isOpen,
  onClose,
  members,
  onSaveMembers,
  adminPin = '1234',
  selectedMemberId,
  currentUser,
}) => {
  const isAdmin = currentUser?.role === 'ADMIN';
  const myMemberId = currentUser?.memberId;

  // Nếu là thành viên thường, chỉ cho phép chọn chính mình
  const defaultTab = isAdmin
    ? selectedMemberId || members[0]?.id || 'mem_1'
    : myMemberId || selectedMemberId || members[0]?.id || 'mem_1';

  const [activeTabId, setActiveTabId] = useState<string>(defaultTab);
  const [localMembers, setLocalMembers] = useState<Member[]>(members);
  const [pin, setPin] = useState(adminPin);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [permissionAlert, setPermissionAlert] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalMembers(members);
      if (isAdmin) {
        setActiveTabId(selectedMemberId || members[0]?.id || 'mem_1');
      } else {
        setActiveTabId(myMemberId || members[0]?.id || 'mem_1');
      }
      setPermissionAlert(null);
    }
  }, [isOpen, selectedMemberId, members, isAdmin, myMemberId]);

  if (!isOpen) return null;

  const currentMember = localMembers.find((m) => m.id === activeTabId) || localMembers[0];

  // Kiểm tra quyền chỉnh sửa
  const canEditCurrentTab = isAdmin || activeTabId === myMemberId;

  const handleTabClick = (memberId: string) => {
    if (!isAdmin && memberId !== myMemberId) {
      setPermissionAlert('🔒 Bạn chỉ có quyền chỉnh sửa thông tin của chính mình!');
      setTimeout(() => setPermissionAlert(null), 3000);
      return;
    }
    setPermissionAlert(null);
    setActiveTabId(memberId);
  };

  const handleUpdateCurrentMember = (field: keyof Member, value: any) => {
    if (!canEditCurrentTab) return;
    setLocalMembers((prev) =>
      prev.map((m) => (m.id === activeTabId ? { ...m, [field]: value } : m))
    );
  };

  const handleBankSelect = (bankBin: string) => {
    if (!canEditCurrentTab) return;
    const bank = VIETNAM_BANKS.find((b) => b.bin === bankBin);
    if (bank) {
      setLocalMembers((prev) =>
        prev.map((m) =>
          m.id === activeTabId
            ? { ...m, bankBin: bank.bin, bankName: bank.shortName }
            : m
        )
      );
    }
  };

  const handleSave = () => {
    onSaveMembers(localMembers, isAdmin ? pin : adminPin);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-slate-100 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">💳</span>
            <div>
              <h2 className="font-black text-lg text-slate-100">
                {isAdmin ? 'Cài Đặt 4 Thành Viên & Ngân Hàng' : 'Thông Tin Cá Nhân & Ngân Hàng'}
              </h2>
              <p className="text-xs text-slate-400">
                {isAdmin
                  ? 'Quyền Admin: Chỉnh sửa STK và thông tin của 4 thành viên'
                  : `Bạn đang chỉnh sửa thông tin của: ${currentMember?.name}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Permission Alert */}
        {permissionAlert && (
          <div className="mt-3 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 animate-fadeIn">
            <Lock className="w-4 h-4 shrink-0 text-amber-400" />
            <span>{permissionAlert}</span>
          </div>
        )}

        {/* Member Select Tabs */}
        <div className="grid grid-cols-4 gap-1.5 my-4 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          {localMembers.map((m) => {
            const isActive = m.id === activeTabId;
            const isMine = m.id === myMemberId;
            const isLocked = !isAdmin && !isMine;

            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleTabClick(m.id)}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col sm:flex-row items-center justify-center gap-1 transition relative ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 shadow-md ring-1 ring-emerald-500/30'
                    : isLocked
                    ? 'text-slate-600 opacity-60 cursor-not-allowed'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span>{m.avatar}</span>
                <span className="truncate max-w-[55px] sm:max-w-none">{m.name.split(' ')[0]}</span>
                {isLocked && <Lock className="w-2.5 h-2.5 text-slate-600 absolute top-1 right-1" />}
                {isMine && !isAdmin && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 absolute bottom-1 right-1"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Edit Form for active member */}
        <div className="space-y-3.5 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
          {/* Name & Avatar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Tên hiển thị
              </label>
              <input
                type="text"
                value={currentMember.name}
                disabled={!canEditCurrentTab}
                onChange={(e) => handleUpdateCurrentMember('name', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                Biểu tượng
              </label>
              <div className="flex items-center gap-1">
                <span className="text-2xl p-1 bg-slate-900 border border-slate-800 rounded-xl">
                  {currentMember.avatar}
                </span>
                <select
                  value={currentMember.avatar}
                  disabled={!canEditCurrentTab}
                  onChange={(e) => handleUpdateCurrentMember('avatar', e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-2 text-sm text-slate-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {AVATAR_OPTIONS.map((av) => (
                    <option key={av} value={av}>
                      {av}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bank Selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Ngân hàng thụ hưởng (VietQR)
            </label>
            <select
              value={currentMember.bankBin}
              disabled={!canEditCurrentTab}
              onChange={(e) => handleBankSelect(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-xs sm:text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {VIETNAM_BANKS.map((b) => (
                <option key={b.id} value={b.bin}>
                  {b.shortName} - {b.name} (Mã BIN: {b.bin})
                </option>
              ))}
            </select>
          </div>

          {/* Account Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Số tài khoản ngân hàng <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={currentMember.accountNumber}
              disabled={!canEditCurrentTab}
              onChange={(e) =>
                handleUpdateCurrentMember(
                  'accountNumber',
                  e.target.value.replace(/[^0-9a-zA-Z]/g, '')
                )
              }
              placeholder="VD: 0987654321"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm font-mono text-emerald-400 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Account Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
              Tên chủ tài khoản (In hoa không dấu)
            </label>
            <input
              type="text"
              value={currentMember.accountName}
              disabled={!canEditCurrentTab}
              onChange={(e) =>
                handleUpdateCurrentMember('accountName', e.target.value.toUpperCase())
              }
              placeholder="VD: NGUYEN VAN A"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-sm font-mono text-slate-200 uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Admin Role Toggle (Chỉ Admin mới nhìn thấy và được chỉnh) */}
          {isAdmin && (
            <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-300 font-medium">Đặt làm Quản Trị Viên (Admin)</span>
              </div>
              <input
                type="checkbox"
                checked={currentMember.isAdmin || false}
                onChange={(e) => handleUpdateCurrentMember('isAdmin', e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400"
              />
            </div>
          )}
        </div>

        {/* Global Admin PIN Config (Chỉ Admin mới nhìn thấy) */}
        {isAdmin && (
          <div className="mt-3 p-3 bg-slate-950/40 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span className="text-slate-400">Mã PIN Admin:</span>
            </div>
            <input
              type="text"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-20 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-center font-mono text-amber-400 font-bold"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition"
          >
            Đóng
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canEditCurrentTab}
            className="py-2 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-1 shadow-lg shadow-emerald-500/20 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-slate-950" />
                <span>Đã lưu!</span>
              </>
            ) : (
              <span>Lưu thông tin</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
