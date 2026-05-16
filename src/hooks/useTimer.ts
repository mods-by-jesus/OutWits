import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  duration: number;
  onExpire: () => void;
  autoStart?: boolean;
}

export function useTimer({ duration, onExpire, autoStart = true }: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);

  // Keep callback ref fresh inside an effect (not during render)
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  const stop = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const reset = useCallback((newDuration?: number) => {
    stop();
    setTimeLeft(newDuration ?? duration);
    setIsRunning(true);
  }, [duration, stop]);

  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = window.setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning]);

  // Handle expiry: use interval check instead of setState in effect
  const expiredRef = useRef(false);
  useEffect(() => {
    if (timeLeft === 0 && isRunning && !expiredRef.current) {
      expiredRef.current = true;
      // Clear interval first, then notify
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setIsRunning(false);
      // Call onExpire on next microtask to avoid setState-in-effect
      Promise.resolve().then(() => {
        onExpireRef.current();
      });
    }
  }, [timeLeft, isRunning]);

  // Reset expiredRef when timer is restarted
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      expiredRef.current = false;
    }
  }, [isRunning, timeLeft]);

  return { timeLeft, isRunning, stop, reset };
}
