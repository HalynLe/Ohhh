-- ==============================================================================
-- BẢNG CƠ SỞ DỮ LIỆU SUPABASE CHO EQUIPAY (CHIA TIỀN 4 NGƯỜI & VIETQR NAPAS 247)
-- Hướng dẫn: Copy toàn bộ nội dung này và dán vào Supabase SQL Editor rồi bấm "RUN"
-- ==============================================================================

-- 1. Bảng đồng bộ trạng thái chính của toàn bộ nhóm (Chi tiêu, 4 thành viên, tài khoản, lịch sử)
CREATE TABLE IF NOT EXISTS equipay_group_data (
  id TEXT PRIMARY KEY DEFAULT 'default_group',
  state_data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng lưu trữ tài khoản người dùng đăng nhập
CREATE TABLE IF NOT EXISTS user_accounts (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  display_name TEXT,
  role TEXT NOT NULL DEFAULT 'MEMBER',
  member_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng thông tin 4 thành viên & Ngân hàng
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '👤',
  color TEXT NOT NULL DEFAULT '#3B82F6',
  bank_bin TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  account_name TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Bảng các khoản chi tiêu đang hoạt động (Chưa kết toán)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payer_id TEXT NOT NULL,
  beneficiary_ids TEXT[] NOT NULL,
  category TEXT NOT NULL DEFAULT 'FOOD',
  date TIMESTAMPTZ DEFAULT NOW(),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng lưu trữ lịch sử các kỳ đã kết toán
CREATE TABLE IF NOT EXISTS settlement_history (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ DEFAULT NOW(),
  total_amount NUMERIC NOT NULL,
  expenses_data JSONB NOT NULL,
  debts_data JSONB NOT NULL,
  status TEXT DEFAULT 'COMPLETED',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- CẤU HÌNH QUYỀN ĐỌC / GHI (ROW LEVEL SECURITY POLICIES CHO PHÉP CLIENT GHI ĐƯỢC)
-- ==============================================================================

ALTER TABLE equipay_group_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on equipay_group_data" ON equipay_group_data;
CREATE POLICY "Allow all access on equipay_group_data" ON equipay_group_data FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE user_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on user_accounts" ON user_accounts;
CREATE POLICY "Allow all access on user_accounts" ON user_accounts FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on members" ON members;
CREATE POLICY "Allow all access on members" ON members FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on expenses" ON expenses;
CREATE POLICY "Allow all access on expenses" ON expenses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE settlement_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all access on settlement_history" ON settlement_history;
CREATE POLICY "Allow all access on settlement_history" ON settlement_history FOR ALL USING (true) WITH CHECK (true);

-- Cấp quyền truy cập cho Role anon và authenticated
GRANT ALL ON TABLE equipay_group_data TO anon, authenticated;
GRANT ALL ON TABLE user_accounts TO anon, authenticated;
GRANT ALL ON TABLE members TO anon, authenticated;
GRANT ALL ON TABLE expenses TO anon, authenticated;
GRANT ALL ON TABLE settlement_history TO anon, authenticated;

-- ==============================================================================
-- KÍCH HOẠT REALTIME CHO TOÀN BỘ 5 BẢNG (ĐỒNG BỘ TỨC THÌ TRÊN ĐIỆN THOẠI)
-- ==============================================================================

DO $$
BEGIN
  -- Bật Realtime cho từng bảng nếu chưa có
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'equipay_group_data') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE equipay_group_data;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_accounts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE user_accounts;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE members;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'expenses') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE expenses;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'settlement_history') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE settlement_history;
  END IF;
END $$;
