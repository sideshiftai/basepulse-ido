'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useContributeETH, useContributeToken, useApproveToken, TierType } from '@/lib/contracts/hooks';
import { CONTRACTS } from '@/lib/contracts/config';
import { formatEther, parseEther } from 'viem';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface ContributeDialogProps {
  tierType: TierType;
  minContribution: bigint;
  maxContribution: bigint;
  children?: React.ReactNode;
}

export function ContributeDialog({
  tierType,
  minContribution,
  maxContribution,
  children,
}: ContributeDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [referrer, setReferrer] = useState('');

  const contributeETH = useContributeETH();
  const contributeUSDC = useContributeToken(CONTRACTS.USDC);
  const approveUSDC = useApproveToken(CONTRACTS.USDC);

  // Handle successful contribution
  useEffect(() => {
    if (contributeETH.isSuccess || contributeUSDC.isSuccess) {
      toast.success('Contribution successful!');
      setOpen(false);
      setAmount('');
      setReferrer('');
    }
  }, [contributeETH.isSuccess, contributeUSDC.isSuccess]);

  // Handle errors
  useEffect(() => {
    if (contributeETH.error) {
      toast.error('Failed to contribute ETH');
    }
    if (contributeUSDC.error) {
      toast.error('Failed to contribute USDC');
    }
  }, [contributeETH.error, contributeUSDC.error]);

  const handleContributeETH = async () => {
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }

    const value = parseEther(amount);
    if (value < minContribution || value > maxContribution) {
      toast.error(
        `Amount must be between ${formatEther(minContribution)} and ${formatEther(maxContribution)} ETH`
      );
      return;
    }

    await contributeETH.contribute(
      tierType,
      amount,
      referrer as `0x${string}` | undefined
    );
  };

  const handleContributeUSDC = async () => {
    if (!amount) {
      toast.error('Please enter an amount');
      return;
    }

    // First approve if needed
    if (!approveUSDC.isSuccess) {
      await approveUSDC.approve(amount);
      return;
    }

    await contributeUSDC.contribute(
      tierType,
      amount,
      referrer as `0x${string}` | undefined
    );
  };

  const isPending =
    contributeETH.isPending ||
    contributeETH.isConfirming ||
    contributeUSDC.isPending ||
    contributeUSDC.isConfirming ||
    approveUSDC.isPending ||
    approveUSDC.isConfirming;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children || <Button>Contribute</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Contribute to IDO</DialogTitle>
          <DialogDescription>
            Min: {formatEther(minContribution)} ETH | Max: {formatEther(maxContribution)} ETH
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="eth" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="eth">ETH</TabsTrigger>
            <TabsTrigger value="usdc">USDC</TabsTrigger>
          </TabsList>

          <TabsContent value="eth" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount-eth">Amount (ETH)</Label>
              <Input
                id="amount-eth"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrer">Referrer Address (Optional)</Label>
              <Input
                id="referrer"
                type="text"
                placeholder="0x..."
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Get 10% bonus tokens with a valid referrer
              </p>
            </div>

            <Button
              onClick={handleContributeETH}
              className="w-full"
              disabled={isPending || !amount}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Processing...' : 'Contribute ETH'}
            </Button>
          </TabsContent>

          <TabsContent value="usdc" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="amount-usdc">Amount (USDC)</Label>
              <Input
                id="amount-usdc"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="referrer-usdc">Referrer Address (Optional)</Label>
              <Input
                id="referrer-usdc"
                type="text"
                placeholder="0x..."
                value={referrer}
                onChange={(e) => setReferrer(e.target.value)}
                disabled={isPending}
              />
              <p className="text-xs text-muted-foreground">
                Get 10% bonus tokens with a valid referrer
              </p>
            </div>

            {!approveUSDC.isSuccess ? (
              <Button
                onClick={() => approveUSDC.approve(amount)}
                className="w-full"
                disabled={isPending || !amount}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Approving...' : 'Approve USDC'}
              </Button>
            ) : (
              <Button
                onClick={handleContributeUSDC}
                className="w-full"
                disabled={isPending || !amount}
              >
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Processing...' : 'Contribute USDC'}
              </Button>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
