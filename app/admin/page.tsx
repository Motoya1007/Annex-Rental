"use client";

import { useEffect, useState, useCallback } from "react";

type TicketStatus = "waiting" | "called";

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
  called: {
    label: "呼び出し済み",
    borderColor: "#22c55e",
    bgColor: "#f0fdf4",
    cardBg: "#d1fae5",
  },
} as const;

interface Toast {
  id: string;
  message: string;
  deletedTicket?: Ticket;
}

const POLLING_INTERVAL = 10000; // 10秒

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error("Failed to fetch tickets:", error);
    }
  }, []);

  // 初回fetch + 10秒おき自動更新
  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTickets]);

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
        const { isExisting, ticket } = await res.json();
        setNewNumber("");
        await fetchTickets();

        if (isExisting) {
          showToast(`番号「${ticket.number}」を貸出待ちに戻しました`);
        }
      }
    } catch (error) {
      console.error("Failed to add ticket:", error);
    } finally {
      setLoading(false);
    }
  };

  // waiting → called
  const handleCall = async (ticket: Ticket) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "called" }),
      });
      if (res.ok) {
        await fetchTickets();
      }
    } catch (error) {
      console.error("Failed to update ticket:", error);
    }
  };

  // called → 削除
  const handleComplete = async (ticket: Ticket) => {
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchTickets();
        showUndoToast(ticket);
      }
    } catch (error) {
      console.error("Failed to delete ticket:", error);
    }
  };

  const handleRestore = async (ticket: Ticket) => {
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: ticket.number }),
      });
      if (res.ok) {
        await fetchTickets();
      }
    } catch (error) {
      console.error("Failed to restore ticket:", error);
    }
  };

  const showToast = (message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const showUndoToast = (ticket: Ticket) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [
      ...prev,
      { id, message: `「${ticket.number}」を完了しました`, deletedTicket: ticket },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleUndo = async (toast: Toast) => {
    if (toast.deletedTicket) {
      await handleRestore(toast.deletedTicket);
    }
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const ticketsByStatus = (status: TicketStatus) =>
    tickets.filter((t) => t.status === status);

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: "#f3f4f6" }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold text-center mb-6" style={{ color: "#111" }}>
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

        {/* 更新情報バー */}
        <div
          className="flex items-center justify-between rounded-lg px-4 py-2 mb-4 shadow"
          style={{ backgroundColor: "#fff" }}
        >
          <div className="text-sm" style={{ color: "#6b7280" }}>
            最終更新:{" "}
            <span style={{ color: "#111", fontWeight: 500 }}>
              {lastUpdated ? formatTime(lastUpdated) : "---"}
            </span>
            <span className="ml-2">(10秒ごと自動更新)</span>
          </div>
          <button
            type="button"
            onClick={() => fetchTickets()}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium"
            style={{ backgroundColor: "#e5e7eb", color: "#374151" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            更新
          </button>
        </div>

        {/* 2セクション表示 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {(["waiting", "called"] as const).map((status) => {
            const config = statusConfig[status];
            const statusTickets = ticketsByStatus(status);
            const isWaiting = status === "waiting";

            return (
              <div
                key={status}
                className="rounded-lg p-4 min-h-[250px]"
                style={{
                  backgroundColor: config.bgColor,
                  border: `4px solid ${config.borderColor}`,
                }}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg md:text-xl font-bold" style={{ color: "#111" }}>
                    {config.label}
                  </h2>
                  <span
                    className="text-sm font-medium px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: config.borderColor, color: "#fff" }}
                  >
                    {statusTickets.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {statusTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="flex items-center justify-between rounded-lg p-3 shadow"
                      style={{ backgroundColor: config.cardBg }}
                    >
                      <span
                        className="text-xl font-bold min-w-[60px]"
                        style={{ color: "#111" }}
                      >
                        {ticket.number}
                      </span>
                      {isWaiting ? (
                        <button
                          type="button"
                          onClick={() => handleCall(ticket)}
                          className="px-3 py-1 text-sm rounded font-medium"
                          style={{
                            backgroundColor: "#22c55e",
                            color: "#fff",
                          }}
                        >
                          呼び出す
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleComplete(ticket)}
                          className="px-3 py-1 text-sm rounded font-medium"
                          style={{
                            backgroundColor: "#dc2626",
                            color: "#fff",
                          }}
                        >
                          完了
                        </button>
                      )}
                    </div>
                  ))}

                  {statusTickets.length === 0 && (
                    <div className="text-center py-6 text-sm" style={{ color: "#9ca3af" }}>
                      なし
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg"
            style={{ backgroundColor: "#1f2937", color: "#fff", minWidth: "280px" }}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.deletedTicket && (
              <button
                type="button"
                onClick={() => handleUndo(toast)}
                className="px-2 py-1 text-sm rounded font-medium"
                style={{ backgroundColor: "#3b82f6", color: "#fff" }}
              >
                元に戻す
              </button>
            )}
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              className="text-gray-400 hover:text-white"
              style={{ fontSize: "18px", lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
