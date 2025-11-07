import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-network-helpers";
import { VestingManager } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("VestingManager", function () {
  let vestingManager: VestingManager;
  let pulseToken: any;
  let owner: HardhatEthersSigner;
  let beneficiary: HardhatEthersSigner;
  let idoContract: HardhatEthersSigner;

  const TOTAL_SUPPLY = ethers.parseEther("1000000000"); // 1B PULSE
  const VESTING_AMOUNT = ethers.parseEther("100000"); // 100k PULSE
  const CLIFF = 90 * 24 * 3600; // 90 days
  const DURATION = 365 * 24 * 3600; // 365 days

  beforeEach(async function () {
    [owner, beneficiary, idoContract] = await ethers.getSigners();

    // Deploy mock PULSE token
    const PulseToken = await ethers.getContractFactory("PulsePollToken");
    pulseToken = await PulseToken.deploy();
    await pulseToken.waitForDeployment();

    // Deploy VestingManager
    const VestingManager = await ethers.getContractFactory("VestingManager");
    vestingManager = await VestingManager.deploy(await pulseToken.getAddress());
    await vestingManager.waitForDeployment();

    // Set IDO contract
    await vestingManager.setIDOContract(idoContract.address);

    // Transfer tokens to VestingManager
    await pulseToken.transfer(await vestingManager.getAddress(), ethers.parseEther("10000000"));
  });

  describe("Deployment", function () {
    it("Should set the correct token address", async function () {
      expect(await vestingManager.token()).to.equal(await pulseToken.getAddress());
    });

    it("Should set the correct owner", async function () {
      expect(await vestingManager.owner()).to.equal(owner.address);
    });

    it("Should set the IDO contract", async function () {
      expect(await vestingManager.idoContract()).to.equal(idoContract.address);
    });
  });

  describe("Create Vesting Schedule", function () {
    it("Should allow owner to create vesting schedule", async function () {
      const startTime = await time.latest();

      await expect(
        vestingManager.createVestingSchedule(
          beneficiary.address,
          VESTING_AMOUNT,
          startTime,
          CLIFF,
          DURATION
        )
      )
        .to.emit(vestingManager, "VestingScheduleCreated")
        .withArgs(beneficiary.address, VESTING_AMOUNT, startTime, CLIFF, DURATION);

      const schedule = await vestingManager.getVestingSchedule(beneficiary.address);
      expect(schedule.totalAmount).to.equal(VESTING_AMOUNT);
      expect(schedule.claimedAmount).to.equal(0);
      expect(schedule.cliff).to.equal(CLIFF);
      expect(schedule.duration).to.equal(DURATION);
    });

    it("Should allow IDO contract to create vesting schedule", async function () {
      const startTime = await time.latest();

      await expect(
        vestingManager.connect(idoContract).createVestingSchedule(
          beneficiary.address,
          VESTING_AMOUNT,
          startTime,
          CLIFF,
          DURATION
        )
      ).to.not.be.reverted;
    });

    it("Should reject schedule creation from unauthorized caller", async function () {
      const startTime = await time.latest();

      await expect(
        vestingManager.connect(beneficiary).createVestingSchedule(
          beneficiary.address,
          VESTING_AMOUNT,
          startTime,
          CLIFF,
          DURATION
        )
      ).to.be.revertedWith("Only owner or IDO contract");
    });

    it("Should reject duplicate schedules", async function () {
      const startTime = await time.latest();

      await vestingManager.createVestingSchedule(
        beneficiary.address,
        VESTING_AMOUNT,
        startTime,
        CLIFF,
        DURATION
      );

      await expect(
        vestingManager.createVestingSchedule(
          beneficiary.address,
          VESTING_AMOUNT,
          startTime,
          CLIFF,
          DURATION
        )
      ).to.be.revertedWith("Schedule exists");
    });
  });

  describe("Vesting Calculation", function () {
    it("Should return 0 claimable before cliff", async function () {
      const startTime = await time.latest();

      await vestingManager.createVestingSchedule(
        beneficiary.address,
        VESTING_AMOUNT,
        startTime,
        CLIFF,
        DURATION
      );

      // Move time forward but before cliff
      await time.increase(CLIFF - 1000);

      const claimable = await vestingManager.getClaimableAmount(beneficiary.address);
      expect(claimable).to.equal(0);
    });

    it("Should calculate correct vested amount after cliff", async function () {
      const startTime = await time.latest();

      await vestingManager.createVestingSchedule(
        beneficiary.address,
        VESTING_AMOUNT,
        startTime,
        CLIFF,
        DURATION
      );

      // Move past cliff to halfway through vesting
      const halfVestingTime = CLIFF + (DURATION - CLIFF) / 2;
      await time.increase(halfVestingTime);

      const claimable = await vestingManager.getClaimableAmount(beneficiary.address);

      // Should be approximately 50% vested
      const expectedVested = VESTING_AMOUNT / 2n;
      const tolerance = ethers.parseEther("1000"); // 1000 token tolerance

      expect(claimable).to.be.closeTo(expectedVested, tolerance);
    });

    it("Should vest 100% after duration", async function () {
      const startTime = await time.latest();

      await vestingManager.createVestingSchedule(
        beneficiary.address,
        VESTING_AMOUNT,
        startTime,
        CLIFF,
        DURATION
      );

      // Move past full duration
      await time.increase(DURATION + 1000);

      const claimable = await vestingManager.getClaimableAmount(beneficiary.address);
      expect(claimable).to.equal(VESTING_AMOUNT);
    });
  });

  describe("Claiming", function () {
    it("Should allow beneficiary to claim vested tokens", async function () {
      const startTime = await time.latest();

      await vestingManager.createVestingSchedule(
        beneficiary.address,
        VESTING_AMOUNT,
        startTime,
        CLIFF,
        DURATION
      );

      // Move past cliff
      await time.increase(CLIFF + 30 * 24 * 3600); // Cliff + 30 days

      const claimableBefore = await vestingManager.getClaimableAmount(beneficiary.address);
      expect(claimableBefore).to.be.gt(0);

      await expect(vestingManager.connect(beneficiary).claim())
        .to.emit(vestingManager, "TokensClaimed");

      const schedule = await vestingManager.getVestingSchedule(beneficiary.address);
      // Allow small precision difference
      expect(schedule.claimedAmount).to.be.closeTo(claimableBefore, ethers.parseEther("1"));

      // Check beneficiary received tokens
      const balance = await pulseToken.balanceOf(beneficiary.address);
      expect(balance).to.be.closeTo(claimableBefore, ethers.parseEther("1"));
    });

    it("Should prevent claiming before cliff", async function () {
      const startTime = await time.latest();

      await vestingManager.createVestingSchedule(
        beneficiary.address,
        VESTING_AMOUNT,
        startTime,
        CLIFF,
        DURATION
      );

      await expect(
        vestingManager.connect(beneficiary).claim()
      ).to.be.revertedWithCustomError(vestingManager, "NothingToClaim");
    });

    it("Should allow multiple partial claims", async function () {
      const startTime = await time.latest();

      await vestingManager.createVestingSchedule(
        beneficiary.address,
        VESTING_AMOUNT,
        startTime,
        CLIFF,
        DURATION
      );

      // First claim after cliff + 30 days
      await time.increase(CLIFF + 30 * 24 * 3600);
      const firstClaim = await vestingManager.getClaimableAmount(beneficiary.address);
      await vestingManager.connect(beneficiary).claim();

      // Second claim after another 30 days
      await time.increase(30 * 24 * 3600);
      const secondClaim = await vestingManager.getClaimableAmount(beneficiary.address);
      await vestingManager.connect(beneficiary).claim();

      const schedule = await vestingManager.getVestingSchedule(beneficiary.address);
      // Allow small precision difference
      expect(schedule.claimedAmount).to.be.closeTo(firstClaim + secondClaim, ethers.parseEther("1"));
    });
  });

  describe("Revoke Vesting", function () {
    it("Should allow owner to revoke vesting", async function () {
      const startTime = await time.latest();

      await vestingManager.createVestingSchedule(
        beneficiary.address,
        VESTING_AMOUNT,
        startTime,
        CLIFF,
        DURATION
      );

      // Move past cliff
      await time.increase(CLIFF + 30 * 24 * 3600);

      const vestedBefore = await vestingManager.getVestedAmount(beneficiary.address);

      await expect(vestingManager.revokeVesting(beneficiary.address))
        .to.emit(vestingManager, "VestingRevoked");

      const schedule = await vestingManager.getVestingSchedule(beneficiary.address);
      expect(schedule.revoked).to.be.true;
      // Allow small precision difference
      expect(schedule.totalAmount).to.be.closeTo(vestedBefore, ethers.parseEther("1"));
    });

    it("Should prevent claiming after revocation", async function () {
      const startTime = await time.latest();

      await vestingManager.createVestingSchedule(
        beneficiary.address,
        VESTING_AMOUNT,
        startTime,
        CLIFF,
        DURATION
      );

      // Move past cliff so there's some vested amount
      await time.increase(CLIFF + 30 * 24 * 3600);

      await vestingManager.revokeVesting(beneficiary.address);

      // After revocation, the schedule still exists but is revoked
      await expect(
        vestingManager.connect(beneficiary).claim()
      ).to.be.revertedWithCustomError(vestingManager, "AlreadyRevoked");
    });
  });

  describe("Batch Operations", function () {
    it("Should create multiple vesting schedules in batch", async function () {
      const startTime = await time.latest();
      const beneficiaries = [beneficiary.address, idoContract.address];
      const amounts = [VESTING_AMOUNT, VESTING_AMOUNT];

      await vestingManager.createVestingScheduleBatch(
        beneficiaries,
        amounts,
        startTime,
        CLIFF,
        DURATION
      );

      const schedule1 = await vestingManager.getVestingSchedule(beneficiaries[0]);
      const schedule2 = await vestingManager.getVestingSchedule(beneficiaries[1]);

      expect(schedule1.totalAmount).to.equal(VESTING_AMOUNT);
      expect(schedule2.totalAmount).to.equal(VESTING_AMOUNT);
    });
  });
});
