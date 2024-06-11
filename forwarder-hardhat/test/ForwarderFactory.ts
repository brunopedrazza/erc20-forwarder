import { expect } from "chai";
import hre from "hardhat";
import { ForwarderFactory } from "../src/types/contracts";
import { extractClonedForwarderAddress } from "../utils/forwarderEventsUtils";
import { parseEther } from "ethers";

describe("ForwarderFactory", function () {
  const parentAddress = "0x03917b5178B20Bfa1Bce09312AE4EB140b87869e";
  const parentAddressMalicious = "0x29021D3658fb7aA11383a09117662248e9054223";

  let implementationAddress: string;
  let forwarderFactory: ForwarderFactory;

  beforeEach(async function() {
    const Forwarder = await hre.ethers.getContractFactory("Forwarder");
    const implementation = await Forwarder.deploy();
    implementationAddress = await implementation.getAddress();

    const ForwarderFactory = await hre.ethers.getContractFactory("ForwarderFactory");
    forwarderFactory = await ForwarderFactory.deploy(implementationAddress);
  });

  describe("Deployment", function () {
    it("Should set the correct implementation address", async function () {
      expect(await forwarderFactory.implementationAddress()).to.equal(implementationAddress);
    });
  });

  describe("Cloning", function () {
    it("Should not reject clone", async function () {
      await expect(forwarderFactory.cloneForwarder(parentAddress, 1)).not.to.be.rejected;
    });

    it("Should reject negative salt", async function () {
      await expect(forwarderFactory.cloneForwarder(parentAddress, -1)).to.be.rejected;
    });

    it("Should not be able to clone with same salt more than once", async function () {
      const salt = 1;
      await forwarderFactory.cloneForwarder(parentAddress, salt);
      await expect(forwarderFactory.cloneForwarder(parentAddress, salt)).to.be.rejected;
    });

    it("Should clone with correct parent address", async function () {
      const salt = 1;
      const cloneResponse = await forwarderFactory.cloneForwarder(parentAddress, salt);

      const clonedForwarderAddress = await extractClonedForwarderAddress(cloneResponse);

      const Forwarder = await hre.ethers.getContractFactory("Forwarder");
      const clonedForwarder = Forwarder.attach(clonedForwarderAddress);

      expect(await clonedForwarder.parentAddress()).to.equal(parentAddress);
    });

    it("Should not derive same cloned address for different destinations", async function () {
      const salt = 1;

      const cloneResponse = await forwarderFactory.cloneForwarder(parentAddress, salt);
      const clonedForwarderAddress = await extractClonedForwarderAddress(cloneResponse);

      const cloneResponseMalicious = await forwarderFactory.cloneForwarder(parentAddressMalicious, salt);
      const clonedForwarderAddressMalicious = await extractClonedForwarderAddress(cloneResponseMalicious);

      expect(clonedForwarderAddress).not.to.equal(clonedForwarderAddressMalicious);
    });

    it("Should emit ForwarderCreated event", async function () {
      await expect(forwarderFactory.cloneForwarder(parentAddress, 1))
        .to.emit(forwarderFactory, "ForwarderCreated");
    });
  });

  describe("Predict Clone", function () {
    it("Should predict the same address as emitted event", async function () {
      const salt = 1;
      const predictedAddress = await forwarderFactory.predictCloneAddress(parentAddress, salt);
      await expect(forwarderFactory.cloneForwarder(parentAddress, salt))
        .to.emit(forwarderFactory, "ForwarderCreated")
        .withArgs(predictedAddress, parentAddress);
    });

    it("Should not predict the same address as emitted event", async function () {
      const predicted = await forwarderFactory.predictCloneAddress(parentAddress, 1);

      function isDifferentThanPredicted(clonedAddress: string): boolean {
        return clonedAddress != predicted;
      }

      await expect(forwarderFactory.cloneForwarder(parentAddress, 2))
        .to.emit(forwarderFactory, "ForwarderCreated")
        .withArgs(isDifferentThanPredicted, parentAddress);
    });

    it("Should not predict same address for different parents", async function () {
      const predicted = await forwarderFactory.predictCloneAddress(parentAddress, 1);
      const predicted2 = await forwarderFactory.predictCloneAddress(parentAddressMalicious, 1);

      expect(predicted).not.to.equal(predicted2);
    });

    it("Should not predict same address for different salts", async function () {
      const predicted = await forwarderFactory.predictCloneAddress(parentAddress, 1);
      const predicted2 = await forwarderFactory.predictCloneAddress(parentAddress, 2);

      expect(predicted).not.to.equal(predicted2);
    });

    it("Should not predict same address for different salts and parents", async function () {
      const predicted = await forwarderFactory.predictCloneAddress(parentAddress, 1);
      const predicted2 = await forwarderFactory.predictCloneAddress(parentAddressMalicious, 2);

      expect(predicted).not.to.equal(predicted2);
    });
  });

  describe("Real-world Scenarios", function () {
    it("Should predict address, receive tokens on uninitialized clone, initialize and flush token to parent address", async function () {
      const salt = 99;
      const amount = BigInt(1);
      
      const TestToken = await hre.ethers.getContractFactory("TestToken");
      const testToken = await TestToken.deploy(amount, "Test", "TEST");
      const testTokenAddress = await testToken.getAddress();

      const beforeBalance = await testToken.balanceOf(parentAddress);

      const predictedAddress = await forwarderFactory.predictCloneAddress(parentAddress, salt);
      await testToken.transfer(predictedAddress, amount);

      await forwarderFactory.cloneForwarder(parentAddress, salt);

      const Forwarder = await hre.ethers.getContractFactory("Forwarder");
      const clonedForwarder = Forwarder.attach(predictedAddress);

      await clonedForwarder.flushTokens(testTokenAddress);

      const afterBalance = await testToken.balanceOf(parentAddress);

      expect(afterBalance).to.equal(beforeBalance + amount);
    });

    it("Should predict address, receive Ether on uninitialized clone and flush them on initialize", async function () {
      const salt = 99;
      const amount = parseEther("1");

      const [owner] = await hre.ethers.getSigners();

      const beforeBalance = await owner.provider.getBalance(parentAddress);

      const predictedAddress = await forwarderFactory.predictCloneAddress(parentAddress, salt);

      await owner.sendTransaction({ to: predictedAddress, value: amount });

      await forwarderFactory.cloneForwarder(parentAddress, salt);

      const afterBalance = await owner.provider.getBalance(parentAddress);

      expect(afterBalance).to.equal(beforeBalance + amount);
    });
  });
});
