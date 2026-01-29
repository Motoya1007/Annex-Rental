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
    if (!confirm("削除しますか？")) return;
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
    <div className="min-h-screen p-6" style={{ backgroundColor: "#f3f4f6" }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8" style={{ color: "#111" }}>
          管理画面
        </h1>

        {/* 追加フォーム */}
        <form
          onSubmit={handleAdd}
          className="rounded-lg shadow p-4 mb-6"
          style={{ backgroundColor: "#fff" }}
        >
          <div className="flex gap-4">
            <input
              type="text"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="番号を入力 (例: 12, A12)"
              className="flex-1 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                border: "1px solid #d1d5db",
                backgroundColor: "#fff",
                color: "#111",
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newNumber.trim()}
              className="px-6 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#3b82f6",
                color: "#fff",
                cursor: loading || !newNumber.trim() ? "not-allowed" : "pointer",
              }}
            >
              追加
            </button>
          </div>
        </form>

        {/* チケット一覧 */}
        <div className="rounded-lg shadow" style={{ backgroundColor: "#fff" }}>
          <div className="p-4" style={{ borderBottom: "1px solid #e5e7eb" }}>
            <h2 className="text-xl font-bold" style={{ color: "#111" }}>
              チケット一覧
            </h2>
          </div>
          {tickets.length === 0 ? (
            <div className="p-8 text-center" style={{ color: "#6b7280" }}>
              チケットがありません
            </div>
          ) : (
            <ul>
              {tickets.map((ticket) => (
                <li
                  key={ticket.id}
                  className="flex items-center justify-between p-4"
                  style={{ borderBottom: "1px solid #e5e7eb" }}
                >
                  <div className="flex items-center gap-4">
                    <span
                      className="text-xl font-bold min-w-[60px]"
                      style={{ color: "#111" }}
                    >
                      {ticket.number}
                    </span>
                    <span className="text-sm" style={{ color: "#6b7280" }}>
                      ({statusLabels[ticket.status]})
                    </span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(ticket.id, "waiting")}
                      disabled={ticket.status === "waiting"}
                      className="px-3 py-1 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "#dbeafe",
                        color: "#1d4ed8",
                        cursor: ticket.status === "waiting" ? "not-allowed" : "pointer",
                      }}
                    >
                      貸出待ちへ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(ticket.id, "calling")}
                      disabled={ticket.status === "calling"}
                      className="px-3 py-1 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "#fef3c7",
                        color: "#a16207",
                        cursor: ticket.status === "calling" ? "not-allowed" : "pointer",
                      }}
                    >
                      呼び出し中へ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStatusChange(ticket.id, "serving")}
                      disabled={ticket.status === "serving"}
                      className="px-3 py-1 text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: "#d1fae5",
                        color: "#047857",
                        cursor: ticket.status === "serving" ? "not-allowed" : "pointer",
                      }}
                    >
                      対応中へ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(ticket.id)}
                      className="px-3 py-1 text-sm rounded"
                      style={{
                        backgroundColor: "#fee2e2",
                        color: "#b91c1c",
                        cursor: "pointer",
                      }}
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
