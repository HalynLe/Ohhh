import { DebtPayment, Member } from '@/types';
import { formatVND } from './settlement-algorithm';

/**
 * Hàm tạo nội dung chuyển khoản thông minh, rõ ràng và chuẩn ngân hàng Napas
 * Ví dụ: "THANH TRA TIEN HUY EQUIPAY"
 */
export function generateTransferDescription(
  fromName: string,
  toName: string,
  extra?: string
): string {
  const cleanFrom = removeVietnameseTones(fromName || 'BAN')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .toUpperCase();
  const cleanTo = removeVietnameseTones(toName || 'BAN')
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .trim()
    .toUpperCase();

  if (extra) {
    const cleanExtra = removeVietnameseTones(extra)
      .replace(/[^a-zA-Z0-9 ]/g, '')
      .trim()
      .toUpperCase();
    return `${cleanFrom} TRA TIEN ${cleanTo} ${cleanExtra}`.substring(0, 45);
  }

  return `${cleanFrom} TRA TIEN ${cleanTo} EQUIPAY`.substring(0, 45);
}

/**
 * Tạo link ảnh VietQR Napas 247 động
 * @param bankBin Mã BIN ngân hàng (VD: 970422 cho MB, 970436 cho VCB)
 * @param accountNumber Số tài khoản nhận
 * @param amount Số tiền chuyển khoản
 * @param description Nội dung chuyển khoản
 * @param accountName Tên chủ tài khoản
 * @param template Giao diện QR: compact2, compact, qr_only, print
 */
export function generateVietQRUrl(params: {
  bankBin: string;
  accountNumber: string;
  amount: number;
  description: string;
  accountName?: string;
  template?: 'compact2' | 'compact' | 'qr_only' | 'print';
}): string {
  const {
    bankBin,
    accountNumber,
    amount,
    description,
    accountName = '',
    template = 'compact2',
  } = params;

  // Chuẩn hóa nội dung (bỏ dấu tiếng Việt và ký tự đặc biệt để an toàn cho Napas)
  const cleanDescription = removeVietnameseTones(description)
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .substring(0, 50);

  const cleanAccountName = removeVietnameseTones(accountName).toUpperCase();

  const queryParams = new URLSearchParams({
    amount: Math.round(amount).toString(),
    addInfo: cleanDescription,
  });

  if (cleanAccountName) {
    queryParams.set('accountName', cleanAccountName);
  }

  return `https://img.vietqr.io/image/${bankBin}-${accountNumber}-${template}.png?${queryParams.toString()}`;
}

/**
 * Hàm loại bỏ dấu tiếng Việt để tạo nội dung chuyển khoản chuẩn Napas
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  str = str.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  str = str.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  str = str.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  str = str.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  str = str.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  str = str.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  str = str.replace(/đ/g, 'd');
  str = str.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  str = str.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  str = str.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  str = str.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  str = str.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  str = str.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  str = str.replace(/Đ/g, 'D');
  return str;
}

/**
 * Tạo văn bản tóm tắt kết toán chuẩn để gửi vào Zalo / Messenger
 */
export function generateSettlementShareText(
  periodTitle: string,
  debts: DebtPayment[],
  members: Member[],
  totalAmount: number
): string {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  const lines: string[] = [
    `📊 [KẾT TOÁN CÔNG NỢ CHI TIÊU] - ${periodTitle.toUpperCase()}`,
    `💰 Tổng chi tiêu nhóm: ${formatVND(totalAmount)}`,
    `📅 Thời gian chốt: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`,
    `----------------------------------`,
    `⚡ DANH SÁCH LỆNH CHUYỂN TIỀN:`,
  ];

  if (debts.length === 0) {
    lines.push(`🎉 Tất cả thành viên đã hòa tiền, không ai nợ ai!`);
  } else {
    debts.forEach((debt, index) => {
      const from = memberMap.get(debt.fromMemberId)?.name || 'Thành viên';
      const to = memberMap.get(debt.toMemberId);
      const toName = to?.name || 'Thành viên';
      const bank = to?.bankName || 'Ngân hàng';
      const stk = to?.accountNumber || '';

      lines.push(
        `${index + 1}. 👉 ${from} ➔ ${toName}: ${formatVND(debt.amount)}`
      );
      if (stk) {
        lines.push(`   🏦 ${bank} | STK: ${stk} (${to?.accountName || ''})`);
        lines.push(`   💬 Nội dung: ${generateTransferDescription(from, toName)}`);
      }
    });
  }

  lines.push(`----------------------------------`);
  lines.push(`👉 Các bạn mở web để quét mã VietQR tự động điền số tiền và nội dung nhé!`);

  return lines.join('\n');
}
