import { NextResponse } from "next/server";
import { supabaseAdmin, TicketStatus } from "@/lib/supabase";

// 有効なステータスは waiting / called のみ
const VALID_STATUSES: TicketStatus[] = ["waiting", "called"];

// 旧ステータス（エラーメッセージ用）
const LEGACY_STATUSES = ["calling", "serving"];

/**
 * PATCH /api/tickets/[id]
 * チケットのステータスを更新（waiting / called のみ許可）
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server configuration error: supabaseAdmin is not configured" },
      { status: 500 }
    );
  }

  const { id } = await params;

  // IDのバリデーション
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid ticket ID" },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { status } = body;

  // 旧ステータスが来たら明確なエラー
  if (LEGACY_STATUSES.includes(status)) {
    return NextResponse.json(
      {
        error: `Invalid status "${status}". The status "${status}" is no longer supported. Use "waiting" or "called" only.`
      },
      { status: 400 }
    );
  }

  // 有効なステータスかチェック
  if (!status || !VALID_STATUSES.includes(status)) {
    return NextResponse.json(
      {
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}. Received: "${status}"`
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("tickets")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("PATCH /api/tickets/[id] error:", error);
    return NextResponse.json(
      { error: `Database error: ${error.message}` },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: `Ticket not found with id: ${id}` },
      { status: 404 }
    );
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/tickets/[id]
 * チケットを削除
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server configuration error: supabaseAdmin is not configured" },
      { status: 500 }
    );
  }

  const { id } = await params;

  // IDのバリデーション
  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "Invalid ticket ID" },
      { status: 400 }
    );
  }

  // 削除前にチケット情報を取得（Undo用に返す）
  const { data: ticket, error: findError } = await supabaseAdmin
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (findError || !ticket) {
    return NextResponse.json(
      { error: `Ticket not found with id: ${id}` },
      { status: 404 }
    );
  }

  const { error } = await supabaseAdmin
    .from("tickets")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("DELETE /api/tickets/[id] error:", error);
    return NextResponse.json(
      { error: `Database error: ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, deleted: ticket });
}
