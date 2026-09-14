"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSSEUrl } from "../lib/api";

export function useRealtimeUsage(onUpdate?: () => void) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState<Date | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const triggerUpdate = useCallback(() => {
    setLastEventTime(new Date());
    if (onUpdateRef.current) {
      onUpdateRef.current();
    }
  }, []);

  useEffect(() => {
    let reconnectTimeout: NodeJS.Timeout;

    function connect() {
      try {
        const sseUrl = getSSEUrl();
        const es = new EventSource(sseUrl);
        eventSourceRef.current = es;

        es.onopen = () => {
          setIsConnected(true);
        };

        es.addEventListener("usage", (event) => {
          triggerUpdate();
        });

        es.addEventListener("ping", () => {
          setIsConnected(true);
        });

        es.onerror = () => {
          setIsConnected(false);
          es.close();
          // Attempt reconnection after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch (err) {
        setIsConnected(false);
        reconnectTimeout = setTimeout(connect, 5000);
      }
    }

    connect();

    // Fallback polling interval every 45s if SSE disconnects
    const fallbackInterval = setInterval(() => {
      if (!eventSourceRef.current || eventSourceRef.current.readyState !== EventSource.OPEN) {
        triggerUpdate();
      }
    }, 45000);

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(fallbackInterval);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [triggerUpdate]);

  return { isConnected, lastEventTime, triggerUpdate };
}
