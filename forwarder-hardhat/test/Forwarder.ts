import { expect } from "chai";
import hre from "hardhat";
import { Forwarder } from "../src/types/contracts";
import { parseEther } from "ethers";

describe("Forwarder", function () {
  const parentAddress = "0x03917b5178B20Bfa1Bce09312AE4EB140b87869e";

  let forwarder: Forwarder;
  let forwarderAddress: string;
  let owner: any;
  let ownerAddress: string;

  beforeEach(async function() {
    const Forwarder = await hre.ethers.getContractFactory("Forwarder");
    forwarder = await Forwarder.deploy();
    forwarderAddress = await forwarder.getAddress();

    [owner] = await hre.ethers.getSigners();
    ownerAddress = await owner.getAddress();
  });

  describe("Deployment", function () {
    it("Should not set the parent address", async function () {
      expect(await forwarder.parentAddress()).to.equal("0x0000000000000000000000000000000000000000");
    });
  });

  describe("Init", function () {
    it("Should not revert if not initialized", async function () {
      await expect(forwarder.init(parentAddress)).not.to.be.reverted;
    });

    it("Should revert if already initialized", async function () {
      await forwarder.init(parentAddress);

      await expect(forwarder.init(parentAddress)).to.be.revertedWith(
        "Already initialized"
      );
    });

    it("Should revert if parent address is empty", async function () {
      await expect(forwarder.init("0x0000000000000000000000000000000000000000")).to.be.revertedWith(
        "Parent should not be empty"
      );
    });

    it("Should init with the right parent address", async function () {
      await forwarder.init(parentAddress);

      expect(await forwarder.parentAddress()).to.equal(parentAddress);
    });

    it("Should flush correctly when initialized", async function () {
      const amount = parseEther("1");

      await owner.sendTransaction({ to: forwarderAddress, value: amount });

      const beforeBalance = await owner.provider.getBalance(parentAddress);
      await forwarder.init(parentAddress);
      const afterBalance = await owner.provider.getBalance(parentAddress);

      expect(afterBalance).to.equal(beforeBalance + amount);
    });
  });

  describe("Flush", function () {
    it("Should flush correctly on receive", async function () {
      const amount = parseEther("1");
      
      await forwarder.init(parentAddress);

      const beforeBalance = await owner.provider.getBalance(parentAddress);
      await owner.sendTransaction({ to: forwarderAddress, value: amount });
      const afterBalance = await owner.provider.getBalance(parentAddress);

      expect(afterBalance).to.equal(beforeBalance + amount);
    });

    it("Should flush correctly on fallback", async function () {
      const amount = parseEther("1");
      
      await forwarder.init(parentAddress);

      const beforeBalance = await owner.provider.getBalance(parentAddress);
      await owner.sendTransaction({ to: forwarderAddress, value: amount, data: "0x1234" });
      const afterBalance = await owner.provider.getBalance(parentAddress);

      expect(afterBalance).to.equal(beforeBalance + amount);
    });

    it("Should not flush if balance is zero", async function () {
      const [owner] = await hre.ethers.getSigners();

      const beforeBalance = await owner.provider.getBalance(parentAddress);
      await forwarder.init(parentAddress);
      await owner.sendTransaction({ to: forwarderAddress, value: 0 });
      const afterBalance = await owner.provider.getBalance(parentAddress);

      expect(beforeBalance).to.equal(afterBalance);
    });

    it("Should emit ForwarderDeposited event on flush", async function () {
      const amount = parseEther("1");

      await forwarder.init(parentAddress);
      await owner.sendTransaction({ to: forwarderAddress, value: amount });

      await expect(owner.sendTransaction({ to: forwarderAddress, value: amount }))
        .to.emit(forwarder, "ForwarderDeposited")
        .withArgs(ownerAddress, amount, "0x");
    });
  });

  describe("Flush Tokens", function () {
    it("Should revert if is not initialized", async function () {
      await expect(forwarder.flushTokens("0x0000000000000000000000000000000000000000")).to.be.revertedWith(
        "Not initialized"
      );
    });

    it("Should revert if token balance is zero", async function () {
      await forwarder.init(parentAddress);

      const amount = 1;
      const TestToken = await hre.ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy(amount, "Test", "TEST");

      const testTokenAddress = await testToken.getAddress();

      await expect(forwarder.flushTokens(testTokenAddress)).to.be.revertedWith(
        "Balance should not be zero"
      );
    });

    it("Should send the correct amount to parent address", async function () {
      await forwarder.init(parentAddress);

      const amount = 1;
      const TestToken = await hre.ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy(amount, "Test", "TEST");

      const testTokenAddress = await testToken.getAddress();
      await testToken.transfer(forwarderAddress, amount);
      await forwarder.flushTokens(testTokenAddress);

      expect(await testToken.balanceOf(parentAddress)).to.equal(amount);
    });
  });
});
