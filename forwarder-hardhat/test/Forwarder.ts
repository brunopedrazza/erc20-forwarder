import { expect } from "chai";
import hre from "hardhat";
import { Forwarder } from "../src/types/contracts";

describe("Forwarder", function () {
  const destination = "0x03917b5178B20Bfa1Bce09312AE4EB140b87869e";

  let forwarder: Forwarder;

  beforeEach(async function() {
    const Forwarder = await hre.ethers.getContractFactory("Forwarder");
    forwarder = await Forwarder.deploy();
  });

  describe("Deployment", function () {
    it("Should not set the destination", async function () {
      expect(await forwarder.destination()).to.equal("0x0000000000000000000000000000000000000000");
    });
  });

  describe("Init", function () {
    it("Should not revert if not initialized", async function () {
      await expect(forwarder.init(destination)).not.to.be.reverted;
    });

    it("Should revert if already initialized", async function () {
      await forwarder.init(destination);

      await expect(forwarder.init(destination)).to.be.revertedWith(
        "Already initialized"
      );
    });

    it("Should revert if destination is empty", async function () {
      await expect(forwarder.init("0x0000000000000000000000000000000000000000")).to.be.revertedWith(
        "Destination should not be empty"
      );
    });

    it("Should init with the right destination", async function () {
      await forwarder.init(destination);

      expect(await forwarder.destination()).to.equal(destination);
    });
  });

  describe("Flush ERC20", function () {
    it("Should revert if is not initialized", async function () {
      await expect(forwarder.flushERC20("0x0000000000000000000000000000000000000000")).to.be.revertedWith(
        "Not initialized"
      );
    });

    it("Should revert if balance is zero", async function () {
      await forwarder.init(destination);

      const amount = 1;
      const TestToken = await hre.ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy(amount, "Test", "TEST");

      const testTokenAddress = await testToken.getAddress();

      await expect(forwarder.flushERC20(testTokenAddress)).to.be.revertedWith(
        "Forwarder balance should not be 0"
      );
    });

    it("Should send the correct amount to destination", async function () {
      await forwarder.init(destination);

      const forwarderAddress = await forwarder.getAddress();

      const amount = 1;
      const TestToken = await hre.ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy(amount, "Test", "TEST");

      const testTokenAddress = await testToken.getAddress();
      await testToken.transfer(forwarderAddress, amount);
      await forwarder.flushERC20(testTokenAddress);

      expect(await testToken.balanceOf(destination)).to.equal(amount);
    });
  });
});
