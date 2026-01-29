import { NextResponse } from "next/server";
import { supabasePublic, supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/tickets
 * チケット一覧を取得（created_at desc）
 */
export async function GET() {
  const { data, error } = await supabasePublic
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

/**
 * POST /api/tickets
 * 新規チケットを追加（status: waiting）
 * 同じ番号が存在する場合はwaitingに戻す
 */
export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { number } = body;

  if (!number || typeof number !== "string" || !number.trim()) {
    return NextResponse.json(
      { error: "number is required" },
      { status: 400 }
    );
  }

  const trimmedNumber = number.trim();

  // 同じ番号が存在するかチェック（大文字小文字を区別しない）
  const { data: existing } = await supabaseAdmin
    .from("tickets")
    .select("*")
    .ilike("number", trimmedNumber)
    .single();

  if (existing) {
    // 既存チケットをwaitingに戻す
    const { data, error } = await supabaseAdmin
      .from("tickets")
      .update({ status: "waiting" })
      .eq("id", existing.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ticket: data, isExisting: true });
  }

  // 新規作成
  const { data, error } = await supabaseAdmin
    .from("tickets")
    .insert({ number: trimmedNumber, status: "waiting" })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ticket: data, isExisting: false }, { status: 201 });
}
