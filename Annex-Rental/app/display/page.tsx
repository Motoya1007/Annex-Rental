"use client";

import { useEffect, useState } from "react";

type TicketStatus = "waiting" | "calling" | "serving";

interface Ticket {
  id: string;
  number: string;
  status: TicketStatus;
  createdAt: number;
}

const statusLabels: Record<TicketStatus, string> = {
  waiting: "貸出待ち",
  calling: "呼び出し中",
  serving: "対応中",
};

const statusColors: Record<TicketStatus, string> = {
  waiting: "border-gray-500 bg-gray-50",
  calling: "border-yellow-500 bg-yellow-50",
  serving: "border-green-500 bg-green-50",
};

const headerColors: Record<TicketStatus, string> = {
  waiting: "bg-gray-500",
  calling: "bg-yellow-500",
  serving: "bg-green-500",
};

export default function DisplayPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    };

    fetchTickets();
    const interval = setInterval(fetchTickets, 1500);
    return () => clearInterval(interval);
  }, []);

  const ticketsByStatus = (status: TicketStatus) =>
    tickets.filter((t) => t.status === status);

  return (
    <div className="min-h-screen bg-white p-6">
      <h1 className="text-3xl font-bold text-center mb-8">番号案内</h1>
      <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
        {(["waiting", "calling", "serving"] as TicketStatus[]).map((status) => (
          <div
            key={status}
            className={`border-4 rounded-lg ${statusColors[status]}`}
          >
            <div
              className={`${headerColors[status]} text-white text-xl font-bold py-3 text-center rounded-t`}
            >
              {statusLabels[status]}
            </div>
            <div className="p-4 min-h-[400px]">
              <div className="flex flex-wrap gap-3">
                {ticketsByStatus(status).map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`border-2 rounded-lg px-4 py-3 text-2xl font-bold text-center min-w-[80px] ${
                      status === "calling"
                        ? "border-yellow-600 bg-yellow-100 animate-pulse"
                        : status === "serving"
                        ? "border-green-600 bg-green-100"
                        : "border-gray-400 bg-white"
                    }`}
                  >
                    {ticket.number}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
