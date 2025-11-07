import { useReadContract } from 'wagmi';
import { IDO_SALE_ABI } from '../abis';
import { CONTRACTS } from '../config';

export type TierType = 0 | 1 | 2; // Seed, Private, Public

export interface TierInfo {
  allocation: bigint;
  minContribution: bigint;
  maxContribution: bigint;
  tokenPrice: bigint;
  totalContributed: bigint;
  startTime: number;
  endTime: number;
}

export function useTierInfo(tierType: TierType) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.IDOSale,
    abi: IDO_SALE_ABI,
    functionName: 'tiers',
    args: [tierType],
  });

  if (!data) {
    return {
      tierInfo: null,
      isLoading,
      error,
    };
  }

  const [allocation, minContribution, maxContribution, tokenPrice, totalContributed, startTime, endTime] = data as [bigint, bigint, bigint, bigint, bigint, bigint, bigint];

  return {
    tierInfo: {
      allocation,
      minContribution,
      maxContribution,
      tokenPrice,
      totalContributed,
      startTime: Number(startTime),
      endTime: Number(endTime),
    } as TierInfo,
    isLoading,
    error,
  };
}
