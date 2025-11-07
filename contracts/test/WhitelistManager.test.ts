import { expect } from "chai";
import { ethers } from "hardhat";
import { WhitelistManager } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("WhitelistManager", function () {
  let whitelistManager: WhitelistManager;
  let owner: HardhatEthersSigner;
  let user1: HardhatEthersSigner;
  let user2: HardhatEthersSigner;
  let user3: HardhatEthersSigner;

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();

    const WhitelistManager = await ethers.getContractFactory("WhitelistManager");
    whitelistManager = await WhitelistManager.deploy();
    await whitelistManager.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct owner", async function () {
      expect(await whitelistManager.owner()).to.equal(owner.address);
    });

    it("Should enable whitelist by default", async function () {
      expect(await whitelistManager.whitelistEnabled()).to.be.true;
    });

    it("Should have empty Merkle root by default", async function () {
      expect(await whitelistManager.merkleRoot()).to.equal(ethers.ZeroHash);
    });
  });

  describe("Merkle Root Management", function () {
    it("Should allow owner to set Merkle root", async function () {
      const newRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await expect(whitelistManager.setMerkleRoot(newRoot))
        .to.emit(whitelistManager, "MerkleRootUpdated")
        .withArgs(newRoot, ethers.ZeroHash);

      expect(await whitelistManager.merkleRoot()).to.equal(newRoot);
    });

    it("Should prevent non-owner from setting Merkle root", async function () {
      const newRoot = ethers.keccak256(ethers.toUtf8Bytes("test"));

      await expect(
        whitelistManager.connect(user1).setMerkleRoot(newRoot)
      ).to.be.revertedWithCustomError(whitelistManager, "OwnableUnauthorizedAccount");
    });
  });

  describe("Manual Whitelist", function () {
    it("Should allow owner to manually whitelist an address", async function () {
      await expect(whitelistManager.setManualWhitelist(user1.address, 1, true))
        .to.emit(whitelistManager, "ManualWhitelistUpdated")
        .withArgs(user1.address, 1, true);

      expect(await whitelistManager.manualWhitelist(user1.address, 1)).to.be.true;
    });

    it("Should allow owner to remove from manual whitelist", async function () {
      await whitelistManager.setManualWhitelist(user1.address, 1, true);
      await whitelistManager.setManualWhitelist(user1.address, 1, false);

      expect(await whitelistManager.manualWhitelist(user1.address, 1)).to.be.false;
    });

    it("Should reject invalid tier", async function () {
      await expect(
        whitelistManager.setManualWhitelist(user1.address, 0, true)
      ).to.be.revertedWith("Invalid tier");

      await expect(
        whitelistManager.setManualWhitelist(user1.address, 4, true)
      ).to.be.revertedWith("Invalid tier");
    });

    it("Should allow batch whitelisting", async function () {
      const addresses = [user1.address, user2.address, user3.address];

      await whitelistManager.setManualWhitelistBatch(addresses, 1, true);

      expect(await whitelistManager.manualWhitelist(user1.address, 1)).to.be.true;
      expect(await whitelistManager.manualWhitelist(user2.address, 1)).to.be.true;
      expect(await whitelistManager.manualWhitelist(user3.address, 1)).to.be.true;
    });
  });

  describe("Whitelist Verification", function () {
    it("Should return true when whitelist is disabled", async function () {
      await whitelistManager.setWhitelistEnabled(false);

      const isWhitelisted = await whitelistManager.isWhitelisted(user1.address, 1, []);
      expect(isWhitelisted).to.be.true;
    });

    it("Should verify manual whitelist", async function () {
      await whitelistManager.setManualWhitelist(user1.address, 1, true);

      const isWhitelisted = await whitelistManager.isWhitelisted(user1.address, 1, []);
      expect(isWhitelisted).to.be.true;
    });

    it("Should return false for non-whitelisted address", async function () {
      const isWhitelisted = await whitelistManager.isWhitelisted(user1.address, 1, []);
      expect(isWhitelisted).to.be.false;
    });

    it("Should verify Merkle proof correctly", async function () {
      // Create a simple Merkle tree
      // Tree: user1(tier1) and user2(tier1)
      const leaf1 = ethers.keccak256(ethers.solidityPacked(["address", "uint8"], [user1.address, 1]));
      const leaf2 = ethers.keccak256(ethers.solidityPacked(["address", "uint8"], [user2.address, 1]));

      // Sort leaves for consistent tree
      const [sortedLeaf1, sortedLeaf2] = [leaf1, leaf2].sort((a, b) => (a < b ? -1 : 1));

      // Compute root
      const root = ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [sortedLeaf1, sortedLeaf2]));

      await whitelistManager.setMerkleRoot(root);

      // Proof for user1 is just leaf2
      const proof = [leaf2];

      const isWhitelisted = await whitelistManager.isWhitelisted(user1.address, 1, proof);
      expect(isWhitelisted).to.be.true;
    });
  });

  describe("Whitelist Status Toggle", function () {
    it("Should allow owner to disable whitelist", async function () {
      await expect(whitelistManager.setWhitelistEnabled(false))
        .to.emit(whitelistManager, "WhitelistStatusChanged")
        .withArgs(false);

      expect(await whitelistManager.whitelistEnabled()).to.be.false;
    });

    it("Should allow owner to re-enable whitelist", async function () {
      await whitelistManager.setWhitelistEnabled(false);
      await whitelistManager.setWhitelistEnabled(true);

      expect(await whitelistManager.whitelistEnabled()).to.be.true;
    });
  });

  describe("View Functions", function () {
    it("Should return manual whitelist status for all tiers", async function () {
      await whitelistManager.setManualWhitelist(user1.address, 1, true);
      await whitelistManager.setManualWhitelist(user1.address, 3, true);

      const status = await whitelistManager.getManualWhitelistStatus(user1.address);

      expect(status[0]).to.be.true; // Tier 1
      expect(status[1]).to.be.false; // Tier 2
      expect(status[2]).to.be.true; // Tier 3
    });

    it("Should return whitelist info with method", async function () {
      await whitelistManager.setManualWhitelist(user1.address, 1, true);

      const info = await whitelistManager.getWhitelistInfo(user1.address, 1, []);

      expect(info.whitelisted).to.be.true;
      expect(info.method).to.equal("manual");
    });

    it("Should return 'disabled' when whitelist is off", async function () {
      await whitelistManager.setWhitelistEnabled(false);

      const info = await whitelistManager.getWhitelistInfo(user1.address, 1, []);

      expect(info.whitelisted).to.be.true;
      expect(info.method).to.equal("disabled");
    });
  });

  describe("Merkle Proof Verification", function () {
    it("Should correctly verify a valid proof", async function () {
      const leaf = ethers.keccak256(ethers.toUtf8Bytes("test"));
      const proof = [ethers.keccak256(ethers.toUtf8Bytes("sibling"))];

      // Create root from leaf and proof
      const root = ethers.keccak256(
        ethers.solidityPacked(
          ["bytes32", "bytes32"],
          [leaf, proof[0]].sort((a, b) => (a < b ? -1 : 1))
        )
      );

      const isValid = await whitelistManager.verifyProof(proof, root, leaf);
      expect(isValid).to.be.true;
    });

    it("Should reject invalid proof", async function () {
      const leaf = ethers.keccak256(ethers.toUtf8Bytes("test"));
      const wrongProof = [ethers.keccak256(ethers.toUtf8Bytes("wrong"))];
      const root = ethers.keccak256(ethers.toUtf8Bytes("root"));

      const isValid = await whitelistManager.verifyProof(wrongProof, root, leaf);
      expect(isValid).to.be.false;
    });
  });
});
