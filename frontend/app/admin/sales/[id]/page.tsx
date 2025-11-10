'use client';

import { useParams } from 'next/navigation';
import { useSaleById, useSaleConfig, useTierConfig } from '@/lib/contracts/hooks/use-factory';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  ExternalLink,
  Pause,
  Play,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Users,
  TrendingUp
} from 'lucide-react';
import Link from 'next/link';
import { Address, formatEther } from 'viem';
import { NETWORK } from '@/lib/contracts/config';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { IDO_SALE_V2_ABI } from '@/lib/contracts/abis';

export default function SaleManagementPage() {
  const params = useParams();
  const saleId = params?.id ? BigInt(params.id as string) : undefined;

  const { sale, isLoading: isSaleLoading } = useSaleById(saleId);
  const { config, isLoading: isConfigLoading, refetch: refetchConfig } = useSaleConfig(sale?.saleAddress as Address);

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isLoading: isTxConfirming, isSuccess: isTxSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const seedTier = useTierConfig(sale?.saleAddress as Address, 1);
  const privateTier = useTierConfig(sale?.saleAddress as Address, 2);
  const publicTier = useTierConfig(sale?.saleAddress as Address, 3);

  if (isSaleLoading || !sale) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-pulse text-muted-foreground">Loading sale...</div>
        </div>
      </div>
    );
  }

  const handlePauseSale = async () => {
    if (!sale) return;
    try {
      await writeContract({
        address: sale.saleAddress,
        abi: IDO_SALE_V2_ABI,
        functionName: 'pauseSale',
        args: [],
      });
    } catch (error) {
      console.error('Failed to pause sale:', error);
    }
  };

  const handleUnpauseSale = async () => {
    if (!sale) return;
    try {
      await writeContract({
        address: sale.saleAddress,
        abi: IDO_SALE_V2_ABI,
        functionName: 'unpauseSale',
        args: [],
      });
    } catch (error) {
      console.error('Failed to unpause sale:', error);
    }
  };

  const handleFinalizeSale = async () => {
    if (!sale) return;
    if (!confirm('Are you sure you want to finalize this sale? This action cannot be undone.')) {
      return;
    }
    try {
      await writeContract({
        address: sale.saleAddress,
        abi: IDO_SALE_V2_ABI,
        functionName: 'finalizeSale',
        args: [],
      });
    } catch (error) {
      console.error('Failed to finalize sale:', error);
    }
  };

  const handleWithdrawFunds = async () => {
    if (!sale) return;
    try {
      await writeContract({
        address: sale.saleAddress,
        abi: IDO_SALE_V2_ABI,
        functionName: 'withdrawFunds',
        args: [],
      });
    } catch (error) {
      console.error('Failed to withdraw funds:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (timestamp: bigint) => {
    return new Date(Number(timestamp) * 1000).toLocaleString();
  };

  const getStatus = () => {
    if (!config) return 'Unknown';
    const now = BigInt(Math.floor(Date.now() / 1000));

    if (config.isFinalized) return 'Finalized';
    if (config.isPaused) return 'Paused';
    if (now < config.startTime) return 'Upcoming';
    if (now >= config.startTime && now <= config.endTime) return 'Active';
    if (now > config.endTime) return 'Ended';

    return 'Unknown';
  };

  const getStatusBadge = () => {
    const status = getStatus();
    const variants: Record<string, any> = {
      'Active': 'default',
      'Upcoming': 'outline',
      'Ended': 'secondary',
      'Paused': 'destructive',
      'Finalized': 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  const calculateProgress = () => {
    if (!config || config.hardCap === BigInt(0)) return 0;
    return Number((config.totalRaised * BigInt(100)) / config.hardCap);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/sales">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            Sale #{sale.saleId.toString()}
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor your token sale
          </p>
        </div>
        {getStatusBadge()}
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Raised</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config ? formatEther(config.totalRaised) : '0'} ETH
            </div>
            <p className="text-xs text-muted-foreground">
              of {config ? formatEther(config.hardCap) : '0'} ETH hard cap
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateProgress().toFixed(1)}%</div>
            <div className="w-full bg-muted rounded-full h-2 mt-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{ width: `${Math.min(calculateProgress(), 100)}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getStatus()}</div>
            <p className="text-xs text-muted-foreground">
              {config?.isPaused ? 'Sale is paused' : 'Sale is running'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Sale Details */}
      <Card>
        <CardHeader>
          <CardTitle>Sale Information</CardTitle>
          <CardDescription>Contract details and configuration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sale Address</p>
              <div className="flex items-center gap-2">
                <code className="text-sm font-mono">{formatAddress(sale.saleAddress)}</code>
                <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                  <a
                    href={`${NETWORK.blockExplorer}/address/${sale.saleAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Creator</p>
              <code className="text-sm font-mono">{formatAddress(sale.creator)}</code>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Created On</p>
              <p className="text-sm">{formatDate(sale.createdAt)}</p>
            </div>

            {config && (
              <>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Time</p>
                  <p className="text-sm">{formatDate(config.startTime)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">End Time</p>
                  <p className="text-sm">{formatDate(config.endTime)}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Token Price</p>
                  <p className="text-sm">{formatEther(config.tokenPrice)} ETH</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Soft Cap</p>
                  <p className="text-sm">{formatEther(config.softCap)} ETH</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Hard Cap</p>
                  <p className="text-sm">{formatEther(config.hardCap)} ETH</p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tier Information */}
      <Card>
        <CardHeader>
          <CardTitle>Tier Configuration</CardTitle>
          <CardDescription>Individual tier settings and allocations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { name: 'Seed', tier: seedTier },
              { name: 'Private', tier: privateTier },
              { name: 'Public', tier: publicTier },
            ].map(({ name, tier }) => (
              tier.tier && (
                <div key={name} className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">{name} Tier</h4>
                  <div className="grid gap-2 md:grid-cols-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Price: </span>
                      <span>{formatEther(tier.tier.tokenPrice)} ETH</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Max Allocation: </span>
                      <span>{formatEther(tier.tier.maxAllocation)} tokens</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Sold: </span>
                      <span>{formatEther(tier.tier.totalSold)} / {formatEther(tier.tier.totalAllocation)}</span>
                    </div>
                  </div>
                </div>
              )
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Manage sale state and withdraw funds</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(isPending || isTxConfirming) && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Transaction in progress. Please wait...
              </AlertDescription>
            </Alert>
          )}

          {isTxSuccess && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Transaction successful! The sale has been updated.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-3">
            {config?.isPaused ? (
              <Button
                onClick={handleUnpauseSale}
                disabled={isPending || isTxConfirming}
              >
                <Play className="mr-2 h-4 w-4" />
                Unpause Sale
              </Button>
            ) : (
              <Button
                onClick={handlePauseSale}
                variant="destructive"
                disabled={isPending || isTxConfirming || config?.isFinalized}
              >
                <Pause className="mr-2 h-4 w-4" />
                Pause Sale
              </Button>
            )}

            <Button
              onClick={handleFinalizeSale}
              disabled={isPending || isTxConfirming || config?.isFinalized}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Finalize Sale
            </Button>

            <Button
              onClick={handleWithdrawFunds}
              variant="outline"
              disabled={isPending || isTxConfirming || !config?.isFinalized}
            >
              <DollarSign className="mr-2 h-4 w-4" />
              Withdraw Funds
            </Button>

            <Button variant="outline" asChild>
              <Link href={`/ido/${sale.saleId}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                View Public Page
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
