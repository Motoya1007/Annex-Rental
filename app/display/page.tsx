"use client";

import { useEffect, useState } from "react";

type TicketStatus = "waiting" | "calling" | "serving";

interface Ticket {
  id: string;
  number: string;
  status: TicketStatus;
  createdAt: number;
}

const statusConfig = {
  waiting: {
    label: "貸出待ち",
    borderColor: "border-blue-500",
    bgColor: "bg-blue-50",
    cardBg: "bg-blue-100",
  },
  calling: {
    label: "呼び出し中",
    borderColor: "border-yellow-500",
    bgColor: "bg-yellow-50",
    cardBg: "bg-yellow-100",
  },
  serving: {
    label: "対応中",
    borderColor: "border-green-500",
    bgColor: "bg-green-50",
    cardBg: "bg-green-100",
  },
} as const;

export default function DisplayPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await fetch("/api/tickets", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setTickets(data);
        }
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      }
    };

    fetchTickets();
    const interval = setInterval(fetchTickets, 1500);
    return () => clearInterval(interval);
  }, []);

  const ticketsByStatus = (status: TicketStatus) =>
    tickets.filter((t) => t.status === status);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold text-center mb-8">番号案内</h1>
      <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
        {(["waiting", "calling", "serving"] as const).map((status) => {
          const config = statusConfig[status];
          return (
            <div
              key={status}
              className={`${config.bgColor} ${config.borderColor} border-4 rounded-lg p-4 min-h-[400px]`}
            >
              <h2 className="text-xl font-bold text-center mb-4">
                {config.label}
              </h2>
              <div className="space-y-3">
                {ticketsByStatus(status).map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`${config.cardBg} rounded-lg p-4 text-center shadow`}
                  >
                    <span className="text-2xl font-bold">{ticket.number}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
