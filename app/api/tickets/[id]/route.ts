import { NextResponse } from "next/server";
import { supabaseAdmin, TicketStatus } from "@/lib/supabase";

const validStatuses: TicketStatus[] = ["waiting", "called"];

/**
 * PATCH /api/tickets/[id]
 * チケットのステータスを更新（waiting / called のみ）
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be: waiting or called" },
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

/**
 * DELETE /api/tickets/[id]
 * チケットを削除
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  const { id } = await params;

  // 削除前にチケット情報を取得（Undo用に返す）
  const { data: ticket } = await supabaseAdmin
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const { error } = await supabaseAdmin
    .from("tickets")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deleted: ticket });
}
