import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { GroupState } from '@/types';

const SUPABASE_CONFIG_KEY = 'EQUIPAY_SUPABASE_CONFIG_V1';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseConfig(): SupabaseConfig {
  if (typeof window !== 'undefined') {
    try {
      // 1. Kiểm tra query parameters từ URL (Magic Link: ?supa_url=...&supa_key=...)
      const urlParams = new URLSearchParams(window.location.search);
      const queryUrl = urlParams.get('supa_url');
      const queryKey = urlParams.get('supa_key');

      if (queryUrl && queryKey) {
        const magicConfig = { url: queryUrl.trim(), anonKey: queryKey.trim() };
        localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(magicConfig));
        window.history.replaceState({}, document.title, window.location.pathname);
        return magicConfig;
      }

      // 2. Kiểm tra localStorage đã lưu
      const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.url && parsed.anonKey) {
          return parsed;
        }
      }
    } catch {
      // Ignore
    }
  }

  // 3. Sử dụng Environment Variables từ Vercel
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
    cachedClient = null; // reset client cache
  } catch {
    // Ignore
  }
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  const url = (config.url || '').trim().replace(/\/+$/, '').replace(/\/rest\/v1\/?$/, '');
  const anonKey = (config.anonKey || '').trim();

  if (!url || !anonKey) return null;

  if (cachedClient && lastUrl === url && lastKey === anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
    lastUrl = url;
    lastKey = anonKey;
    return cachedClient;
  } catch (err) {
    console.error('Failed to init Supabase client:', err);
    return null;
  }
}

/**
 * Tải dữ liệu mới nhất từ Supabase Cloud Database về web
 */
export async function fetchCloudState(): Promise<{ state: GroupState | null; error?: string; source?: string }> {
  const config = getSupabaseConfig();

  // 1. Thử gọi qua Server Route /api/sync kèm client headers
  if (typeof window !== 'undefined') {
    try {
      const headers: Record<string, string> = {};
      if (config.url && config.anonKey) {
        headers['x-supabase-url'] = config.url;
        headers['x-supabase-key'] = config.anonKey;
      }

      const res = await fetch('/api/sync', {
        headers,
        cache: 'no-store',
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.state && json.state.members) {
          return { state: json.state as GroupState, source: json.source };
        }
        if (json.success && json.state === null) {
          return { state: null, source: json.source };
        }
        if (!json.success && json.error) {
          return { state: null, error: json.error, source: json.source };
        }
      }
    } catch {
      // Fallback
    }
  }

  // 2. Client SDK Fallback
  const client = getSupabaseClient();
  if (!client) return { state: null, error: 'Chưa cấu hình Supabase URL / Key' };

  try {
    const { data, error } = await client
      .from('equipay_group_data')
      .select('state_data')
      .eq('id', 'default_group')
      .maybeSingle();

    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return { state: null, error: error.message };
    }

    if (data && data.state_data) {
      return { state: data.state_data as GroupState, source: 'client_sdk' };
    }

    return { state: null, error: 'Bảng equipay_group_data chưa có dữ liệu.' };
  } catch (err: unknown) {
    console.warn('Cloud fetch exception:', err);
    return { state: null, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Đẩy dữ liệu từ web lên Supabase Cloud Database để đồng bộ tất cả các bảng
 */
type PushResult = { success: boolean; error?: string; source?: string };
let pushQueue: Promise<PushResult> = Promise.resolve({ success: true });

export function pushCloudState(state: GroupState): Promise<PushResult> {
  const push = () => writeCloudState(state);
  pushQueue = pushQueue.then(push, push);
  return pushQueue;
}

async function writeCloudState(state: GroupState): Promise<PushResult> {
  const config = getSupabaseConfig();
  let serverError = 'Chưa cấu hình thông tin Supabase';

  // 1. Đẩy qua Server Route /api/sync
  if (typeof window !== 'undefined') {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (config.url && config.anonKey) {
        headers['x-supabase-url'] = config.url;
        headers['x-supabase-key'] = config.anonKey;
      }

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers,
        body: JSON.stringify({ state }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          return { success: true, source: 'server_api' };
        }
        serverError = json.error || 'Không thể lưu dữ liệu lên Supabase';
      } else {
        serverError = `Lỗi đồng bộ HTTP ${res.status}`;
      }
    } catch (err) {
      serverError = err instanceof Error ? err.message : String(err);
    }
  }

  // 2. Đẩy trực tiếp qua Client SDK vào tất cả các bảng Supabase
  const client = getSupabaseClient();
  if (client) {
    try {
      // Bảng 1: equipay_group_data
      const { error: masterError } = await client
        .from('equipay_group_data')
        .upsert({
          id: 'default_group',
          state_data: state,
          updated_at: new Date().toISOString(),
        });
      if (masterError) return { success: false, error: masterError.message };

      // Bảng 2: user_accounts (Lưu riêng từng tài khoản đăng nhập)
      if (state.users && state.users.length > 0) {
        const userRows = state.users.map((u) => ({
          id: u.id,
          username: u.username,
          password: u.password,
          display_name: u.displayName || u.username,
          role: u.role,
          member_id: u.memberId,
        }));
        await client.from('user_accounts').upsert(userRows);
      }

      // Bảng 3: members (Lưu riêng 4 thành viên & Ngân hàng)
      if (state.members && state.members.length > 0) {
        const memberRows = state.members.map((m) => ({
          id: m.id,
          name: m.name,
          avatar: m.avatar,
          color: m.color,
          bank_bin: m.bankBin,
          bank_name: m.bankName,
          account_number: m.accountNumber,
          account_name: m.accountName,
          is_admin: m.isAdmin || false,
        }));
        await client.from('members').upsert(memberRows);
      }

      // Bảng 4: expenses (Lưu riêng các khoản chi tiêu)
      if (state.expenses && state.expenses.length > 0) {
        const expenseRows = state.expenses.map((e) => ({
          id: e.id,
          title: e.title,
          amount: e.amount,
          payer_id: e.payerId,
          beneficiary_ids: e.beneficiaryIds || [],
          category: e.category || 'FOOD',
          date: e.date || new Date().toISOString(),
          note: e.note || null,
        }));
        await client.from('expenses').upsert(expenseRows);
      }

      return { success: true, source: 'client_sdk_all_tables' };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return { success: false, error: serverError };
}

/**
 * Lắng nghe thay đổi Realtime từ Supabase khi có thành viên khác vừa thêm chi tiêu
 */
export function subscribeToCloudChanges(
  onUpdate: (newState: GroupState) => void
): (() => void) | null {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const channel = client
      .channel('equipay_realtime_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'equipay_group_data',
          filter: 'id=eq.default_group',
        },
        (payload) => {
          if (payload.new && 'state_data' in payload.new && payload.new.state_data) {
            onUpdate(payload.new.state_data as GroupState);
          }
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.warn('Realtime subscription error:', err);
    return null;
  }
}
