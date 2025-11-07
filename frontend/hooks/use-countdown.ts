import { useState, useEffect } from 'react';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

export function useCountdown(targetTimestamp: number): TimeLeft {
  const calculateTimeLeft = (): TimeLeft => {
    const now = Date.now() / 1000;
    const difference = targetTimestamp - now;

    if (difference <= 0) {
      return {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
      };
    }

    return {
      days: Math.floor(difference / 86400),
      hours: Math.floor((difference % 86400) / 3600),
      minutes: Math.floor((difference % 3600) / 60),
      seconds: Math.floor(difference % 60),
      isExpired: false,
    };
  };

  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetTimestamp]);

  return timeLeft;
}

export function formatCountdown(timeLeft: TimeLeft): string {
  if (timeLeft.isExpired) {
    return 'Expired';
  }

  const parts: string[] = [];

  if (timeLeft.days > 0) {
    parts.push(`${timeLeft.days}d`);
  }
  if (timeLeft.hours > 0 || timeLeft.days > 0) {
    parts.push(`${timeLeft.hours}h`);
  }
  if (timeLeft.minutes > 0 || timeLeft.hours > 0 || timeLeft.days > 0) {
    parts.push(`${timeLeft.minutes}m`);
  }
  parts.push(`${timeLeft.seconds}s`);

  return parts.join(' ');
}
