import { useReadContract } from 'wagmi';
import { IDO_SALE_ABI } from '../abis';
import { CONTRACTS } from '../config';

export function useIdoDetails() {
  // Read IDO details
  const { data: saleActive } = useReadContract({
    address: CONTRACTS.IDOSale,
    abi: IDO_SALE_ABI,
    functionName: 'saleActive',
  });

  const { data: paused } = useReadContract({
    address: CONTRACTS.IDOSale,
    abi: IDO_SALE_ABI,
    functionName: 'paused',
  });

  const { data: totalRaised } = useReadContract({
    address: CONTRACTS.IDOSale,
    abi: IDO_SALE_ABI,
    functionName: 'totalRaised',
  });

  const { data: owner } = useReadContract({
    address: CONTRACTS.IDOSale,
    abi: IDO_SALE_ABI,
    functionName: 'owner',
  });

  const { data: pulseToken } = useReadContract({
    address: CONTRACTS.IDOSale,
    abi: IDO_SALE_ABI,
    functionName: 'pulseToken',
  });

  const { data: tgeTime } = useReadContract({
    address: CONTRACTS.IDOSale,
    abi: IDO_SALE_ABI,
    functionName: 'tgeTime',
  });

  const { data: saleEndTime } = useReadContract({
    address: CONTRACTS.IDOSale,
    abi: IDO_SALE_ABI,
    functionName: 'saleEndTime',
  });

  return {
    saleActive: Boolean(saleActive),
    paused: Boolean(paused),
    totalRaised: totalRaised || 0n,
    owner: owner as `0x${string}` | undefined,
    pulseToken: pulseToken as `0x${string}` | undefined,
    tgeTime: tgeTime ? Number(tgeTime) : 0,
    saleEndTime: saleEndTime ? Number(saleEndTime) : 0,
  };
}
