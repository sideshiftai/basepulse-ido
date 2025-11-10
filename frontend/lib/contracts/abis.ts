// Legacy single sale ABIs
import idoSaleAbi from './abis/IDOSale.json';
import vestingManagerAbi from './abis/VestingManager.json';
import whitelistManagerAbi from './abis/WhitelistManager.json';
import ierc20Abi from './abis/IERC20.json';

// Factory ABIs for multi-sale platform
import idoFactoryAbiRaw from './IDOFactory.json';
import factoryRegistryAbiRaw from './FactoryRegistry.json';
import idoSaleV2AbiRaw from './IDOSaleV2.json';
import vestingManagerV2AbiRaw from './VestingManagerV2.json';

export const IDO_SALE_ABI = idoSaleAbi;
export const VESTING_MANAGER_ABI = vestingManagerAbi;
export const WHITELIST_MANAGER_ABI = whitelistManagerAbi;
export const ERC20_ABI = ierc20Abi;

// Extract just the ABI array from the JSON files
export const IDO_FACTORY_ABI = (idoFactoryAbiRaw as any).abi || idoFactoryAbiRaw;
export const FACTORY_REGISTRY_ABI = (factoryRegistryAbiRaw as any).abi || factoryRegistryAbiRaw;
export const IDO_SALE_V2_ABI = (idoSaleV2AbiRaw as any).abi || idoSaleV2AbiRaw;
export const VESTING_MANAGER_V2_ABI = (vestingManagerV2AbiRaw as any).abi || vestingManagerV2AbiRaw;
