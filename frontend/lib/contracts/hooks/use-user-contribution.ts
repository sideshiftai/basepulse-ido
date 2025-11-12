import { useReadContract, useAccount } from 'wagmi';
import { IDO_SALE_ABI } from '../abis';
import { CONTRACTS } from '../config';
import { TierType } from './use-tier-info';

export interface UserContribution {
  contributed: bigint;
  tokensAllocated: bigint;
  referralBonus: bigint;
  hasClaimedTGE: boolean;
}

export function useUserContribution(tierType: TierType) {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.IDOSale,
    abi: IDO_SALE_ABI,
    functionName: 'getUserContribution',
    args: address ? [address, tierType] : undefined,
    query: {
      enabled: !!address && !!CONTRACTS.IDOSale,
    },
  });

  if (!data || !address) {
    return {
      contribution: null,
      isLoading,
      error,
      refetch,
    };
  }

  const [contributed, tokensAllocated, referralBonus, hasClaimedTGE] = data as [bigint, bigint, bigint, boolean];

  return {
    contribution: {
      contributed,
      tokensAllocated,
      referralBonus,
      hasClaimedTGE,
    } as UserContribution,
    isLoading,
    error,
    refetch,
  };
}
