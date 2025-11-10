import { keccak256, encodePacked } from 'viem';

export class MerkleTree {
  private leaves: string[];
  private layers: string[][];

  constructor(addresses: string[]) {
    // Create leaf nodes by hashing addresses
    this.leaves = addresses.map((addr) =>
      keccak256(encodePacked(['address'], [addr as `0x${string}`]))
    );

    // Build the tree
    this.layers = this.buildTree(this.leaves);
  }

  private buildTree(leaves: string[]): string[][] {
    if (leaves.length === 0) {
      return [[]];
    }

    const layers: string[][] = [leaves];
    let currentLayer = leaves;

    while (currentLayer.length > 1) {
      const nextLayer: string[] = [];

      for (let i = 0; i < currentLayer.length; i += 2) {
        if (i + 1 < currentLayer.length) {
          // Pair exists
          const [left, right] = this.sortPair(currentLayer[i], currentLayer[i + 1]);
          nextLayer.push(keccak256(encodePacked(['bytes32', 'bytes32'], [left as `0x${string}`, right as `0x${string}`])));
        } else {
          // Odd one out, promote to next layer
          nextLayer.push(currentLayer[i]);
        }
      }

      layers.push(nextLayer);
      currentLayer = nextLayer;
    }

    return layers;
  }

  private sortPair(a: string, b: string): [string, string] {
    return a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
  }

  getRoot(): string {
    if (this.layers.length === 0 || this.layers[this.layers.length - 1].length === 0) {
      return '0x0000000000000000000000000000000000000000000000000000000000000000';
    }
    return this.layers[this.layers.length - 1][0];
  }

  getProof(address: string): string[] {
    const leaf = keccak256(encodePacked(['address'], [address as `0x${string}`]));
    const index = this.leaves.indexOf(leaf);

    if (index === -1) {
      throw new Error('Address not found in tree');
    }

    const proof: string[] = [];
    let currentIndex = index;

    for (let i = 0; i < this.layers.length - 1; i++) {
      const layer = this.layers[i];
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < layer.length) {
        proof.push(layer[siblingIndex]);
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  verify(address: string, proof: string[], root: string): boolean {
    const leaf = keccak256(encodePacked(['address'], [address as `0x${string}`]));
    let computedHash = leaf;

    for (const proofElement of proof) {
      const [left, right] = this.sortPair(computedHash, proofElement);
      computedHash = keccak256(encodePacked(['bytes32', 'bytes32'], [left as `0x${string}`, right as `0x${string}`]));
    }

    return computedHash.toLowerCase() === root.toLowerCase();
  }
}

export function generateMerkleRoot(addresses: string[]): string {
  if (addresses.length === 0) {
    return '0x0000000000000000000000000000000000000000000000000000000000000000';
  }

  const tree = new MerkleTree(addresses);
  return tree.getRoot();
}

export function generateMerkleProof(addresses: string[], targetAddress: string): string[] {
  const tree = new MerkleTree(addresses);
  return tree.getProof(targetAddress);
}
