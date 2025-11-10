'use client';

import { Navigation } from '@/components/layout/navigation';
import { IdoCard } from '@/components/ido/ido-card';
import { useAllSales, useSaleConfig } from '@/lib/contracts/hooks/use-factory';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Rocket, Shield, TrendingUp, Users, Plus } from 'lucide-react';
import Link from 'next/link';
import { Address } from 'viem';
import { useState } from 'react';

export default function HomePage() {
  const { sales, isLoading } = useAllSales();
  const [filter, setFilter] = useState<'all' | 'active' | 'upcoming' | 'completed'>('all');

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 gradient-bg opacity-50" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl animate-fadeInUp">
              Welcome to Pulsar IDO
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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

      {/* IDO Sales */}
      <section className="py-16 border-t">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Token Sales</h2>
            <p className="text-muted-foreground">
              Explore and participate in active token sales on Pulsar
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {(['all', 'active', 'upcoming', 'completed'] as const).map((f) => (
              <Button
                key={f}
                variant={filter === f ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-[300px] w-full" />
              ))}
            </div>
          ) : sales && sales.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sales.map((sale) => (
                <SaleCard key={sale.saleId.toString()} sale={sale} filter={filter} />
              ))}
            </div>
          ) : (
            <Card className="max-w-md mx-auto">
              <CardHeader className="text-center">
                <CardTitle>No Sales Available</CardTitle>
                <CardDescription>
                  There are currently no token sales. Check back later!
                </CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5" />
              <span className="font-semibold">Pulsar IDO</span>
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

function SaleCard({ sale, filter }: { sale: any; filter: string }) {
  const { config, isLoading } = useSaleConfig(sale.saleAddress as Address);

  if (isLoading || !config) {
    return <Skeleton className="h-[300px] w-full" />;
  }

  const now = BigInt(Math.floor(Date.now() / 1000));
  const status = config.isFinalized ? 'completed' :
    config.isPaused ? 'paused' :
    now < config.startTime ? 'upcoming' :
    now >= config.startTime && now <= config.endTime ? 'active' :
    'completed';

  // Filter logic
  if (filter !== 'all' && status !== filter) {
    return null;
  }

  const progress = config.hardCap > BigInt(0)
    ? Number((config.totalRaised * BigInt(100)) / config.hardCap)
    : 0;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Sale #{sale.saleId.toString()}</CardTitle>
            <CardDescription className="mt-1">
              Created {new Date(Number(sale.createdAt) * 1000).toLocaleDateString()}
            </CardDescription>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
            status === 'active' ? 'bg-green-500/10 text-green-500' :
            status === 'upcoming' ? 'bg-blue-500/10 text-blue-500' :
            status === 'paused' ? 'bg-red-500/10 text-red-500' :
            'bg-gray-500/10 text-gray-500'
          }`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Raised</span>
            <span>{(Number(config.totalRaised) / 1e18).toFixed(2)} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hard Cap</span>
            <span>{(Number(config.hardCap) / 1e18).toFixed(2)} ETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Token Price</span>
            <span>{(Number(config.tokenPrice) / 1e18).toFixed(6)} ETH</span>
          </div>
        </div>

        <Button asChild className="w-full">
          <Link href={`/ido/${sale.saleId}`}>
            View Details
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
