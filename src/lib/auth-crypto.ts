/**
 * Tiện ích bảo mật và băm mật khẩu (SHA-256 Salted Hashing)
 * Tương thích 100% cả môi trường Browser (Web Crypto API) và Server (Node.js Crypto)
 */

const PASSWORD_SALT_PREFIX = 'equipay_salt_sec_v1_';

/**
 * Băm mật khẩu người dùng dạng text sang chuỗi mã hóa SHA-256 không thể giải mã ngược
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  const salted = `${PASSWORD_SALT_PREFIX}${plainPassword.trim()}`;

  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    // Trình duyệt: Web Crypto API chuẩn
    const encoder = new TextEncoder();
    const data = encoder.encode(salted);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } else {
    // Server / Node.js
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(salted).digest('hex');
  }
}

/**
 * Kiểm tra xem một chuỗi mật khẩu đã được hash SHA-256 hay chưa (64 ký tự hex)
 */
export function isPasswordHashed(password: string): boolean {
  if (!password) return false;
  return /^[a-f0-9]{64}$/i.test(password.trim());
}

/**
 * Xác thực mật khẩu khi người dùng đăng nhập:
 * 1. So khớp hash tính toán từ mật khẩu nhập vào với hash lưu trong database
 * 2. Tương thích ngược: Nếu tài khoản cũ chưa kịp hash (lưu plain text), vẫn cho đăng nhập
 */
export async function verifyPassword(
  inputPlain: string,
  storedHashOrPlain: string
): Promise<boolean> {
  if (!inputPlain || !storedHashOrPlain) return false;

  const computedHash = await hashPassword(inputPlain);
  if (storedHashOrPlain.trim().toLowerCase() === computedHash.toLowerCase()) {
    return true;
  }

  // Hỗ trợ tương thích ngược nếu trong database cũ còn lưu plain text
  if (storedHashOrPlain.trim() === inputPlain.trim()) {
    return true;
  }

  return false;
}
