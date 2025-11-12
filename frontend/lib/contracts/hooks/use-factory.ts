import { useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACTS } from '../config';
import { IDO_FACTORY_ABI, FACTORY_REGISTRY_ABI, IDO_SALE_V2_ABI, VESTING_MANAGER_V2_ABI } from '../abis';
import { parseUnits, Address } from 'viem';

// Sale metadata structure matching the contract
export interface SaleMetadata {
  name: string;
  symbol: string;
  description: string;
  logoUrl: string;
  websiteUrl: string;
  twitterUrl: string;
  telegramUrl: string;
}

// Hook to create a new sale
export function useCreateSale() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createSale = async (saleToken: Address, metadata: SaleMetadata) => {
    if (!CONTRACTS.IDOFactory) {
      throw new Error('IDO Factory contract address not configured');
    }
    return writeContract({
      address: CONTRACTS.IDOFactory,
      abi: IDO_FACTORY_ABI,
      functionName: 'createSale',
      args: [saleToken, metadata] as any,
    });
  };

  return {
    createSale,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to get all sales from the registry
export function useAllSales() {
  const { data: sales, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.FactoryRegistry,
    abi: FACTORY_REGISTRY_ABI,
    functionName: 'getAllSales',
    query: {
      enabled: !!CONTRACTS.FactoryRegistry,
    },
  });

  return {
    sales: sales as { saleId: bigint; saleAddress: Address; creator: Address; createdAt: bigint }[] | undefined,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get sale by ID
export function useSaleById(saleId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.FactoryRegistry,
    abi: FACTORY_REGISTRY_ABI,
    functionName: 'getSale',
    args: saleId !== undefined ? [saleId] : undefined,
    query: {
      enabled: saleId !== undefined && !!CONTRACTS.FactoryRegistry,
    },
  });

  return {
    sale: data as { saleId: bigint; saleAddress: Address; creator: Address; createdAt: bigint } | undefined,
    isLoading,
    error,
  };
}

// Hook to configure sale parameters
export function useConfigureSale() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const configureSale = async (
    saleAddress: Address,
    startTime: bigint,
    endTime: bigint,
    tokenPrice: bigint,
    hardCap: bigint,
    softCap: bigint,
    minContribution: bigint,
    maxGasPrice: bigint
  ) => {
    return writeContract({
      address: saleAddress,
      abi: IDO_SALE_V2_ABI,
      functionName: 'configureSale',
      args: [startTime, endTime, tokenPrice, hardCap, softCap, minContribution, maxGasPrice],
    });
  };

  return {
    configureSale,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to configure a specific tier
export function useConfigureTier() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const configureTier = async (
    saleAddress: Address,
    tierId: number,
    startTime: bigint,
    endTime: bigint,
    tokenPrice: bigint,
    maxAllocation: bigint,
    totalAllocation: bigint
  ) => {
    return writeContract({
      address: saleAddress,
      abi: IDO_SALE_V2_ABI,
      functionName: 'configureTier',
      args: [tierId, startTime, endTime, tokenPrice, maxAllocation, totalAllocation],
    });
  };

  return {
    configureTier,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to set vesting parameters
export function useSetVestingParams() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setVestingParams = async (
    saleAddress: Address,
    tgePercent: number,
    cliffDuration: bigint,
    vestingDuration: bigint
  ) => {
    return writeContract({
      address: saleAddress,
      abi: IDO_SALE_V2_ABI,
      functionName: 'setVestingParams',
      args: [tgePercent, cliffDuration, vestingDuration],
    });
  };

  return {
    setVestingParams,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to set whitelist merkle root
export function useSetWhitelistMerkleRoot() {
  const { data: hash, writeContract, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const setWhitelistMerkleRoot = async (saleAddress: Address, merkleRoot: `0x${string}`) => {
    return writeContract({
      address: saleAddress,
      abi: IDO_SALE_V2_ABI,
      functionName: 'setWhitelistMerkleRoot',
      args: [merkleRoot],
    });
  };

  return {
    setWhitelistMerkleRoot,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  };
}

// Hook to get sale configuration
export function useSaleConfig(saleAddress: Address | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: saleAddress,
    abi: IDO_SALE_V2_ABI,
    functionName: 'getSaleConfig',
    query: {
      enabled: !!saleAddress,
    },
  });

  return {
    config: data as {
      startTime: bigint;
      endTime: bigint;
      tokenPrice: bigint;
      hardCap: bigint;
      softCap: bigint;
      minContribution: bigint;
      maxGasPrice: bigint;
      totalRaised: bigint;
      isFinalized: boolean;
      isPaused: boolean;
    } | undefined,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get tier info
export function useTierConfig(saleAddress: Address | undefined, tierId: number) {
  const { data, isLoading, error } = useReadContract({
    address: saleAddress,
    abi: IDO_SALE_V2_ABI,
    functionName: 'getTier',
    args: [tierId],
    query: {
      enabled: !!saleAddress,
    },
  });

  return {
    tier: data as {
      startTime: bigint;
      endTime: bigint;
      tokenPrice: bigint;
      maxAllocation: bigint;
      totalAllocation: bigint;
      totalSold: bigint;
    } | undefined,
    isLoading,
    error,
  };
}
