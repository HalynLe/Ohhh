'use client';

import React, { useRef, useState, useEffect } from 'react';
import { GroupState } from '@/types';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  getSupabaseClient,
  pushCloudState,
  fetchCloudState,
} from '@/lib/supabase';
import {
  X,
  Database,
  Download,
  Upload,
  Cloud,
  Check,
  RefreshCw,
  AlertCircle,
  Key,
  Globe,
  Wifi,
  WifiOff,
  Share2,
  ExternalLink,
  Smartphone,
} from 'lucide-react';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: GroupState;
  onImportState: (importedState: GroupState) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  state,
  onImportState,
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [copiedMagicLink, setCopiedMagicLink] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setIsConnected(Boolean(getSupabaseClient()));
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveAndSync = async () => {
    setIsTesting(true);
    setStatusMsg(null);

    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();

    saveSupabaseConfig({ url: cleanUrl, anonKey: cleanKey });

    const client = getSupabaseClient();
    if (!client) {
      setIsTesting(false);
      setStatusMsg({ type: 'error', text: 'Vui lòng nhập đầy đủ Supabase URL và Anon Key!' });
      setIsConnected(false);
      return;
    }

    try {
      const result = await pushCloudState(state);
      if (result.success) {
        setIsConnected(true);
        setStatusMsg({
          type: 'success',
          text: `Kết nối Supabase & Đã lưu ${state.expenses.length} khoản chi lên Cloud thành công! 🟢`,
        });
      } else {
        setIsConnected(false);
        setStatusMsg({
          type: 'error',
          text: `Lỗi ghi Supabase: ${result.error || 'Vui lòng chạy lại file supabase_schema.sql trên Supabase SQL Editor!'}`,
        });
      }
    } catch (err: any) {
      setIsConnected(false);
      setStatusMsg({ type: 'error', text: `Lỗi kết nối: ${err.message || err}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handlePullFromCloud = async () => {
    setIsTesting(true);
    setStatusMsg(null);

    try {
      const result = await fetchCloudState();
      if (result.state && result.state.members) {
        onImportState(result.state);
        setIsConnected(true);
        setStatusMsg({
          type: 'success',
          text: `Đã tải ${result.state.expenses.length} khoản chi từ Supabase về máy thành công! 🎉`,
        });
      } else {
        setStatusMsg({
          type: 'error',
          text: `Chưa thể tải dữ liệu: ${result.error || 'Chưa có dữ liệu nào trên Supabase!'}`,
        });
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: `Lỗi: ${err.message || err}` });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyMagicLink = () => {
    if (!url || !anonKey) {
      alert('Vui lòng nhập Supabase URL và Anon Key trước khi tạo link!');
      return;
    }
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const magicLink = `${origin}?supa_url=${encodeURIComponent(url.trim())}&supa_key=${encodeURIComponent(anonKey.trim())}`;
    navigator.clipboard.writeText(magicLink);
    setCopiedMagicLink(true);
    setTimeout(() => setCopiedMagicLink(false), 2500);
  };

  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `EquiPay_Backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.members && parsed.expenses) {
          onImportState(parsed);
          alert('Khôi phục dữ liệu sao lưu thành công!');
          onClose();
        } else {
          alert('Tệp sao lưu không đúng định dạng!');
        }
      } catch {
        alert('Lỗi đọc tệp sao lưu JSON!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl text-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-lg text-slate-100">
                Đồng Bộ Cloud Database (Supabase)
              </h2>
              <p className="text-xs text-slate-400">Kết nối cơ sở dữ liệu để 4 điện thoại tự động thấy nhau</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div
            className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMsg.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <Check className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto py-3 space-y-4 flex-1 pr-1">
          {/* Supabase Connection Form */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Cloud className="w-4 h-4" />
                <span>Cấu hình Supabase Database</span>
              </h3>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {isConnected ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3" />}
                <span>{isConnected ? 'Đang kết nối' : 'Chưa kết nối'}</span>
              </span>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Supabase Project URL
                </label>
                <div className="relative">
                  <Globe className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://xyzcompany.supabase.co"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Supabase Anon Key (Public Key)
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    value={anonKey}
                    onChange={(e) => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOi..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-8 pr-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleSaveAndSync}
                disabled={isTesting}
                className="py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition shadow disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Lưu &amp; Đẩy dữ liệu</span>
              </button>

              <button
                type="button"
                onClick={handlePullFromCloud}
                disabled={isTesting}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Tải dữ liệu về máy</span>
              </button>
            </div>

            {/* Quick Share Magic Link for Phone */}
            <div className="pt-2 border-t border-slate-900">
              <button
                type="button"
                onClick={handleCopyMagicLink}
                className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                {copiedMagicLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Đã chép link! Mở link này trên điện thoại để đồng bộ ngay</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Sao chép Link kết nối nhanh cho điện thoại</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Vercel Environment Variables Instruction */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <span>⚡</span>
              <span>Cấu hình tự động vĩnh viễn trên Vercel</span>
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Để mọi điện thoại khi mở web tự động đồng bộ ngay mà không cần nhập mã:
            </p>
            <ol className="list-decimal list-inside text-slate-300 space-y-1.5 pl-1">
              <li>Mở <strong className="text-slate-100">Vercel Dashboard</strong> ➔ Chọn dự án <strong>equipay</strong>.</li>
              <li>Vào <strong className="text-emerald-400">Settings</strong> ➔ <strong className="text-emerald-400">Environment Variables</strong>.</li>
              <li>Thêm 2 biến sau:
                <div className="mt-1 space-y-1 font-mono text-[11px] bg-slate-900 p-2 rounded-lg border border-slate-800">
                  <div className="text-teal-300">NEXT_PUBLIC_SUPABASE_URL = (URL của bạn)</div>
                  <div className="text-teal-300">NEXT_PUBLIC_SUPABASE_ANON_KEY = (Anon Key của bạn)</div>
                </div>
              </li>
              <li>Bấm <strong>Deployments</strong> ➔ Chọn lần deploy mới nhất ➔ Bấm <strong>Redeploy</strong>.</li>
            </ol>
          </div>

          {/* JSON Backup & Restore */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <span>💾</span>
              <span>Sao lưu file JSON về máy (Offline)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Tải file .json</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <Upload className="w-3.5 h-3.5 text-blue-400" />
                <span>Khôi phục file .json</span>
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".json"
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs sm:text-sm font-medium transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
