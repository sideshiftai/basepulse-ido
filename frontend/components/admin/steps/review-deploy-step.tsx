'use client';

import { useState } from 'react';
import { SaleFormData } from '@/app/admin/create/page';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Check, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCreateSale, useConfigureSale, useConfigureTier, useSetVestingParams, useSetWhitelistMerkleRoot } from '@/lib/contracts/hooks/use-factory';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther, parseUnits, Address } from 'viem';
import { ERC20_ABI } from '@/lib/contracts/abis';
import { useRouter } from 'next/navigation';
import { NETWORK } from '@/lib/contracts/config';

interface ReviewDeployStepProps {
  formData: SaleFormData;
  onBack: () => void;
}

enum DeploymentStep {
  REVIEW = 'review',
  CREATE_SALE = 'create_sale',
  CONFIGURE_SALE = 'configure_sale',
  CONFIGURE_TIERS = 'configure_tiers',
  SET_VESTING = 'set_vesting',
  SET_WHITELIST = 'set_whitelist',
  APPROVE_TOKENS = 'approve_tokens',
  FUND_SALE = 'fund_sale',
  COMPLETE = 'complete',
}

export function ReviewDeployStep({ formData, onBack }: ReviewDeployStepProps) {
  const [currentStep, setCurrentStep] = useState<DeploymentStep>(DeploymentStep.REVIEW);
  const [saleAddress, setSaleAddress] = useState<Address | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { address } = useAccount();

  const createSale = useCreateSale();
  const configureSale = useConfigureSale();
  const configureTier = useConfigureTier();
  const setVestingParams = useSetVestingParams();
  const setWhitelistMerkleRoot = useSetWhitelistMerkleRoot();

  const { writeContract: approveTokens, data: approveHash } = useWriteContract();
  const { isLoading: isApprovingTokens } = useWaitForTransactionReceipt({ hash: approveHash });

  const calculateTotalTokensNeeded = (): bigint => {
    let total = BigInt(0);

    if (formData.tiers.seed.enabled) {
      total += parseUnits(formData.tiers.seed.totalAllocation, 18);
    }
    if (formData.tiers.private.enabled) {
      total += parseUnits(formData.tiers.private.totalAllocation, 18);
    }
    if (formData.tiers.public.enabled) {
      total += parseUnits(formData.tiers.public.totalAllocation, 18);
    }

    return total;
  };

  const handleCreateSale = async () => {
    try {
      setCurrentStep(DeploymentStep.CREATE_SALE);
      setError(null);

      await createSale.createSale(
        formData.metadata.saleToken as Address,
        {
          name: formData.metadata.name,
          symbol: formData.metadata.symbol,
          description: formData.metadata.description,
          logoUrl: formData.metadata.logoUrl,
          websiteUrl: formData.metadata.websiteUrl,
          twitterUrl: formData.metadata.twitterUrl,
          telegramUrl: formData.metadata.telegramUrl,
        }
      );
    } catch (err: any) {
      setError(`Failed to create sale: ${err.message}`);
      setCurrentStep(DeploymentStep.REVIEW);
    }
  };

  const handleConfigureSale = async () => {
    if (!saleAddress) return;

    try {
      setCurrentStep(DeploymentStep.CONFIGURE_SALE);
      setError(null);

      const startTime = BigInt(Math.floor(formData.parameters.startTime.getTime() / 1000));
      const endTime = BigInt(Math.floor(formData.parameters.endTime.getTime() / 1000));
      const tokenPrice = parseEther(formData.parameters.tokenPrice);
      const hardCap = parseEther(formData.parameters.hardCap);
      const softCap = parseEther(formData.parameters.softCap);
      const minContribution = parseEther(formData.parameters.minContribution);
      const maxGasPrice = parseUnits(formData.parameters.maxGasPrice, 9); // Gwei to wei

      await configureSale.configureSale(
        saleAddress,
        startTime,
        endTime,
        tokenPrice,
        hardCap,
        softCap,
        minContribution,
        maxGasPrice
      );
    } catch (err: any) {
      setError(`Failed to configure sale: ${err.message}`);
    }
  };

  const handleConfigureTiers = async () => {
    if (!saleAddress) return;

    try {
      setCurrentStep(DeploymentStep.CONFIGURE_TIERS);
      setError(null);

      // Configure each enabled tier
      const tiers = [
        { id: 1, name: 'seed', data: formData.tiers.seed },
        { id: 2, name: 'private', data: formData.tiers.private },
        { id: 3, name: 'public', data: formData.tiers.public },
      ];

      for (const tier of tiers) {
        if (!tier.data.enabled) continue;

        const startTime = BigInt(Math.floor(tier.data.startTime.getTime() / 1000));
        const endTime = BigInt(Math.floor(tier.data.endTime.getTime() / 1000));
        const tokenPrice = parseEther(tier.data.tokenPrice);
        const maxAllocation = parseUnits(tier.data.maxAllocation, 18);
        const totalAllocation = parseUnits(tier.data.totalAllocation, 18);

        await configureTier.configureTier(
          saleAddress,
          tier.id,
          startTime,
          endTime,
          tokenPrice,
          maxAllocation,
          totalAllocation
        );

        // Wait for confirmation before configuring next tier
        if (configureTier.hash) {
          // Small delay to ensure transaction is mined
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    } catch (err: any) {
      setError(`Failed to configure tiers: ${err.message}`);
    }
  };

  const handleSetVesting = async () => {
    if (!saleAddress) return;

    try {
      setCurrentStep(DeploymentStep.SET_VESTING);
      setError(null);

      const cliffDuration = BigInt(formData.vesting.cliffDuration * 86400); // days to seconds
      const vestingDuration = BigInt(formData.vesting.vestingDuration * 86400);

      await setVestingParams.setVestingParams(
        saleAddress,
        formData.vesting.tgePercent,
        cliffDuration,
        vestingDuration
      );
    } catch (err: any) {
      setError(`Failed to set vesting params: ${err.message}`);
    }
  };

  const handleSetWhitelist = async () => {
    if (!saleAddress) return;

    try {
      setCurrentStep(DeploymentStep.SET_WHITELIST);
      setError(null);

      if (formData.whitelist.enabled && formData.whitelist.merkleRoot) {
        await setWhitelistMerkleRoot.setWhitelistMerkleRoot(
          saleAddress,
          formData.whitelist.merkleRoot as `0x${string}`
        );
      } else {
        // Skip if whitelist not enabled
        setCurrentStep(DeploymentStep.APPROVE_TOKENS);
      }
    } catch (err: any) {
      setError(`Failed to set whitelist: ${err.message}`);
    }
  };

  const handleApproveTokens = async () => {
    if (!saleAddress) return;

    try {
      setCurrentStep(DeploymentStep.APPROVE_TOKENS);
      setError(null);

      const totalTokens = calculateTotalTokensNeeded();

      await approveTokens({
        address: formData.metadata.saleToken as Address,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [saleAddress, totalTokens],
      });
    } catch (err: any) {
      setError(`Failed to approve tokens: ${err.message}`);
    }
  };

  const handleFundSale = async () => {
    if (!saleAddress) return;

    try {
      setCurrentStep(DeploymentStep.FUND_SALE);
      setError(null);

      const totalTokens = calculateTotalTokensNeeded();

      await approveTokens({
        address: formData.metadata.saleToken as Address,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [saleAddress, totalTokens],
      });

      setCurrentStep(DeploymentStep.COMPLETE);
    } catch (err: any) {
      setError(`Failed to fund sale: ${err.message}`);
    }
  };

  // Watch for sale creation success
  if (createSale.isSuccess && !saleAddress && createSale.hash) {
    // Extract sale address from events (you'd need to parse transaction receipt)
    // For now, we'll need the user to proceed manually
    // TODO: Parse transaction logs to get sale address
  }

  const deploymentSteps = [
    { step: DeploymentStep.CREATE_SALE, label: 'Create Sale', handler: handleCreateSale },
    { step: DeploymentStep.CONFIGURE_SALE, label: 'Configure Sale', handler: handleConfigureSale },
    { step: DeploymentStep.CONFIGURE_TIERS, label: 'Configure Tiers', handler: handleConfigureTiers },
    { step: DeploymentStep.SET_VESTING, label: 'Set Vesting', handler: handleSetVesting },
    { step: DeploymentStep.SET_WHITELIST, label: 'Set Whitelist', handler: handleSetWhitelist },
    { step: DeploymentStep.APPROVE_TOKENS, label: 'Approve Tokens', handler: handleApproveTokens },
    { step: DeploymentStep.FUND_SALE, label: 'Fund Sale', handler: handleFundSale },
  ];

  const renderReview = () => (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please review all details carefully before deploying. These settings cannot be changed after deployment without admin actions.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Sale Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Name:</span>
            <span>{formData.metadata.name}</span>
            <span className="text-muted-foreground">Symbol:</span>
            <span>{formData.metadata.symbol}</span>
            <span className="text-muted-foreground">Token Address:</span>
            <span className="font-mono text-xs">{formData.metadata.saleToken}</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sale Parameters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">Start:</span>
            <span>{formData.parameters.startTime.toLocaleString()}</span>
            <span className="text-muted-foreground">End:</span>
            <span>{formData.parameters.endTime.toLocaleString()}</span>
            <span className="text-muted-foreground">Token Price:</span>
            <span>{formData.parameters.tokenPrice} ETH</span>
            <span className="text-muted-foreground">Hard Cap:</span>
            <span>{formData.parameters.hardCap} ETH</span>
            <span className="text-muted-foreground">Soft Cap:</span>
            <span>{formData.parameters.softCap} ETH</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vesting Schedule</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <span className="text-muted-foreground">TGE Unlock:</span>
            <span>{formData.vesting.tgePercent}%</span>
            <span className="text-muted-foreground">Cliff:</span>
            <span>{formData.vesting.cliffDuration} days</span>
            <span className="text-muted-foreground">Vesting Duration:</span>
            <span>{formData.vesting.vestingDuration} days</span>
          </div>
        </CardContent>
      </Card>

      {formData.whitelist.enabled && (
        <Card>
          <CardHeader>
            <CardTitle>Whitelist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="grid grid-cols-2 gap-2">
              <span className="text-muted-foreground">Enabled:</span>
              <span>Yes ({formData.whitelist.addresses?.length} addresses)</span>
              <span className="text-muted-foreground">Merkle Root:</span>
              <span className="font-mono text-xs break-all">{formData.whitelist.merkleRoot}</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button onClick={handleCreateSale} size="lg">
          Deploy Sale
        </Button>
      </div>
    </div>
  );

  const renderDeployment = () => (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Please do not close this page during deployment. You will need to confirm multiple transactions.
        </AlertDescription>
      </Alert>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3">
        {deploymentSteps.map((step, index) => {
          const isActive = currentStep === step.step;
          const isComplete = deploymentSteps.findIndex(s => s.step === currentStep) > index;
          const isPending = !isActive && !isComplete;

          return (
            <div
              key={step.step}
              className="flex items-center gap-3 p-4 border rounded-lg"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                isComplete ? 'bg-primary text-primary-foreground' :
                isActive ? 'border-2 border-primary' :
                'border-2 border-muted'
              }`}>
                {isComplete ? <Check className="h-4 w-4" /> :
                 isActive ? <Loader2 className="h-4 w-4 animate-spin" /> :
                 index + 1}
              </div>
              <span className={`flex-1 ${isActive || isComplete ? 'font-medium' : 'text-muted-foreground'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {saleAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Sale Contract Address</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="font-mono text-sm">{saleAddress}</span>
              <Button variant="outline" size="sm" asChild>
                <a
                  href={`${NETWORK.blockExplorer}/address/${saleAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderComplete = () => (
    <div className="space-y-6 text-center py-8">
      <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
        <Check className="h-8 w-8 text-primary-foreground" />
      </div>
      <div>
        <h3 className="text-2xl font-bold">Sale Deployed Successfully!</h3>
        <p className="text-muted-foreground mt-2">
          Your token sale has been created and configured on the blockchain.
        </p>
      </div>

      {saleAddress && (
        <Card>
          <CardHeader>
            <CardTitle>Sale Contract</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="font-mono text-sm break-all bg-muted p-3 rounded">
              {saleAddress}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild className="flex-1">
                <a
                  href={`${NETWORK.blockExplorer}/address/${saleAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View on Explorer
                </a>
              </Button>
              <Button asChild className="flex-1">
                <a href={`/ido/${saleAddress}`}>
                  View Sale Page
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Button onClick={() => router.push('/admin')} variant="outline">
        Return to Dashboard
      </Button>
    </div>
  );

  if (currentStep === DeploymentStep.COMPLETE) {
    return renderComplete();
  }

  if (currentStep === DeploymentStep.REVIEW) {
    return renderReview();
  }

  return renderDeployment();
}
