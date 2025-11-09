'use client';

import { useParams } from 'next/navigation';
import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ContributeDialog } from '@/components/ido/contribute-dialog';
import { useAccount } from 'wagmi';
import { useTierInfo, useUserContribution, useClaimTGE, TierType } from '@/lib/contracts/hooks';
import { formatEther } from 'viem';
import { format } from 'date-fns';
import { Loader2, Coins, Clock, TrendingUp, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useEffect } from 'react';

const tierMap: Record<string, TierType> = {
  seed: 0,
  private: 1,
  public: 2,
};

const tierNames = ['Seed Sale', 'Private Sale', 'Public Sale'];

export default function IdoDetailsPage() {
  const params = useParams();
  const tierId = params.id as string;
  const tierType = tierMap[tierId] ?? 2;

  const { address, isConnected } = useAccount();
  const { tierInfo, isLoading: tierLoading } = useTierInfo(tierType);
  const { contribution, isLoading: contributionLoading, refetch } = useUserContribution(tierType);
  const { claim, isPending, isConfirming, isSuccess, error } = useClaimTGE();

  useEffect(() => {
    if (isSuccess) {
      toast.success('TGE tokens claimed successfully!');
      refetch();
    }
  }, [isSuccess, refetch]);

  useEffect(() => {
    if (error) {
      toast.error('Failed to claim TGE tokens');
    }
  }, [error]);

  if (tierLoading || !tierInfo) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const now = Date.now() / 1000;
  const isActive = now >= tierInfo.startTime && now <= tierInfo.endTime;
  const isUpcoming = now < tierInfo.startTime;
  const isEnded = now > tierInfo.endTime;
  const progressPercent = Number((tierInfo.totalContributed * 100n) / tierInfo.allocation);

  const hasContributed = contribution && contribution.contributed > 0n;
  const canClaimTGE = hasContributed && !contribution.hasClaimedTGE && isEnded;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h1 className="text-4xl font-bold">PULSE Token - {tierNames[tierType]}</h1>
              <Badge variant={isActive ? 'default' : isEnded ? 'secondary' : 'outline'}>
                {isEnded ? 'Ended' : isActive ? 'Live' : 'Upcoming'}
              </Badge>
            </div>
            <p className="text-lg text-muted-foreground">
              Participate in the {tierNames[tierType].toLowerCase()} and receive PULSE tokens with vesting
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <Coins className="h-4 w-4 inline mr-1" />
                  Token Price
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatEther(tierInfo.tokenPrice)} ETH</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4 inline mr-1" />
                  Total Raised
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{formatEther(tierInfo.totalContributed)} ETH</p>
                <p className="text-xs text-muted-foreground">
                  of {formatEther(tierInfo.allocation)} ETH
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <Users className="h-4 w-4 inline mr-1" />
                  Your Contribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {hasContributed ? formatEther(contribution.contributed) : '0'} ETH
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4 inline mr-1" />
                  {isEnded ? 'Ended' : isActive ? 'Ends' : 'Starts'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">
                  {isEnded
                    ? format(new Date(tierInfo.endTime * 1000), 'MMM d')
                    : isActive
                    ? format(new Date(tierInfo.endTime * 1000), 'MMM d')
                    : format(new Date(tierInfo.startTime * 1000), 'MMM d')}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Progress */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sale Progress</CardTitle>
                <span className="text-2xl font-bold">{progressPercent.toFixed(2)}%</span>
              </div>
            </CardHeader>
            <CardContent>
              <Progress value={progressPercent} className="h-3" />
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs defaultValue="contribute" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="contribute">Contribute</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="your-allocation">Your Allocation</TabsTrigger>
            </TabsList>

            <TabsContent value="contribute" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Contribute to Sale</CardTitle>
                  <CardDescription>
                    Min: {formatEther(tierInfo.minContribution)} ETH | Max:{' '}
                    {formatEther(tierInfo.maxContribution)} ETH
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!isConnected ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">Connect your wallet to participate</p>
                      <appkit-button />
                    </div>
                  ) : !isActive ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">
                        {isUpcoming ? 'Sale has not started yet' : 'Sale has ended'}
                      </p>
                    </div>
                  ) : (
                    <ContributeDialog
                      tierType={tierType}
                      minContribution={tierInfo.minContribution}
                      maxContribution={tierInfo.maxContribution}
                    >
                      <Button size="lg" className="w-full">
                        Contribute Now
                      </Button>
                    </ContributeDialog>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Sale Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Start Time</p>
                      <p className="font-medium">
                        {format(new Date(tierInfo.startTime * 1000), 'PPpp')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Time</p>
                      <p className="font-medium">
                        {format(new Date(tierInfo.endTime * 1000), 'PPpp')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Accepted Payments</p>
                      <p className="font-medium">ETH, USDC</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Referral Bonus</p>
                      <p className="font-medium">10%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="your-allocation" className="space-y-4">
              {!isConnected ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Connect your wallet to view your allocation
                    </p>
                    <appkit-button />
                  </CardContent>
                </Card>
              ) : contributionLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </CardContent>
                </Card>
              ) : !hasContributed ? (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground">
                      You have not contributed to this tier yet
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Allocation</CardTitle>
                    <CardDescription>Tokens you will receive from this sale</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Contribution</p>
                        <p className="text-2xl font-bold">
                          {formatEther(contribution.contributed)} ETH
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Tokens Allocated</p>
                        <p className="text-2xl font-bold">
                          {formatEther(contribution.tokensAllocated)} PULSE
                        </p>
                      </div>
                      {contribution.referralBonus > 0n && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">Referral Bonus</p>
                            <p className="text-2xl font-bold text-green-500">
                              +{formatEther(contribution.referralBonus)} PULSE
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Total Tokens</p>
                            <p className="text-2xl font-bold">
                              {formatEther(
                                contribution.tokensAllocated + contribution.referralBonus
                              )}{' '}
                              PULSE
                            </p>
                          </div>
                        </>
                      )}
                    </div>

                    {canClaimTGE && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => claim(tierType)}
                          disabled={isPending || isConfirming}
                          className="w-full"
                          size="lg"
                        >
                          {isPending || isConfirming ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Claiming...
                            </>
                          ) : (
                            'Claim TGE Tokens'
                          )}
                        </Button>
                        <p className="text-xs text-muted-foreground text-center mt-2">
                          Claim your initial token release
                        </p>
                      </div>
                    )}

                    {contribution.hasClaimedTGE && (
                      <div className="text-center p-4 bg-green-500/10 rounded-lg">
                        <p className="text-sm text-green-600 dark:text-green-400">
                          TGE tokens claimed! View your vesting schedule in the Dashboard
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
