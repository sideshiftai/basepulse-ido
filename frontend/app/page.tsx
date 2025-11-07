'use client';

import { Navigation } from '@/components/layout/navigation';
import { IdoCard } from '@/components/ido/ido-card';
import { useIdoDetails, useTierInfo } from '@/lib/contracts/hooks';
import { Skeleton } from '@/components/ui/skeleton';
import { Rocket, Shield, TrendingUp, Users } from 'lucide-react';

export default function HomePage() {
  const { saleActive } = useIdoDetails();
  const { tierInfo: seedTier, isLoading: seedLoading } = useTierInfo(0);
  const { tierInfo: privateTier, isLoading: privateLoading } = useTierInfo(1);
  const { tierInfo: publicTier, isLoading: publicLoading } = useTierInfo(2);

  const isLoading = seedLoading || privateLoading || publicLoading;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-50" />
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl animate-fadeInUp">
              Welcome to BasePulse IDO
            </h1>
            <p className="text-xl text-muted-foreground animate-fadeInUp animate-delay-100">
              Participate in token sales with transparent vesting, multi-tier allocations,
              and referral bonuses on Base blockchain
            </p>
            <div className="flex items-center justify-center gap-4 animate-fadeInUp animate-delay-200">
              <appkit-button />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 border-t">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg border bg-card text-center space-y-2">
              <Shield className="h-10 w-10 mx-auto text-primary" />
              <h3 className="font-semibold">Secure & Audited</h3>
              <p className="text-sm text-muted-foreground">
                Smart contracts built with OpenZeppelin standards
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card text-center space-y-2">
              <Users className="h-10 w-10 mx-auto text-primary" />
              <h3 className="font-semibold">Multi-Tier System</h3>
              <p className="text-sm text-muted-foreground">
                Seed, Private, and Public sale tiers
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card text-center space-y-2">
              <TrendingUp className="h-10 w-10 mx-auto text-primary" />
              <h3 className="font-semibold">Vesting Schedule</h3>
              <p className="text-sm text-muted-foreground">
                Transparent token release with cliff periods
              </p>
            </div>
            <div className="p-6 rounded-lg border bg-card text-center space-y-2">
              <Rocket className="h-10 w-10 mx-auto text-primary" />
              <h3 className="font-semibold">Referral Bonuses</h3>
              <p className="text-sm text-muted-foreground">
                Earn 10% bonus tokens with referrals
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* IDO Tiers */}
      <section className="py-16 border-t">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Active Token Sales</h2>
            <p className="text-muted-foreground">
              Choose your tier and participate in the PULSE token sale
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[400px] w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {seedTier && (
                <IdoCard
                  id="seed"
                  name="PULSE Token"
                  description="Early-stage investment tier with maximum bonus"
                  tierInfo={seedTier}
                  tierType={0}
                  isActive={saleActive}
                />
              )}
              {privateTier && (
                <IdoCard
                  id="private"
                  name="PULSE Token"
                  description="Private sale tier for strategic investors"
                  tierInfo={privateTier}
                  tierType={1}
                  isActive={saleActive}
                />
              )}
              {publicTier && (
                <IdoCard
                  id="public"
                  name="PULSE Token"
                  description="Open to all participants"
                  tierInfo={publicTier}
                  tierType={2}
                  isActive={saleActive}
                />
              )}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              <span className="font-semibold">BasePulse IDO</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Built on Base Sepolia • Powered by Smart Contracts
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
