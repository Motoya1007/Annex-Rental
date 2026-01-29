"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getAllTickets,
  addTicket,
  updateTicketStatus,
  deleteTicket,
  restoreTicket,
  subscribeToTickets,
  type Ticket,
  type TicketStatus,
} from "@/lib/ticketsService";

const statusLabels: Record<TicketStatus, string> = {
  waiting: "貸出待ち",
  calling: "呼び出し中",
  serving: "対応中",
};

interface Toast {
  id: string;
  message: string;
  ticket: Ticket;
}

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [newNumber, setNewNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const refreshTickets = useCallback(() => {
    setTickets(getAllTickets());
  }, []);

  useEffect(() => {
    refreshTickets();
    const unsubscribe = subscribeToTickets(refreshTickets);
    return unsubscribe;
  }, [refreshTickets]);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;

    setLoading(true);
    const { ticket, isExisting } = addTicket(newNumber);
    setNewNumber("");
    refreshTickets();
    setLoading(false);

    if (isExisting) {
      showToastMessage(`番号「${ticket.number}」を貸出待ちに戻しました`);
    }
  };

  const handleStatusChange = (id: string, status: TicketStatus) => {
    updateTicketStatus(id, status);
    refreshTickets();
  };

  const handleDelete = (id: string) => {
    const deleted = deleteTicket(id);
    if (deleted) {
      refreshTickets();
      showUndoToast(deleted);
    }
  };

  const showToastMessage = (message: string) => {
    const id = crypto.randomUUID();
    const dummyTicket: Ticket = { id: "", number: "", status: "waiting", createdAt: 0 };
    setToasts((prev) => [...prev, { id, message, ticket: dummyTicket }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const showUndoToast = (ticket: Ticket) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message: `「${ticket.number}」を削除しました`, ticket }]);

    // 5秒後に自動で消える
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleUndo = (toast: Toast) => {
    if (toast.ticket.id) {
      restoreTicket(toast.ticket);
      refreshTickets();
    }
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
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

      {/* Toast notifications */}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg"
            style={{ backgroundColor: "#1f2937", color: "#fff", minWidth: "280px" }}
          >
            <span className="flex-1">{toast.message}</span>
            {toast.ticket.id && (
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
