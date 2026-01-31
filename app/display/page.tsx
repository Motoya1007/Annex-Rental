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
    nextStatus: "calling" as TicketStatus,
    nextLabel: "呼び出す",
    borderColor: "#3b82f6",
    bgColor: "#eff6ff",
    cardBg: "#dbeafe",
    cardHover: "#bfdbfe",
  },
  calling: {
    label: "呼び出し中",
    nextStatus: "serving" as TicketStatus,
    nextLabel: "対応開始",
    borderColor: "#eab308",
    bgColor: "#fefce8",
    cardBg: "#fef3c7",
    cardHover: "#fde68a",
  },
  serving: {
    label: "対応中",
    nextStatus: "waiting" as TicketStatus,
    nextLabel: "完了→待ちへ",
    borderColor: "#22c55e",
    bgColor: "#f0fdf4",
    cardBg: "#d1fae5",
    cardHover: "#a7f3d0",
  },
} as const;

const POLLING_INTERVAL = 5000;

interface Toast {
  id: string;
  message: string;
  deletedTicket?: Ticket;
}

export default function DisplayPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<Toast[]>([]);

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

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(fetchTickets, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  const handleStatusChange = async (ticket: Ticket) => {
    const config = statusConfig[ticket.status];
    const nextStatus = config.nextStatus;

    // ローディング開始
    setLoadingIds((prev) => new Set(prev).add(ticket.id));

    // 楽観更新
    setTickets((prev) =>
      prev.map((t) => (t.id === ticket.id ? { ...t, status: nextStatus } : t))
    );

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update");
      }

      // 成功時は再fetchして最新状態を取得
      await fetchTickets();
    } catch (error) {
      // 失敗時は元に戻す
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: ticket.status } : t))
      );
      alert("更新に失敗しました。再試行してください。");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(ticket.id);
        return next;
      });
    }
  };

  const handleDelete = async (ticket: Ticket, e: React.MouseEvent) => {
    e.stopPropagation(); // カードのクリックイベントを止める

    // ローディング開始
    setLoadingIds((prev) => new Set(prev).add(ticket.id));

    // 楽観更新（削除）
    setTickets((prev) => prev.filter((t) => t.id !== ticket.id));

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete");
      }

      // 成功時はUndoトーストを表示
      showUndoToast(ticket);
    } catch (error) {
      // 失敗時は元に戻す
      setTickets((prev) => [...prev, ticket].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
      alert("削除に失敗しました。");
    } finally {
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(ticket.id);
        return next;
      });
    }
  };

  const showUndoToast = (ticket: Ticket) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [
      ...prev,
      { id, message: `「${ticket.number}」を削除しました`, deletedTicket: ticket },
    ]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  };

  const handleUndo = async (toast: Toast) => {
    if (!toast.deletedTicket) return;

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: toast.deletedTicket.number }),
      });
      if (res.ok) {
        await fetchTickets();
      }
    } catch (error) {
      console.error("Failed to restore ticket:", error);
    }
    setToasts((prev) => prev.filter((t) => t.id !== toast.id));
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const ticketsByStatus = (status: TicketStatus) =>
    tickets.filter((t) => t.status === status);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div className="min-h-screen p-4 md:p-6" style={{ backgroundColor: "#f3f4f6" }}>
      {/* ヘッダー */}
      <div className="max-w-6xl mx-auto mb-6">
        <h1
          className="text-2xl md:text-3xl font-bold text-center mb-4"
          style={{ color: "#111" }}
        >
          番号案内（スタッフ用）
        </h1>

        {/* 更新情報バー */}
        <div
          className="flex items-center justify-between rounded-lg px-4 py-2 shadow"
          style={{ backgroundColor: "#fff" }}
        >
          <div className="text-sm" style={{ color: "#6b7280" }}>
            最終更新:{" "}
            <span style={{ color: "#111", fontWeight: 500 }}>
              {lastUpdated ? formatTime(lastUpdated) : "---"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => fetchTickets()}
            className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium"
            style={{ backgroundColor: "#e5e7eb", color: "#374151" }}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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

        {/* 操作説明 */}
        <div
          className="mt-3 text-center text-sm"
          style={{ color: "#6b7280" }}
        >
          カードをタップでステータス変更 / 右上×で削除
        </div>
      </div>

      {/* 3カラムレイアウト */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto">
        {(["waiting", "calling", "serving"] as const).map((status) => {
          const config = statusConfig[status];
          const statusTickets = ticketsByStatus(status);

          return (
            <div
              key={status}
              className="rounded-lg p-4 min-h-[300px] md:min-h-[400px]"
              style={{
                backgroundColor: config.bgColor,
                border: `4px solid ${config.borderColor}`,
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2
                  className="text-lg md:text-xl font-bold"
                  style={{ color: "#111" }}
                >
                  {config.label}
                </h2>
                <span
                  className="text-sm font-medium px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: config.borderColor,
                    color: "#fff",
                  }}
                >
                  {statusTickets.length}
                </span>
              </div>

              <div className="space-y-3">
                {statusTickets.map((ticket) => {
                  const isLoading = loadingIds.has(ticket.id);

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => !isLoading && handleStatusChange(ticket)}
                      className="relative rounded-lg p-4 shadow cursor-pointer transition-all duration-150 active:scale-95"
                      style={{
                        backgroundColor: isLoading ? "#e5e7eb" : config.cardBg,
                        opacity: isLoading ? 0.7 : 1,
                      }}
                    >
                      {/* 削除ボタン */}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(ticket, e)}
                        disabled={isLoading}
                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:text-red-500 hover:bg-red-100 transition-colors"
                        style={{ fontSize: "16px" }}
                      >
                        ×
                      </button>

                      {/* 番号 */}
                      <div className="text-center">
                        <span
                          className="text-2xl md:text-3xl font-bold"
                          style={{ color: "#111" }}
                        >
                          {ticket.number}
                        </span>
                      </div>

                      {/* 次のアクション表示 */}
                      <div
                        className="text-center mt-2 text-xs md:text-sm"
                        style={{ color: "#6b7280" }}
                      >
                        {isLoading ? (
                          <span className="flex items-center justify-center gap-1">
                            <svg
                              className="animate-spin h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                              />
                            </svg>
                            更新中...
                          </span>
                        ) : (
                          <span>タップ → {config.nextLabel}</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {statusTickets.length === 0 && (
                  <div
                    className="text-center py-8 text-sm"
                    style={{ color: "#9ca3af" }}
                  >
                    なし
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
