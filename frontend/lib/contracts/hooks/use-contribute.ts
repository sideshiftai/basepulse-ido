import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { IDO_SALE_ABI, ERC20_ABI } from '../abis';
import { CONTRACTS } from '../config';
import { TierType } from './use-tier-info';
import { toast } from 'sonner';

export function useContributeETH() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const contribute = async (
    tierType: TierType,
    amount: string,
    referrer?: `0x${string}`
  ) => {
    try {
      const value = parseEther(amount);

      writeContract({
        address: CONTRACTS.IDOSale,
        abi: IDO_SALE_ABI,
        functionName: 'contributeETH',
        args: [tierType, referrer || '0x0000000000000000000000000000000000000000'],
        value,
      });
    } catch (err) {
      console.error('Error contributing ETH:', err);
      toast.error('Failed to contribute');
    }
  };

  return {
    contribute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useContributeToken(tokenAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const contribute = async (
    tierType: TierType,
    amount: string,
    referrer?: `0x${string}`
  ) => {
    try {
      const value = parseEther(amount);

      writeContract({
        address: CONTRACTS.IDOSale,
        abi: IDO_SALE_ABI,
        functionName: 'contributeToken',
        args: [
          tierType,
          tokenAddress,
          value,
          referrer || '0x0000000000000000000000000000000000000000',
        ],
      });
    } catch (err) {
      console.error('Error contributing token:', err);
      toast.error('Failed to contribute');
    }
  };

  return {
    contribute,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

export function useApproveToken(tokenAddress: `0x${string}`) {
  const { writeContract, data: hash, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = async (amount: string) => {
    try {
      const value = parseEther(amount);

      writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACTS.IDOSale, value],
      });
    } catch (err) {
      console.error('Error approving token:', err);
      toast.error('Failed to approve token');
    }
  };

  return {
    approve,
    hash,
    isPending,
    isConfirming,
    isSuccess,
  };
}
