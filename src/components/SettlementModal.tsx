'use client';

import React, { useState, useRef } from 'react';
import { DebtPayment, Expense, GroupState, Member } from '@/types';
import {
  calculateDebtsByMode,
  calculatePairwiseDebts,
  calculateOptimalDebts,
  formatVND,
} from '@/lib/settlement-algorithm';
import {
  generateSettlementShareText,
  generateVietQRUrl,
  generateTransferDescription,
} from '@/lib/vietqr';
import { toPng } from 'html-to-image';
import confetti from 'canvas-confetti';
import {
  X,
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
  ChevronDown,
  ChevronUp,
  Receipt,
  Layers,
  Filter,
} from 'lucide-react';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GroupState;
  onArchivePeriod: (title: string) => void;
  isAdminUnlocked: boolean;
  onUnlockAdmin: () => void;
}

export const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  state,
  onArchivePeriod,
  isAdminUnlocked,
  onUnlockAdmin,
}) => {
  const [settlementMode, setSettlementMode] = useState<'PAIRWISE' | 'OPTIMAL'>(
    state.settlementMode || 'PAIRWISE'
  );
  const [filterMemberId, setFilterMemberId] = useState<string>('ALL');
  const [expandedDebtId, setExpandedDebtId] = useState<string | null>(null);

  const [copiedText, setCopiedText] = useState(false);
  const [copiedStkId, setCopiedStkId] = useState<string | null>(null);
  const [selectedQRDebt, setSelectedQRDebt] = useState<DebtPayment | null>(null);
  const [periodTitle, setPeriodTitle] = useState(
    `Kỳ ${new Date().toLocaleDateString('vi-VN')}`
  );
  const [isPaidMap, setIsPaidMap] = useState<Record<string, boolean>>({});
  const [isExportingImage, setIsExportingImage] = useState(false);

  const reportRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  const totalAmount = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const allDebts = calculateDebtsByMode(state.members, state.expenses, settlementMode);
  const memberMap = new Map(state.members.map((m) => [m.id, m]));

  const filteredDebts = allDebts.filter((d) => {
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

  const togglePaidStatus = (debtId: string) => {
    setIsPaidMap((prev) => ({
      ...prev,
      [debtId]: !prev[debtId],
    }));
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
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl text-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl text-slate-100">
                Bảng Kết Toán &amp; Mã VietQR
              </h2>
              <p className="text-xs text-slate-400">
                {settlementMode === 'PAIRWISE'
                  ? 'Bù trừ công nợ trực tiếp 1-1 theo từng người chi'
                  : 'Tối ưu hóa bù trừ chuyển khoản tối thiểu'}
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

        {/* Mode Selector & Filter Bar */}
        <div className="pt-3 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0 border-b border-slate-800/80">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSettlementMode('PAIRWISE')}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1 ${
                settlementMode === 'PAIRWISE'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Trừ nợ trực tiếp 1-1 (Minh bạch)</span>
            </button>
            <button
              onClick={() => setSettlementMode('OPTIMAL')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                settlementMode === 'OPTIMAL'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Tối ưu hóa tổng thể</span>
            </button>
          </div>

          {/* Member Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={filterMemberId}
              onChange={(e) => setFilterMemberId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl py-1.5 px-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="ALL">Tất cả thành viên</option>
              {state.members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.avatar} {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto py-3 space-y-3.5 flex-1 pr-1">
          {/* Printable Report Container for PNG Export */}
          <div ref={reportRef} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3.5">
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
              <div className="py-8 text-center text-slate-400">
                <p className="text-2xl mb-1">🎉</p>
                <p className="font-bold text-slate-200">Không có khoản nợ nào cần chuyển khoản!</p>
                <p className="text-xs text-slate-500 mt-1">
                  {state.expenses.length === 0
                    ? 'Chưa có khoản chi nào được ghi nhận.'
                    : 'Tất cả các thành viên đã cân bằng chi tiêu.'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Danh sách lệnh chuyển tiền ({filteredDebts.length})
                  </h3>
                  <span className="text-[11px] text-emerald-400 font-medium">
                    {settlementMode === 'PAIRWISE' ? '🎯 Bù trừ đúng từng người chi' : '⚡ Tối ưu số lần chuyển'}
                  </span>
                </div>

                {filteredDebts.map((debt) => {
                  const fromMember = memberMap.get(debt.fromMemberId);
                  const toMember = memberMap.get(debt.toMemberId);
                  const isPaid = isPaidMap[debt.id] || false;
                  const isExpanded = expandedDebtId === debt.id;

                  const qrDescription = generateTransferDescription(
                    fromMember?.name || 'BAN',
                    toMember?.name || 'BAN'
                  );

                  return (
                    <div
                      key={debt.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition ${
                        isPaid
                          ? 'bg-emerald-950/20 border-emerald-500/30 opacity-75'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top: Transfer flow & Amount */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        {/* Flow: From -> To */}
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Debtor */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base">{fromMember?.avatar}</span>
                            <div>
                              <span className="font-bold text-slate-200 text-xs sm:text-sm block truncate">
                                {fromMember?.name}
                              </span>
                              <span className="text-[10px] text-rose-400 font-medium">Người trả nợ</span>
                            </div>
                          </div>

                          <div className="flex items-center px-1 text-slate-500 shrink-0">
                            <ArrowRight className="w-4 h-4 text-emerald-400" />
                          </div>

                          {/* Creditor */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-base">{toMember?.avatar}</span>
                            <div>
                              <span className="font-bold text-emerald-300 text-xs sm:text-sm block truncate">
                                {toMember?.name}
                              </span>
                              <span className="text-[10px] text-emerald-400 font-medium">Người nhận (Đã chi)</span>
                            </div>
                          </div>
                        </div>

                        {/* Amount */}
                        <div className="text-right shrink-0">
                          <p className="text-base sm:text-lg font-black text-amber-400">
                            {formatVND(debt.amount)}
                          </p>
                        </div>
                      </div>

                      {/* Bank Details & VietQR quick action */}
                      <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        {/* Bank Info */}
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

                        {/* Buttons: Copy STK, Show QR, Mark Paid */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Copy STK */}
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

                          {/* Show QR Modal Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedQRDebt(debt)}
                            className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold flex items-center gap-1 transition shadow-sm"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                            <span>Mã VietQR</span>
                          </button>

                          {/* Toggle Paid */}
                          <button
                            type="button"
                            onClick={() => togglePaidStatus(debt.id)}
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

                      {/* Breakdown Accordion Toggle (Why this debt?) */}
                      {debt.breakdown && (
                        <div className="mt-2 pt-2 border-t border-slate-800/60">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedDebtId(isExpanded ? null : debt.id)
                            }
                            className="text-[11px] text-slate-400 hover:text-emerald-400 flex items-center gap-1 font-medium transition"
                          >
                            <Receipt className="w-3 h-3 text-slate-500" />
                            <span>
                              {isExpanded
                                ? 'Thu gọn chi tiết khoản chi'
                                : 'Xem chi tiết các khoản chi tạo nên số nợ này'}
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </button>

                          {isExpanded && (
                            <div className="mt-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2 animate-fadeIn">
                              {/* They owe me (toMember paid for fromMember) */}
                              <div>
                                <p className="font-semibold text-emerald-400 text-[11px] mb-1">
                                  + {toMember?.name} đã chi giúp {fromMember?.name}:{' '}
                                  <span className="font-bold">
                                    {formatVND(debt.breakdown.totalTheyOweMe)}
                                  </span>
                                </p>
                                <ul className="space-y-0.5 pl-3 border-l border-slate-800 text-[11px] text-slate-300">
                                  {debt.breakdown.theyOweMe.map((item, i) => (
                                    <li key={i} className="flex justify-between">
                                      <span>• {item.title}</span>
                                      <span className="font-medium text-slate-400">
                                        {formatVND(item.amount)}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* I owe them (fromMember paid for toMember) */}
                              {debt.breakdown.iOweThem.length > 0 && (
                                <div className="pt-1 border-t border-slate-900">
                                  <p className="font-semibold text-rose-400 text-[11px] mb-1">
                                    - Trừ lại khoản {fromMember?.name} đã chi giúp {toMember?.name}:{' '}
                                    <span className="font-bold">
                                      {formatVND(debt.breakdown.totalIOweThem)}
                                    </span>
                                  </p>
                                  <ul className="space-y-0.5 pl-3 border-l border-slate-800 text-[11px] text-slate-400">
                                    {debt.breakdown.iOweThem.map((item, i) => (
                                      <li key={i} className="flex justify-between">
                                        <span>• {item.title}</span>
                                        <span>{formatVND(item.amount)}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Net calculation summary */}
                              <div className="pt-1 border-t border-slate-800 flex justify-between font-bold text-slate-200 text-[11px]">
                                <span>= Còn lại {fromMember?.name} cần trả {toMember?.name}:</span>
                                <span className="text-amber-400 font-mono">
                                  {formatVND(debt.amount)}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Social Share & Image Export Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={handleCopyShareText}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition"
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
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-teal-400" />
              <span>{isExportingImage ? 'Đang xuất ảnh...' : 'Tải ảnh hóa đơn chốt nợ (PNG)'}</span>
            </button>
          </div>
        </div>

        {/* Footer Actions: Finalize & Close Period */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition"
          >
            Đóng lại
          </button>

          <button
            type="button"
            onClick={handleFinalize}
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition active:scale-95"
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
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl text-slate-100 text-center relative">
              <button
                onClick={() => setSelectedQRDebt(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 font-bold mb-1">
                <span>Quét mã VietQR Napas 247</span>
              </div>
              <h3 className="font-bold text-base text-slate-100">
                {fromMember?.name} ➔ Trả {toMember?.name}
              </h3>
              <p className="text-xl font-black text-emerald-400 mt-1">
                {formatVND(selectedQRDebt.amount)}
              </p>

              {/* VietQR Image */}
              <div className="my-4 p-2 bg-white rounded-2xl shadow-inner inline-block max-w-full">
                {qrUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={qrUrl}
                    alt={`VietQR ${toMember?.name}`}
                    className="w-64 h-auto mx-auto rounded-lg"
                  />
                ) : (
                  <div className="p-8 text-slate-800 text-xs">
                    Chưa có thông tin số tài khoản
                  </div>
                )}
              </div>

              {/* Bank summary */}
              <div className="text-xs bg-slate-950 rounded-xl p-3 border border-slate-800 text-left space-y-1 mb-4">
                <p className="text-slate-400">
                  Người nhận: <strong className="text-emerald-300 font-bold">{toMember?.name}</strong>
                </p>
                <p className="text-slate-400">
                  Ngân hàng: <strong className="text-slate-200">{toMember?.bankName}</strong>
                </p>
                <p className="text-slate-400 flex items-center justify-between">
                  <span>
                    STK: <strong className="text-emerald-400 font-mono text-sm">{toMember?.accountNumber || 'Chưa điền'}</strong>
                  </span>
                  {toMember?.accountNumber && (
                    <button
                      onClick={() => handleCopySTK('qr_modal', toMember.accountNumber)}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Sao chép
                    </button>
                  )}
                </p>
                <p className="text-slate-400">
                  Chủ TK: <strong className="text-slate-200 uppercase">{toMember?.accountName || 'N/A'}</strong>
                </p>
                <p className="text-slate-400 truncate">
                  Nội dung: <strong className="text-slate-200">{desc}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedQRDebt(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm transition"
              >
                Đã hiểu &amp; Đóng
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
