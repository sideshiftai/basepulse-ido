'use client';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Countdown } from '@/components/ui/countdown';
import { formatEther } from 'viem';
import Link from 'next/link';
import { TierInfo } from '@/lib/contracts/hooks';

interface IdoCardProps {
  id: string;
  name: string;
  description: string;
  tierInfo: TierInfo;
  tierType: 0 | 1 | 2;
  isActive: boolean;
}

const tierNames = ['Seed Sale', 'Private Sale', 'Public Sale'];
const tierColors = {
  0: 'bg-purple-500',
  1: 'bg-blue-500',
  2: 'bg-green-500',
};

export function IdoCard({ id, name, description, tierInfo, tierType, isActive }: IdoCardProps) {
  const now = Date.now() / 1000;
  const isUpcoming = now < tierInfo.startTime;
  const isEnded = now > tierInfo.endTime;
  const progressPercent = tierInfo.allocation > 0n
    ? Number((tierInfo.totalContributed * 100n) / tierInfo.allocation)
    : 0;

  const getStatus = () => {
    if (isEnded) return 'Ended';
    if (isUpcoming) return 'Upcoming';
    if (isActive) return 'Live';
    return 'Inactive';
  };

  const getStatusColor = () => {
    if (isEnded) return 'secondary';
    if (isUpcoming) return 'outline';
    if (isActive) return 'default';
    return 'secondary';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {name}
              <Badge variant={getStatusColor() as any}>{getStatus()}</Badge>
            </CardTitle>
            <CardDescription className="mt-2">{description}</CardDescription>
          </div>
          <Badge className={tierColors[tierType]}>
            {tierNames[tierType]}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progressPercent.toFixed(2)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatEther(tierInfo.totalContributed)} ETH</span>
            <span>{formatEther(tierInfo.allocation)} ETH</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Token Price</p>
            <p className="font-medium">{formatEther(tierInfo.tokenPrice)} ETH</p>
          </div>
          <div>
            <p className="text-muted-foreground">Your Limit</p>
            <p className="font-medium">
              {formatEther(tierInfo.minContribution)} - {formatEther(tierInfo.maxContribution)} ETH
            </p>
          </div>
        </div>

        {isUpcoming && (
          <div className="bg-muted p-3 rounded-lg">
            <Countdown targetTimestamp={tierInfo.startTime} label="Starts in:" />
          </div>
        )}

        {isActive && !isEnded && (
          <div className="bg-muted p-3 rounded-lg">
            <Countdown targetTimestamp={tierInfo.endTime} label="Ends in:" />
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button asChild className="w-full" disabled={!isActive || isEnded}>
          <Link href={`/ido/${id}`}>
            {isEnded ? 'View Details' : isActive ? 'Contribute Now' : 'View Details'}
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
