import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EquiPay - Quản Lý Chi Tiêu Nhóm & Kết Toán VietQR",
  description: "Ứng dụng quản lý chi tiêu nhóm 4 người, tự động tính toán bù trừ công nợ trực tiếp và sinh mã VietQR Napas 247 chuyển khoản chính xác.",
  keywords: ["equipay", "chia tien", "vietqr", "ket toan no", "napas 247", "quan ly chi tieu nhom"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className="dark h-full antialiased">
      <body className="min-h-full bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
        {children}
      </body>
    </html>
  );
}
