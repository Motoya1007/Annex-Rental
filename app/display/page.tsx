"use client";

import { useEffect, useState, useCallback } from "react";

type TicketStatus = "waiting" | "calling" | "serving";

interface Ticket {
  id: string;
  number: string;
  status: TicketStatus;
  created_at: string;
}

const statusConfig = {
  waiting: {
    label: "貸出待ち",
    borderColor: "#3b82f6",
    bgColor: "#eff6ff",
    cardBg: "#dbeafe",
  },
  calling: {
    label: "呼び出し中",
    borderColor: "#eab308",
    bgColor: "#fefce8",
    cardBg: "#fef3c7",
  },
  serving: {
    label: "対応中",
    borderColor: "#22c55e",
    bgColor: "#f0fdf4",
    cardBg: "#d1fae5",
  },
} as const;

const POLLING_INTERVAL = 5000; // 5秒間隔

export default function DisplayPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const ticketsByStatus = (status: TicketStatus) =>
    tickets.filter((t) => t.status === status);

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: "#f3f4f6" }}>
      <h1
        className="text-3xl font-bold text-center mb-8"
        style={{ color: "#111" }}
      >
        番号案内
      </h1>
      <div className="grid grid-cols-3 gap-6 max-w-6xl mx-auto">
        {(["waiting", "calling", "serving"] as const).map((status) => {
          const config = statusConfig[status];
          return (
            <div
              key={status}
              className="rounded-lg p-4 min-h-[400px]"
              style={{
                backgroundColor: config.bgColor,
                border: `4px solid ${config.borderColor}`,
              }}
            >
              <h2
                className="text-xl font-bold text-center mb-4"
                style={{ color: "#111" }}
              >
                {config.label}
              </h2>
              <div className="space-y-3">
                {ticketsByStatus(status).map((ticket) => (
                  <div
                    key={ticket.id}
                    className="rounded-lg p-4 text-center shadow"
                    style={{ backgroundColor: config.cardBg }}
                  >
                    <span
                      className="text-2xl font-bold"
                      style={{ color: "#111" }}
                    >
                      {ticket.number}
                    </span>
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
