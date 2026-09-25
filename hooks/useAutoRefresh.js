/**
 * useAutoRefresh — silently refreshes data on a timer
 * when the app is in the foreground.
 *
 * Usage:
 *   useAutoRefresh(fetchData);         // calls fetchData every 60 seconds (default)
 *   useAutoRefresh(fetchData, 120);    // custom interval in seconds
 */

import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';

export function useAutoRefresh(callback, intervalSeconds = 60) {
  const intervalMs = intervalSeconds * 1000;
  const appState = useRef(AppState.currentState);
  const timerRef = useRef(null);
  const cbRef = useRef(callback);

  // Keep callback ref fresh without restarting the timer
  useEffect(() => { cbRef.current = callback; }, [callback]);

  useEffect(() => {
    const start = () => {
      if (timerRef.current) return; // already running
      timerRef.current = setInterval(() => {
        if (appState.current === 'active') {
          cbRef.current?.();
        }
      }, intervalMs);
    };

    const stop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };

    // Start immediately
    start();

    // Pause when app goes to background, resume when foreground
    const sub = AppState.addEventListener('change', (nextState) => {
      appState.current = nextState;
      if (nextState === 'active') {
        stop();
        start();
        // Fire immediately on resume so data is always fresh
        cbRef.current?.();
      } else {
        stop();
      }
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [intervalMs]);
}
