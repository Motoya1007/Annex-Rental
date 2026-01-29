import { NextResponse } from "next/server";
import { updateTicketStatus, deleteTicket, TicketStatus } from "@/lib/store";

const validStatuses: TicketStatus[] = ["waiting", "calling", "serving"];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { status } = body;

  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json(
      { error: "Invalid status. Must be: waiting, calling, or serving" },
      { status: 400 }
    );
  }

  const ticket = updateTicketStatus(id, status);
  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(ticket);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteTicket(id);

  if (!deleted) {
    return NextResponse.json(
      { error: "Ticket not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true });
}
