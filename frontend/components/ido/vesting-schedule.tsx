'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useVestingSchedule, useClaimableAmount, useClaimVested } from '@/lib/contracts/hooks';
import { formatEther } from 'viem';
import { format } from 'date-fns';
import { Loader2, Clock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useEffect } from 'react';

interface VestingScheduleProps {
  scheduleId: bigint;
}

export function VestingSchedule({ scheduleId }: VestingScheduleProps) {
  const { schedule, isLoading: scheduleLoading } = useVestingSchedule(scheduleId);
  const { claimableAmount = 0n, refetch: refetchClaimable } = useClaimableAmount(scheduleId);
  const { claim, isPending, isConfirming, isSuccess, error } = useClaimVested();

  useEffect(() => {
    if (isSuccess) {
      toast.success('Tokens claimed successfully!');
      refetchClaimable();
    }
  }, [isSuccess, refetchClaimable]);

  useEffect(() => {
    if (error) {
      toast.error('Failed to claim tokens');
    }
  }, [error]);

  if (scheduleLoading || !schedule) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const now = Date.now() / 1000;
  const cliffEnd = schedule.startTime + schedule.cliffDuration;
  const vestingEnd = schedule.startTime + schedule.duration;
  const isCliffPassed = now >= cliffEnd;
  const isVestingComplete = now >= vestingEnd;

  const vestedPercentage = Math.min(
    ((now - schedule.startTime) / schedule.duration) * 100,
    100
  );

  const releasedPercentage =
    (Number(schedule.releasedAmount) / Number(schedule.totalAmount)) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Vesting Schedule #{scheduleId.toString()}
          {schedule.revoked && (
            <span className="text-sm text-destructive">(Revoked)</span>
          )}
        </CardTitle>
        <CardDescription>
          Track your token vesting progress and claim unlocked tokens
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* TGE Amount */}
        <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">TGE Release</p>
            <p className="text-2xl font-bold">{formatEther(schedule.tgeAmount)} PULSE</p>
          </div>
          <CheckCircle2 className="h-6 w-6 text-green-500" />
        </div>

        {/* Vesting Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Vesting Progress</span>
            <span className="font-medium">{vestedPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={vestedPercentage} className="h-2" />
        </div>

        {/* Released Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Claimed</span>
            <span className="font-medium">{releasedPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={releasedPercentage} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatEther(schedule.releasedAmount)} PULSE</span>
            <span>{formatEther(schedule.totalAmount)} PULSE</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Start
            </p>
            <p className="font-medium">
              {format(new Date(schedule.startTime * 1000), 'MMM d, yyyy')}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Cliff End
            </p>
            <p className="font-medium">
              {format(new Date(cliffEnd * 1000), 'MMM d, yyyy')}
            </p>
            {!isCliffPassed && (
              <p className="text-xs text-muted-foreground">
                {Math.ceil((cliffEnd - now) / 86400)} days left
              </p>
            )}
          </div>
          <div>
            <p className="text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              End
            </p>
            <p className="font-medium">
              {format(new Date(vestingEnd * 1000), 'MMM d, yyyy')}
            </p>
            {!isVestingComplete && (
              <p className="text-xs text-muted-foreground">
                {Math.ceil((vestingEnd - now) / 86400)} days left
              </p>
            )}
          </div>
        </div>

        {/* Claimable Amount */}
        <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Claimable Now</p>
            <p className="text-2xl font-bold">{formatEther(claimableAmount)} PULSE</p>
          </div>
          <Button
            onClick={() => claim(scheduleId)}
            disabled={claimableAmount === 0n || isPending || isConfirming || schedule.revoked}
          >
            {(isPending || isConfirming) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isPending || isConfirming ? 'Claiming...' : 'Claim'}
          </Button>
        </div>

        {!isCliffPassed && (
          <div className="text-sm text-muted-foreground text-center p-3 bg-muted rounded-lg">
            Tokens will unlock after the cliff period ends
          </div>
        )}
      </CardContent>
    </Card>
  );
}
