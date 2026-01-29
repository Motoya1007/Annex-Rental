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

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [loading, setLoading] = useState(false);

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

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: newNumber }),
      });
      if (res.ok) {
        setNewNumber("");
        await fetchTickets();
      }
    } catch (error) {
      console.error("Failed to add ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchTickets();
      }
    } catch (error) {
      console.error("Failed to update ticket:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchTickets();
      }
    } catch (error) {
      console.error("Failed to delete ticket:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">管理画面</h1>

        {/* 追加フォーム */}
        <form onSubmit={handleAdd} className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="番号を入力 (例: 12, A12)"
              className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newNumber.trim()}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              追加
            </button>
          </div>
        </form>

        {/* チケット一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-xl font-bold">チケット一覧</h2>
          </div>
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              チケットがありません
            </div>
          ) : (
            <ul>
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex items-center justify-between p-4 border-b last:border-b-0 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl font-bold min-w-[60px]">
                      {ticket.number}
                    </span>
                    <span className="text-sm text-gray-500">
                      ({statusLabels[ticket.status]})
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(ticket.id, "waiting")}
                      disabled={ticket.status === "waiting"}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      貸出待ちへ
                    </button>
                    <button
                      onClick={() => handleStatusChange(ticket.id, "calling")}
                      disabled={ticket.status === "calling"}
                      className="px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      呼び出し中へ
                    </button>
                    <button
                      onClick={() => handleStatusChange(ticket.id, "serving")}
                      disabled={ticket.status === "serving"}
                      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      対応中へ
                    </button>
                    <button
                      onClick={() => handleDelete(ticket.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
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
