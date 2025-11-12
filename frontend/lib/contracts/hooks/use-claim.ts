import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useAccount } from 'wagmi';
import { IDO_SALE_ABI, VESTING_MANAGER_ABI } from '../abis';
import { CONTRACTS } from '../config';
import { TierType } from './use-tier-info';
import { toast } from 'sonner';

export function useClaimTGE() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = async (tierType: TierType) => {
    try {
      if (!CONTRACTS.IDOSale) {
        toast.error('IDO Sale contract address not configured');
        return;
      }
      writeContract({
        address: CONTRACTS.IDOSale,
        abi: IDO_SALE_ABI,
        functionName: 'claimTGE',
        args: [tierType],
      });
    } catch (err) {
      console.error('Error claiming TGE:', err);
      toast.error('Failed to claim TGE tokens');
    }
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useClaimVested() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = async (scheduleId: bigint) => {
    try {
      if (!CONTRACTS.VestingManager) {
        toast.error('Vesting Manager contract address not configured');
        return;
      }
      writeContract({
        address: CONTRACTS.VestingManager,
        abi: VESTING_MANAGER_ABI,
        functionName: 'claim',
        args: [scheduleId],
      });
    } catch (err) {
      console.error('Error claiming vested tokens:', err);
      toast.error('Failed to claim vested tokens');
    }
  };

  return {
    claim,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useVestingSchedule(scheduleId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.VestingManager,
    abi: VESTING_MANAGER_ABI,
    functionName: 'getSchedule',
    args: [scheduleId],
    query: {
      enabled: !!CONTRACTS.VestingManager,
    },
  });

  if (!data) {
    return {
      schedule: null,
      isLoading,
      error,
      refetch,
    };
  }

  const [beneficiary, totalAmount, startTime, cliffDuration, duration, tgeAmount, releasedAmount, revoked] = data as [
    `0x${string}`,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    bigint,
    boolean
  ];

  return {
    schedule: {
      beneficiary,
      totalAmount,
      startTime: Number(startTime),
      cliffDuration: Number(cliffDuration),
      duration: Number(duration),
      tgeAmount,
      releasedAmount,
      revoked,
    },
    isLoading,
    error,
    refetch,
  };
}

export function useClaimableAmount(scheduleId: bigint) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.VestingManager,
    abi: VESTING_MANAGER_ABI,
    functionName: 'claimableAmount',
    args: [scheduleId],
    query: {
      enabled: !!CONTRACTS.VestingManager,
    },
  });

  return {
    claimableAmount: (data as bigint) || 0n,
    isLoading,
    error,
    refetch,
  };
}

export function useUserScheduleIds() {
  const { address } = useAccount();

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.VestingManager,
    abi: VESTING_MANAGER_ABI,
    functionName: 'getUserSchedules',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
    },
  });

  return {
    scheduleIds: (data as bigint[]) || [],
    isLoading,
    error,
    refetch,
  };
}
