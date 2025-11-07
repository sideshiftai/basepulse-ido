'use client';

import { useCountdown } from '@/hooks/use-countdown';
import { Clock } from 'lucide-react';

interface CountdownProps {
  targetTimestamp: number;
  label?: string;
  className?: string;
}

export function Countdown({ targetTimestamp, label, className = '' }: CountdownProps) {
  const timeLeft = useCountdown(targetTimestamp);

  if (timeLeft.isExpired) {
    return null;
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Clock className="h-4 w-4" />
      <div className="flex items-center gap-1">
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
        <div className="flex gap-2 font-mono font-medium">
          {timeLeft.days > 0 && (
            <div className="flex flex-col items-center min-w-[2.5rem] bg-muted rounded px-2 py-1">
              <span className="text-lg">{timeLeft.days}</span>
              <span className="text-[10px] text-muted-foreground uppercase">days</span>
            </div>
          )}
          <div className="flex flex-col items-center min-w-[2.5rem] bg-muted rounded px-2 py-1">
            <span className="text-lg">{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className="text-[10px] text-muted-foreground uppercase">hrs</span>
          </div>
          <div className="flex flex-col items-center min-w-[2.5rem] bg-muted rounded px-2 py-1">
            <span className="text-lg">{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className="text-[10px] text-muted-foreground uppercase">min</span>
          </div>
          <div className="flex flex-col items-center min-w-[2.5rem] bg-muted rounded px-2 py-1">
            <span className="text-lg">{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className="text-[10px] text-muted-foreground uppercase">sec</span>
          </div>
        </div>
      </div>
    </div>
  );
}
