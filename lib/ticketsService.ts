/**
 * Tickets Service - localStorage based data layer
 *
 * 唯一のデータソース: ブラウザのlocalStorage
 * 同期方法: storageイベント + BroadcastChannel
 *
 * 将来Supabaseへ差し替える場合は、このファイルの実装を変更するだけでOK
 */

export type TicketStatus = "waiting" | "calling" | "serving";

export interface Ticket {
  id: string;
  number: string;
  status: TicketStatus;
  createdAt: number;
}

const STORAGE_KEY = "annex-rental-tickets";
const CHANNEL_NAME = "annex-rental-sync";

// BroadcastChannel for same-origin tab sync (localStorage storage event doesn't fire in same tab)
let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined") return null;
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      // BroadcastChannel not supported
    }
  }
  return broadcastChannel;
}

function notifyChange(): void {
  const channel = getBroadcastChannel();
  if (channel) {
    channel.postMessage({ type: "tickets-updated" });
  }
}

// --- Core CRUD Operations ---

export function getAllTickets(): Ticket[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    const tickets: Ticket[] = JSON.parse(data);
    return tickets.sort((a, b) => b.createdAt - a.createdAt);
  } catch {
    return [];
  }
}

function saveTickets(tickets: Ticket[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  notifyChange();
}

/**
 * 番号を追加
 * - 同じ番号が既に存在する場合は、そのチケットをwaitingに戻す
 * - 存在しない場合は新規作成
 */
export function addTicket(number: string): { ticket: Ticket; isExisting: boolean } {
  const tickets = getAllTickets();
  const trimmedNumber = number.trim();

  // 同じ番号が存在するかチェック
  const existingIndex = tickets.findIndex(
    (t) => t.number.toLowerCase() === trimmedNumber.toLowerCase()
  );

  if (existingIndex !== -1) {
    // 既存チケットをwaitingに戻す
    tickets[existingIndex].status = "waiting";
    saveTickets(tickets);
    return { ticket: tickets[existingIndex], isExisting: true };
  }

  // 新規作成
  const ticket: Ticket = {
    id: crypto.randomUUID(),
    number: trimmedNumber,
    status: "waiting",
    createdAt: Date.now(),
  };
  tickets.push(ticket);
  saveTickets(tickets);
  return { ticket, isExisting: false };
}

export function updateTicketStatus(id: string, status: TicketStatus): Ticket | null {
  const tickets = getAllTickets();
  const ticket = tickets.find((t) => t.id === id);
  if (!ticket) return null;

  ticket.status = status;
  saveTickets(tickets);
  return ticket;
}

export function deleteTicket(id: string): Ticket | null {
  const tickets = getAllTickets();
  const index = tickets.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const [deleted] = tickets.splice(index, 1);
  saveTickets(tickets);
  return deleted;
}

/**
 * 削除したチケットを復元（Undo用）
 */
export function restoreTicket(ticket: Ticket): void {
  const tickets = getAllTickets();
  // 同じIDが存在しないことを確認
  if (!tickets.find((t) => t.id === ticket.id)) {
    tickets.push(ticket);
    saveTickets(tickets);
  }
}

// --- Subscription for real-time sync ---

type Listener = (tickets: Ticket[]) => void;

export function subscribeToTickets(listener: Listener): () => void {
  if (typeof window === "undefined") return () => {};

  // storageイベント（別タブからの変更を検知）
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      listener(getAllTickets());
    }
  };

  // BroadcastChannel（同一タブ内の変更を検知）
  const channel = getBroadcastChannel();
  const handleBroadcast = () => {
    listener(getAllTickets());
  };

  window.addEventListener("storage", handleStorage);
  channel?.addEventListener("message", handleBroadcast);

  return () => {
    window.removeEventListener("storage", handleStorage);
    channel?.removeEventListener("message", handleBroadcast);
  };
}
