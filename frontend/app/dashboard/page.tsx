'use client';

import { Navigation } from '@/components/layout/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VestingSchedule } from '@/components/ido/vesting-schedule';
import { useAccount } from 'wagmi';
import { useUserContribution, useUserScheduleIds, TierType } from '@/lib/contracts/hooks';
import { formatEther } from 'viem';
import { Loader2, Wallet, TrendingUp } from 'lucide-react';

const tiers: { type: TierType; name: string }[] = [
  { type: 0, name: 'Seed' },
  { type: 1, name: 'Private' },
  { type: 2, name: 'Public' },
];

export default function DashboardPage() {
  const { address, isConnected } = useAccount();

  const { contribution: seedContribution, isLoading: seedLoading } = useUserContribution(0);
  const { contribution: privateContribution, isLoading: privateLoading } = useUserContribution(1);
  const { contribution: publicContribution, isLoading: publicLoading } = useUserContribution(2);

  const { scheduleIds, isLoading: schedulesLoading } = useUserScheduleIds();

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container py-12">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wallet className="h-12 w-12 text-muted-foreground mb-4" />
              <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to view your dashboard
              </p>
              <appkit-button />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const contributions = [
    { tier: 'Seed', data: seedContribution, loading: seedLoading },
    { tier: 'Private', data: privateContribution, loading: privateLoading },
    { tier: 'Public', data: publicContribution, loading: publicLoading },
  ];

  const totalContributed =
    (seedContribution?.contributed || 0n) +
    (privateContribution?.contributed || 0n) +
    (publicContribution?.contributed || 0n);

  const totalTokens =
    (seedContribution?.tokensAllocated || 0n) +
    (privateContribution?.tokensAllocated || 0n) +
    (publicContribution?.tokensAllocated || 0n) +
    (seedContribution?.referralBonus || 0n) +
    (privateContribution?.referralBonus || 0n) +
    (publicContribution?.referralBonus || 0n);

  const hasAnyContribution = totalContributed > 0n;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container py-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
            <p className="text-lg text-muted-foreground">
              Track your contributions and vesting schedules
            </p>
          </div>

          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Contributed
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatEther(totalContributed)} ETH</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatEther(totalTokens)} PULSE</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Vesting Schedules
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{scheduleIds.length}</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="contributions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="contributions">My Contributions</TabsTrigger>
              <TabsTrigger value="vesting">Vesting Schedules</TabsTrigger>
            </TabsList>

            <TabsContent value="contributions" className="space-y-4">
              {!hasAnyContribution ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Contributions Yet</h2>
                    <p className="text-muted-foreground">
                      Start contributing to a tier to see your allocations here
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contributions.map(({ tier, data, loading }) => {
                    if (loading) {
                      return (
                        <Card key={tier}>
                          <CardContent className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </CardContent>
                        </Card>
                      );
                    }

                    if (!data || data.contributed === 0n) {
                      return null;
                    }

                    return (
                      <Card key={tier}>
                        <CardHeader>
                          <CardTitle>{tier} Tier</CardTitle>
                          <CardDescription>Your contribution details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Contributed</p>
                            <p className="text-2xl font-bold">
                              {formatEther(data.contributed)} ETH
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Tokens Allocated</p>
                            <p className="text-xl font-bold">
                              {formatEther(data.tokensAllocated)} PULSE
                            </p>
                          </div>
                          {data.referralBonus > 0n && (
                            <div>
                              <p className="text-sm text-muted-foreground">Referral Bonus</p>
                              <p className="text-xl font-bold text-green-500">
                                +{formatEther(data.referralBonus)} PULSE
                              </p>
                            </div>
                          )}
                          <div className="pt-2 border-t">
                            <p className="text-sm text-muted-foreground">TGE Status</p>
                            <p className="font-medium">
                              {data.hasClaimedTGE ? (
                                <span className="text-green-500">Claimed ✓</span>
                              ) : (
                                <span className="text-yellow-500">Pending</span>
                              )}
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            <TabsContent value="vesting" className="space-y-4">
              {schedulesLoading ? (
                <Card>
                  <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </CardContent>
                </Card>
              ) : scheduleIds.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">No Vesting Schedules</h2>
                    <p className="text-muted-foreground">
                      Vesting schedules will appear here after you claim TGE tokens
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {scheduleIds.map((scheduleId) => (
                    <VestingSchedule key={scheduleId.toString()} scheduleId={scheduleId} />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
