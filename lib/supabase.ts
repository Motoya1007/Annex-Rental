import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * Public client (anon key) - 読み取り用
 * クライアント・サーバー両方で使用可能
 * RLSポリシーに従う
 */
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Admin client (service_role key) - 書き込み用
 * サーバーサイド(API Routes)でのみ使用すること
 * RLSをバイパスする
 */
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey)
  : null;

// 型定義
export type TicketStatus = "waiting" | "calling" | "serving";

export interface Ticket {
  id: string;
  number: string;
  status: TicketStatus;
  created_at: string;
}
