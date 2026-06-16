interface EventsRealtimeClientOptions {
  getUrl: () => string
  onOpen: (context: { shouldRefresh: boolean }) => void
  onClose: () => void
  onMessage: (message: MessageEvent) => void
}

function calcReconnectionTime(reconnectAttempts: number): number {
  return Math.min(1000 * 2 ** reconnectAttempts, 15000)
}

export class EventsRealtimeClient {
  private readonly options: EventsRealtimeClientOptions
  private socket: WebSocket | null = null
  private reconnectTimer: number | null = null
  private reconnectAttempts = 0
  private closed = false
  private hasOpenedOnce = false

  constructor(options: EventsRealtimeClientOptions) {
    this.options = options
  }

  start() {
    this.closed = false
    this.connect()

    window.addEventListener('online', this.reconnectNow)
    window.addEventListener('offline', this.handleOffline)
  }

  stop() {
    this.closed = true

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    window.removeEventListener('online', this.reconnectNow)
    window.removeEventListener('offline', this.handleOffline)

    const currentSocket = this.socket
    this.socket = null
    currentSocket?.close()
  }

  private readonly reconnectNow = () => {
    if (this.closed) return

    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    const previousSocket = this.socket
    this.socket = null
    previousSocket?.close()
    this.connect()
  }

  private readonly handleOffline = () => {
    this.options.onClose()
  }

  private scheduleReconnect() {
    if (this.closed || this.reconnectTimer !== null) return

    const delay = calcReconnectionTime(this.reconnectAttempts)
    this.reconnectAttempts += 1

    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null
      this.connect()
    }, delay)
  }

  private connect() {
    if (this.closed) return

    if (
      this.socket &&
      (this.socket.readyState === WebSocket.CONNECTING ||
        this.socket.readyState === WebSocket.OPEN)
    ) {
      return
    }

    const nextSocket = new WebSocket(this.options.getUrl())
    this.socket = nextSocket

    nextSocket.onopen = () => {
      if (this.socket !== nextSocket) return

      const shouldRefresh = this.hasOpenedOnce || this.reconnectAttempts > 0

      this.hasOpenedOnce = true
      this.reconnectAttempts = 0
      this.options.onOpen({ shouldRefresh })
    }

    nextSocket.onclose = () => {
      if (this.socket !== nextSocket) return

      this.options.onClose()
      this.scheduleReconnect()
    }

    nextSocket.onerror = () => {
      if (this.socket !== nextSocket) return

      nextSocket.close()
    }

    nextSocket.onmessage = (message) => {
      if (this.socket !== nextSocket) return

      this.options.onMessage(message)
    }
  }
}
