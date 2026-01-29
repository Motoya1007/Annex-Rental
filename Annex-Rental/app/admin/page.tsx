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

const statusBadgeColors: Record<TicketStatus, string> = {
  waiting: "bg-gray-200 text-gray-800",
  calling: "bg-yellow-200 text-yellow-800",
  serving: "bg-green-200 text-green-800",
};

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTickets = async () => {
    const res = await fetch("/api/tickets", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setTickets(data);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const addTicket = async () => {
    if (!newNumber.trim()) return;
    setLoading(true);
    await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number: newNumber.trim() }),
    });
    setNewNumber("");
    await fetchTickets();
    setLoading(false);
  };

  const updateStatus = async (id: string, status: TicketStatus) => {
    await fetch(`/api/tickets/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchTickets();
  };

  const deleteTicket = async (id: string) => {
    await fetch(`/api/tickets/${id}`, { method: "DELETE" });
    await fetchTickets();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addTicket();
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">管理ページ</h1>

        {/* 追加フォーム */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="番号を入力 (例: 12, A12)"
              className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addTicket}
              disabled={loading || !newNumber.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded font-semibold hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              追加
            </button>
          </div>
        </div>

        {/* チケット一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold">チケット一覧 ({tickets.length}件)</h2>
          </div>
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              チケットがありません
            </div>
          ) : (
            <ul className="divide-y">
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold min-w-[60px]">
                      {ticket.number}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        statusBadgeColors[ticket.status]
                      }`}
                    >
                      {statusLabels[ticket.status]}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateStatus(ticket.id, "waiting")}
                      disabled={ticket.status === "waiting"}
                      className="px-3 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      貸出待ちへ
                    </button>
                    <button
                      onClick={() => updateStatus(ticket.id, "calling")}
                      disabled={ticket.status === "calling"}
                      className="px-3 py-1 text-sm rounded border border-yellow-400 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      呼び出し中へ
                    </button>
                    <button
                      onClick={() => updateStatus(ticket.id, "serving")}
                      disabled={ticket.status === "serving"}
                      className="px-3 py-1 text-sm rounded border border-green-400 bg-green-50 hover:bg-green-100 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      対応中へ
                    </button>
                    <button
                      onClick={() => deleteTicket(ticket.id)}
                      className="px-3 py-1 text-sm rounded border border-red-400 bg-red-50 text-red-600 hover:bg-red-100"
                    >
                      削除
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
