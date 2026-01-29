import { NextResponse } from "next/server";
import { getAllTickets, addTicket } from "@/lib/store";

export async function GET() {
  const tickets = getAllTickets();
  return NextResponse.json(tickets);
}

export async function POST(request: Request) {
  const body = await request.json();
  const { number } = body;

  if (!number || typeof number !== "string") {
    return NextResponse.json(
      { error: "number is required" },
      { status: 400 }
    );
  }

  const ticket = addTicket(number.trim());
  return NextResponse.json(ticket, { status: 201 });
}
