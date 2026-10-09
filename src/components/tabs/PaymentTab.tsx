'use client';

import React, { useState, useRef } from 'react';
import { DebtPayment, GroupState, UserAccount } from '@/types';
import {
  calculateDebtsByMode,
  formatVND,
} from '@/lib/settlement-algorithm';
import {
  generateSettlementShareText,
  generateVietQRUrl,
  generateTransferDescription,
} from '@/lib/vietqr';
import { POPULAR_BANK_APPS, openBankingApp } from '@/lib/bank-deeplinks';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Copy,
  Check,
  Share2,
  Download,
  Lock,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Circle,
  Building,
  Filter,
  X,
} from 'lucide-react';

interface PaymentTabProps {
  state: GroupState;
  currentUser: UserAccount | null;
  onArchivePeriod: (title: string) => void;
  onTogglePaid: (debt: DebtPayment) => void;
  isAdminUnlocked: boolean;
  onUnlockAdmin: () => void;
}

export const PaymentTab: React.FC<PaymentTabProps> = ({
  state,
  currentUser,
  onArchivePeriod,
  onTogglePaid,
  isAdminUnlocked,
  onUnlockAdmin,
}) => {
  const currentMemberId = currentUser?.memberId;
  const memberMap = new Map(state.members.map((m) => [m.id, m]));
  const currentMember = currentMemberId ? memberMap.get(currentMemberId) : null;

  const settlementMode = state.settlementMode || 'PAIRWISE';
  // Mặc định: Chỉ hiện các khoản tài khoản đang đăng nhập CẦN TRẢ nếu có tài khoản
  const [filterMemberId, setFilterMemberId] = useState<string>(
    currentMemberId ? 'MY_DEBTS' : 'ALL'
  );
  const [copiedText, setCopiedText] = useState(false);
  const [copiedStkId, setCopiedStkId] = useState<string | null>(null);
  const [selectedQRDebt, setSelectedQRDebt] = useState<DebtPayment | null>(null);
  const [periodTitle, setPeriodTitle] = useState(
    `Kỳ ${new Date().toLocaleDateString('vi-VN')}`
  );
  const [isExportingImage, setIsExportingImage] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  const totalAmount = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const allDebts = calculateDebtsByMode(state.members, state.expenses, settlementMode);

  // Các khoản tài khoản này cần trả
  const myDebtsToPay = currentMemberId
    ? allDebts.filter((d) => d.fromMemberId === currentMemberId)
    : [];
  const myTotalDebtAmount = myDebtsToPay.reduce((sum, d) => sum + d.amount, 0);

  const filteredDebts = allDebts.filter((d) => {
    if (filterMemberId === 'MY_DEBTS') {
      return currentMemberId ? d.fromMemberId === currentMemberId : true;
    }
    if (filterMemberId === 'ALL') return true;
    return d.fromMemberId === filterMemberId || d.toMemberId === filterMemberId;
  });

  const handleCopyShareText = () => {
    const text = generateSettlementShareText(
      periodTitle,
      allDebts,
      state.members,
      totalAmount
    );
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  const handleCopySTK = (debtId: string, stk: string) => {
    navigator.clipboard.writeText(stk);
    setCopiedStkId(debtId);
    setTimeout(() => setCopiedStkId(null), 2000);
  };

  const handleExportImage = async () => {
    if (!reportRef.current) return;
    setIsExportingImage(true);
    try {
      const dataUrl = await toPng(reportRef.current, {
        quality: 0.95,
        backgroundColor: '#0f172a',
      });
      const link = document.createElement('a');
      link.download = `Ket_Toan_${periodTitle.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExportingImage(false);
    }
  };

  const handleFinalize = () => {
    if (!isAdminUnlocked) {
      onUnlockAdmin();
      return;
    }

    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore
    }

    onArchivePeriod(periodTitle);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 sm:p-5 text-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div>
          <h2 className="text-base sm:text-lg font-black flex items-center gap-2">
            <QrCode className="w-5 h-5 text-emerald-400" />
            <span>Trung Tâm Thanh Toán &amp; VietQR Napas 247</span>
          </h2>
          <p className="text-xs text-slate-400">
            {filterMemberId === 'MY_DEBTS' && currentMember
              ? `Chỉ hiển thị các khoản nợ bạn (${currentMember.name}) cần chuyển trả`
              : 'Quét mã chuyển tiền trực tiếp cho người đã chi • Điền sẵn đúng số tiền nợ'}
          </p>
        </div>

        {/* Filter Buttons & Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          {currentMemberId && (
            <button
              onClick={() => setFilterMemberId('MY_DEBTS')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterMemberId === 'MY_DEBTS'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>⚡ Khoản tôi cần trả</span>
              {myDebtsToPay.length > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    filterMemberId === 'MY_DEBTS'
                      ? 'bg-slate-950 text-emerald-300'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {myDebtsToPay.length}
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => setFilterMemberId('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
              filterMemberId === 'ALL'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <span>👥 Cả nhóm</span>
            <span className="text-[10px] opacity-75">({allDebts.length})</span>
          </button>

          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {currentMemberId && (
                <option value="MY_DEBTS">⚡ Khoản tôi cần trả ({myDebtsToPay.length} lệnh)</option>
              )}
              <option value="ALL">Tất cả lệnh chuyển ({allDebts.length} lệnh)</option>
              {state.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.avatar} {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Banner thông tin nợ riêng của tài khoản đang đăng nhập */}
      {filterMemberId === 'MY_DEBTS' && currentMember && (
        <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900/80 to-slate-900/60 border border-emerald-500/30 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-2xl shrink-0">
              {currentMember.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-xs text-slate-400">Tài khoản đang đăng nhập:</p>
                <span className="font-bold text-slate-100 text-xs sm:text-sm">{currentMember.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold">Người trả tiền</span>
              </div>
              <p className="text-base sm:text-lg font-black text-amber-400 font-mono mt-0.5">
                {myDebtsToPay.length > 0
                  ? `Bạn cần chuyển trả tổng cộng: ${formatVND(myTotalDebtAmount)} (${myDebtsToPay.length} lệnh)`
                  : '🎉 Bạn không nợ bất kỳ ai khoản nào!'}
              </p>
            </div>
          </div>
          {allDebts.length > myDebtsToPay.length && (
            <button
              onClick={() => setFilterMemberId('ALL')}
              className="text-xs text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700 transition self-start sm:self-auto shrink-0 flex items-center gap-1.5"
            >
              <span>Xem lệnh của cả nhóm ({allDebts.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Printable Report Container for PNG Export */}
      <div ref={reportRef} className="p-4 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-4">
        {/* Title & Stats */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div>
            <input
              type="text"
              value={periodTitle}
              onChange={(e) => setPeriodTitle(e.target.value)}
              className="bg-transparent font-black text-base sm:text-lg text-emerald-400 focus:outline-none border-b border-dashed border-slate-700 hover:border-emerald-500 transition"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Chốt ngày: {new Date().toLocaleDateString('vi-VN')} {new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400">Tổng chi: </span>
            <span className="text-base sm:text-lg font-black text-slate-100">
              {formatVND(totalAmount)}
            </span>
            <p className="text-[10px] text-slate-400">({state.expenses.length} khoản chi)</p>
          </div>
        </div>

        {/* Debt Settlement Items */}
        {filteredDebts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p className="text-3xl mb-2">🎉</p>
            <p className="font-bold text-slate-200 text-sm sm:text-base">
              {filterMemberId === 'MY_DEBTS'
                ? 'Tuyệt vời! Bạn không có khoản nợ nào cần chuyển trả.'
                : 'Không có khoản nợ nào cần chuyển khoản!'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {filterMemberId === 'MY_DEBTS'
                ? 'Bạn đã thanh toán hết hoặc các thành viên khác đang nợ tiền bạn.'
                : state.expenses.length === 0
                ? 'Chưa có khoản chi nào được ghi nhận.'
                : 'Tất cả các thành viên đã cân bằng chi tiêu.'}
            </p>
            {filterMemberId === 'MY_DEBTS' && allDebts.length > 0 && (
              <button
                onClick={() => setFilterMemberId('ALL')}
                className="mt-3.5 inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-950/70 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl transition font-bold"
              >
                <span>Xem lệnh chuyển tiền của cả nhóm ({allDebts.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDebts.map((debt) => {
              const fromMember = memberMap.get(debt.fromMemberId);
              const toMember = memberMap.get(debt.toMemberId);
              const isPaid = state.paidDebts?.[debt.id]?.amount === debt.amount;

              return (
                <div
                  key={debt.id}
                  className={`p-4 rounded-2xl border transition ${
                    isPaid
                      ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Top: Flow & Amount */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base">{fromMember?.avatar}</span>
                        <div>
                          <span className="font-bold text-slate-200 text-xs sm:text-sm block truncate">
                            {fromMember?.name}
                          </span>
                          <span className="text-[10px] text-rose-400 font-medium">Người trả</span>
                        </div>
                      </div>

                      <div className="flex items-center px-1 text-slate-500 shrink-0">
                        <ArrowRight className="w-4 h-4 text-emerald-400" />
                      </div>

                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-base">{toMember?.avatar}</span>
                        <div>
                          <span className="font-bold text-emerald-300 text-xs sm:text-sm block truncate">
                            {toMember?.name}
                          </span>
                          <span className="text-[10px] text-emerald-400 font-medium">Người nhận</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-black text-amber-400 font-mono">
                        {formatVND(debt.amount)}
                      </p>
                    </div>
                  </div>

                  {/* Bank Details & Buttons */}
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="text-xs space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                        <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        <span className="truncate">{toMember?.bankName || 'Chưa cài ngân hàng'}</span>
                        <span className="text-slate-500">•</span>
                        <span className="font-mono text-emerald-400 select-all font-bold">
                          {toMember?.accountNumber || 'Chưa có STK'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        Chủ TK: <strong className="text-slate-200 uppercase">{toMember?.accountName || 'N/A'}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {toMember?.accountNumber && (
                        <button
                          type="button"
                          onClick={() => handleCopySTK(debt.id, toMember.accountNumber)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 transition"
                          title="Sao chép số tài khoản"
                        >
                          {copiedStkId === debt.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400">Đã chép</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Chép STK</span>
                            </>
                          )}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedQRDebt(debt)}
                        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold flex items-center gap-1 transition shadow-sm"
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>Mã VietQR</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onTogglePaid(debt)}
                        className={`text-xs px-2.5 py-1.5 rounded-lg border flex items-center gap-1 transition ${
                          isPaid
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isPaid ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Đã trả</span>
                          </>
                        ) : (
                          <>
                            <Circle className="w-3.5 h-3.5" />
                            <span>Chưa trả</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Share and Export Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
          <button
            onClick={handleCopyShareText}
            className="py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition"
          >
            {copiedText ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Đã sao chép nội dung Zalo!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 text-blue-400" />
                <span>Sao chép tóm tắt gửi Zalo / Messenger</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportImage}
            disabled={isExportingImage}
            className="py-3 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-teal-400" />
            <span>{isExportingImage ? 'Đang xuất ảnh...' : 'Tải ảnh hóa đơn chốt nợ (PNG)'}</span>
          </button>
        </div>

        {/* Admin Finalize Period Action */}
        <div className="pt-3 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={handleFinalize}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-95"
          >
            {!isAdminUnlocked && <Lock className="w-4 h-4" />}
            <Sparkles className="w-4 h-4" />
            <span>Chốt sổ &amp; Bắt đầu kỳ mới</span>
          </button>
        </div>
      </div>

      {/* Individual VietQR Fullscreen Modal */}
      {selectedQRDebt && (() => {
        const toMember = memberMap.get(selectedQRDebt.toMemberId);
        const fromMember = memberMap.get(selectedQRDebt.fromMemberId);
        const desc = generateTransferDescription(
          fromMember?.name || 'BAN',
          toMember?.name || 'BAN'
        );
        const qrUrl = toMember
          ? generateVietQRUrl({
              bankBin: toMember.bankBin,
              accountNumber: toMember.accountNumber,
              amount: selectedQRDebt.amount,
              description: desc,
              accountName: toMember.accountName,
              template: 'compact2',
            })
          : '';

        return (
          <div className="fixed inset-0 z-60 overflow-y-auto bg-black/85 backdrop-blur-md p-3 sm:p-6 flex flex-col items-center justify-center animate-fadeIn">
            <div className="relative w-full max-w-3xl lg:max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-slate-100 flex flex-col overflow-hidden my-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/90 backdrop-blur-sm">
                <div className="text-left">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-400 font-bold">
                    <span>⚡ VietQR Napas 247</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-normal text-xs">Chuyển khoản tức thì</span>
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-slate-100 mt-1">
                    {fromMember?.name} ➔ Trả {toMember?.name}
                  </h3>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Số tiền thanh toán:</span>
                    <span className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                      {formatVND(selectedQRDebt.amount)}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedQRDebt(null)}
                    className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition ml-1"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 2-Column Content Body */}
              <div className="p-5 sm:p-7">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  {/* Left Column: QR Code & Download */}
                  <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-3.5 shadow-inner">
                    <div className="p-2.5 bg-white rounded-2xl shadow-lg inline-block max-w-full">
                      {qrUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={qrUrl}
                          alt={`VietQR ${toMember?.name}`}
                          className="w-52 sm:w-60 lg:w-64 h-auto mx-auto rounded-xl"
                        />
                      ) : (
                        <div className="p-8 text-slate-800 text-xs sm:text-sm">
                          Chưa có thông tin số tài khoản
                        </div>
                      )}
                    </div>

                    {qrUrl && (
                      <a
                        href={qrUrl}
                        download={`VietQR_${toMember?.name || 'ChuyenTien'}.png`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-98"
                      >
                        <Download className="w-4 h-4" />
                        <span>Lưu ảnh QR vào máy</span>
                      </a>
                    )}
                  </div>

                  {/* Right Column: Bank Details, Copy & Bank Apps */}
                  <div className="space-y-3.5 text-left">
                    {/* Bank Details Card with Copy */}
                    <div className="text-xs sm:text-sm bg-slate-950 rounded-2xl p-4 sm:p-5 border border-slate-800 space-y-3">
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Người nhận:</span>
                        <strong className="text-emerald-300 font-bold text-sm sm:text-base">{toMember?.name}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Ngân hàng:</span>
                        <strong className="text-slate-100 font-medium text-xs sm:text-sm">{toMember?.bankName}</strong>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Số tài khoản:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-emerald-400 font-mono text-sm sm:text-base">{toMember?.accountNumber || 'Chưa điền'}</strong>
                          {toMember?.accountNumber && (
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(toMember.accountNumber);
                                setCopiedStkId('modal_stk');
                                setTimeout(() => setCopiedStkId(null), 2000);
                              }}
                              className="text-xs text-blue-400 hover:underline px-2 py-0.5 bg-blue-500/15 rounded-md font-semibold"
                            >
                              {copiedStkId === 'modal_stk' ? '✓ Đã chép' : 'Chép STK'}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Số tiền:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-emerald-400 font-mono text-sm sm:text-base">{formatVND(selectedQRDebt.amount)}</strong>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(selectedQRDebt.amount.toString());
                              setCopiedStkId('modal_amount');
                              setTimeout(() => setCopiedStkId(null), 2000);
                            }}
                            className="text-xs text-teal-400 hover:underline px-2 py-0.5 bg-teal-500/15 rounded-md font-semibold"
                          >
                            {copiedStkId === 'modal_amount' ? '✓ Đã chép' : 'Chép tiền'}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-slate-400">
                        <span>Nội dung:</span>
                        <div className="flex items-center gap-2">
                          <strong className="text-slate-200 font-mono text-xs sm:text-sm truncate max-w-[160px]">{desc}</strong>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(desc);
                              setCopiedStkId('modal_desc');
                              setTimeout(() => setCopiedStkId(null), 2000);
                            }}
                            className="text-xs text-purple-400 hover:underline px-2 py-0.5 bg-purple-500/15 rounded-md font-semibold"
                          >
                            {copiedStkId === 'modal_desc' ? '✓ Đã chép' : 'Chép ND'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Quick 1-Click Banking App Opener */}
                    <div className="space-y-1.5 text-left bg-slate-950 p-3 sm:p-3.5 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                          <span>📱</span>
                          <span>Mở App Ngân hàng (1 chạm):</span>
                        </span>
                        <span className="text-[10px] text-slate-400">Tự chép STK</span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 pt-1">
                        {POPULAR_BANK_APPS.map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => {
                              if (toMember?.accountNumber) {
                                navigator.clipboard.writeText(toMember.accountNumber);
                              }
                              openBankingApp(app);
                            }}
                            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 flex flex-col items-center justify-center gap-1 text-[10px] font-bold text-slate-200 transition active:scale-95 group shadow-sm"
                          >
                            <span className="text-sm sm:text-base">{app.icon}</span>
                            <span className="truncate max-w-[60px] group-hover:text-emerald-400 text-[10px]">
                              {app.shortName}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Auto Pay Tip Box */}
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-left text-xs text-emerald-300">
                      <span>💡 <strong>Tự động điền 100%:</strong> Bấm &quot;Lưu ảnh QR&quot; ➔ Mở App Ngân Hàng ➔ Bấm &quot;Quét QR&quot; ➔ Chọn ảnh từ Thư viện.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="px-6 py-3 border-t border-slate-800 bg-slate-900 shrink-0 flex justify-end">
                <button
                  onClick={() => setSelectedQRDebt(null)}
                  className="py-2 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
