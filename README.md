<div align="center">
  <img src="public/banner.jpg" alt="EquiPay Banner" width="100%" style="border-radius: 16px; margin-bottom: 16px;" />
  <img src="public/logo.jpg" alt="EquiPay Logo" width="100" height="100" style="border-radius: 20px; box-shadow: 0 8px 30px rgba(16,185,129,0.3);" />
  <h1>💎 EquiPay</h1>
  <p><strong>Nền Tảng Quản Lý Chi Tiêu Nhóm 4 Người &amp; Kết Toán Nợ Tự Động Qua VietQR Napas 247</strong></p>
</div>

---

## ✨ Tính Năng Nổi Bật

1. **📊 Quản lý 4 thành viên & Thông tin Ngân hàng**:
   - Cài đặt tên, ảnh đại diện, ngân hàng (hơn 20 ngân hàng VN: MB, VCB, Techcombank, ACB, VPBank, TPBank, BIDV...), số tài khoản và tên chủ tài khoản.
   - Phân quyền Quản trị viên (Admin) với mã PIN bảo mật.
2. **💸 Kê khai chi tiêu linh hoạt**:
   - Thêm khoản chi nhanh với các phím tắt số tiền (+50k, +100k, +200k, +500k, +1M) và danh mục (Ăn uống, Cà phê, Mua sắm, Đi lại, Khách sạn...).
   - Hỗ trợ chia đều cho 4 người hoặc chọn cụ thể 1, 2, 3 người hưởng thụ.
   - Tính toán trực quan số tiền mỗi người phải chịu theo thời gian thực.
3. **⚡ Kết toán nợ & Tối ưu hóa bù trừ công nợ (Debt Simplification)**:
   - Admin bấm "Chốt sổ & Kết toán QR", thuật toán **Min-Cash-Flow** tự động triệt tiêu công nợ chéo, giảm thiểu tối đa số lượng lệnh chuyển tiền giữa 4 người.
4. **📱 Tích hợp VietQR Napas 247**:
   - Tự động sinh mã VietQR động cho từng lệnh chuyển tiền (điền sẵn đúng STK người nhận, đúng số tiền nợ và nội dung định danh).
   - Nút **Sao chép số tài khoản**, **Xem mã QR chuyển khoản**, **Đánh dấu đã thanh toán**.
5. **📲 Chia sẻ & Xuất hóa đơn**:
   - Nút **"Sao chép tóm tắt gửi Zalo / Messenger"** định dạng đẹp mắt với emoji.
   - Nút **"Tải ảnh hóa đơn chốt nợ (PNG)"** để gửi trực tiếp vào nhóm chat.
6. **📜 Lịch sử các kỳ chốt sổ**:
   - Lưu trữ toàn bộ các đợt kết toán trước đó kèm chi tiết ai đã trả ai bao nhiêu để tra cứu bất kỳ lúc nào.
7. **☁️ Tùy chọn Đồng bộ Đám mây (Supabase)**:
   - File `supabase_schema.sql` có sẵn để thiết lập Realtime Database nếu muốn cả 4 người thao tác trên 4 điện thoại cùng lúc.

---

## 🛠️ Hướng Dẫn Chạy Cục Bộ (Local)

```bash
# 1. Cài đặt các gói phụ thuộc (nếu chưa cài)
npm install

# 2. Chạy môi trường phát triển
npm run dev

# 3. Mở trình duyệt truy cập:
http://localhost:3000
```

---

## 🌐 Hướng Dẫn Deploy Lên Vercel (100% Miễn Phí)

1. Đẩy mã nguồn dự án lên một kho lưu trữ **GitHub** (hoặc GitLab / Bitbucket) của bạn.
2. Truy cập [vercel.com](https://vercel.com) và đăng nhập bằng tài khoản GitHub.
3. Bấm nút **"Add New..."** ➔ Chọn **"Project"**.
4. Chọn kho lưu trữ bạn vừa đẩy lên.
5. Ở phần **Framework Preset**, Vercel sẽ tự động nhận diện là **Next.js**.
6. Bấm nút **"Deploy"** và đợi khoảng 1 phút.
7. Bạn sẽ nhận được đường dẫn công khai (ví dụ: `https://chiatien-nhom4.vercel.app`) để cả nhóm 4 người cùng truy cập trên điện thoại!
