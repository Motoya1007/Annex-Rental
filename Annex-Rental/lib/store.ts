export type TicketStatus = "waiting" | "calling" | "serving";

export interface Ticket {
  id: string;
  number: string;
  status: TicketStatus;
  createdAt: number;
}

interface TicketStore {
  tickets: Ticket[];
}

// globalThisを使ってホットリロードでもデータを維持
const globalForStore = globalThis as unknown as {
  ticketStore: TicketStore | undefined;
};

const store: TicketStore = globalForStore.ticketStore ?? { tickets: [] };

if (!globalForStore.ticketStore) {
  globalForStore.ticketStore = store;
}

export function getAllTickets(): Ticket[] {
  return [...store.tickets].sort((a, b) => b.createdAt - a.createdAt);
}

export function addTicket(number: string): Ticket {
  const ticket: Ticket = {
    id: crypto.randomUUID(),
    number,
    status: "waiting",
    createdAt: Date.now(),
  };
  store.tickets.push(ticket);
  return ticket;
}

export function updateTicketStatus(
  id: string,
  status: TicketStatus
): Ticket | null {
  const ticket = store.tickets.find((t) => t.id === id);
  if (!ticket) return null;
  ticket.status = status;
  return ticket;
}

export function deleteTicket(id: string): boolean {
  const index = store.tickets.findIndex((t) => t.id === id);
  if (index === -1) return false;
  store.tickets.splice(index, 1);
  return true;
}
