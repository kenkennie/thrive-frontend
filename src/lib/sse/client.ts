import { tokenStorage } from "@/lib/api/client";

export type SSEEventType =
  | "appointment.created"
  | "appointment.confirmed"
  | "appointment.cancelled"
  | "appointment.checked_in"
  | "appointment.completed"
  | "appointment.no_show"
  | "appointment.rescheduled"
  | "invoice.issued"
  | "invoice.paid"
  | "quote.sent";

export type SSEHandler = (data: unknown) => void;

class SSEClient {
  private es: EventSource | null = null;
  private handlers: Map<string, Set<SSEHandler>> = new Map();
  private reconnectMs: number = 3000;
  private maxReconnect: number = 5;
  private attempt: number = 0;
  private active: boolean = false;

  connect(): void {
    if (this.es || !this.active) return;

    const token = tokenStorage.getAccess();
    if (!token) return;

    const base = process.env.NEXT_PUBLIC_API_URL;

    const url = `${base}/events?token=${encodeURIComponent(token)}&t=${Date.now()}`;

    this.es = new EventSource(url, { withCredentials: false });

    // Attach a header via URL param since EventSource doesn't support custom headers
    // Backend should accept ?token= as alternative to Authorization header
    // If backend only accepts Authorization, use a fetch-based SSE polyfill instead

    this.es.onopen = () => {
      this.attempt = 0;
      console.debug("[SSE] Connected");
    };

    this.es.onerror = () => {
      this.es?.close();
      this.es = null;

      if (!this.active) return;

      if (this.attempt < this.maxReconnect) {
        this.attempt++;
        const delay = this.reconnectMs * Math.pow(1.5, this.attempt - 1);
        console.debug(
          `[SSE] Reconnecting in ${delay}ms (attempt ${this.attempt})`,
        );
        setTimeout(() => this.connect(), delay);
      } else {
        console.warn("[SSE] Max reconnect attempts reached");
      }
    };

    this.es.onmessage = (e) => {
      this.dispatch("message", e.data);
    };

    // Listen for named event types
    const eventTypes: SSEEventType[] = [
      "appointment.created",
      "appointment.confirmed",
      "appointment.cancelled",
      "appointment.checked_in",
      "appointment.completed",
      "appointment.no_show",
      "appointment.rescheduled",
      "invoice.issued",
      "invoice.paid",
      "quote.sent",
    ];

    eventTypes.forEach((type) => {
      this.es!.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          this.dispatch(type, data);
        } catch {
          this.dispatch(type, e.data);
        }
      });
    });
  }

  disconnect(): void {
    this.active = false;
    this.es?.close();
    this.es = null;
    console.debug("[SSE] Disconnected");
  }

  start(): void {
    this.active = true;
    this.attempt = 0;
    this.connect();
  }

  on(event: string, handler: SSEHandler): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    return () => this.handlers.get(event)?.delete(handler);
  }

  private dispatch(event: string, data: unknown): void {
    this.handlers.get(event)?.forEach((h) => h(data));
    this.handlers.get("*")?.forEach((h) => h({ event, data }));
  }
}

export const sseClient = new SSEClient();
