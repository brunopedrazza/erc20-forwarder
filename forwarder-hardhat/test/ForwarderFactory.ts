import { expect } from "chai";
import hre from "hardhat";
import { Forwarder, ForwarderFactory } from "../src/types/contracts";

describe("ForwarderFactory", function () {
  const destination = "0x03917b5178B20Bfa1Bce09312AE4EB140b87869e";

  let forwarderFactory: ForwarderFactory;
  let masterForwarder: Forwarder;
  let masterForwarderAddress: string;

  beforeEach(async function() {
    const ForwarderFactory = await hre.ethers.getContractFactory("ForwarderFactory");
    forwarderFactory = await ForwarderFactory.deploy();

    const Forwarder = await hre.ethers.getContractFactory("Forwarder");
    masterForwarder = await Forwarder.deploy();
    masterForwarderAddress = await masterForwarder.getAddress();

    await masterForwarder.init(destination);
  });

  describe("Cloning", function () {
    it("Should not reject clone", async function () {
      await expect(forwarderFactory.cloneForwarder(masterForwarderAddress, 1)).not.to.be.rejected;
    });

    it("Should reject negative salt", async function () {
      await expect(forwarderFactory.cloneForwarder(masterForwarderAddress, -1)).to.be.rejected;
    });

    it("Should not be able to clone with same salt more than once", async function () {
      const salt = 1;
      await forwarderFactory.cloneForwarder(masterForwarderAddress, salt);
      await expect(forwarderFactory.cloneForwarder(masterForwarderAddress, salt)).to.be.rejected;
    });

    it("Should match master forwarder destination", async function () {
      const salt = 1;
      await forwarderFactory.cloneForwarder(masterForwarderAddress, salt);
      const predicted = await forwarderFactory.predictCloneAddress(masterForwarderAddress, salt);

      const Forwarder = await hre.ethers.getContractFactory("Forwarder");
      const clonedForwarder = Forwarder.attach(predicted);
      expect(await clonedForwarder.destination()).to.equal(await masterForwarder.destination());
    });
  });

  describe("Predict Clone", function () {
    it("Should emit cloned address event with predicted address", async function () {
      const salt = 1;
      const predicted = await forwarderFactory.predictCloneAddress(masterForwarderAddress, salt);
      await expect(forwarderFactory.cloneForwarder(masterForwarderAddress, salt))
        .to.emit(forwarderFactory, "ClonedAddress")
        .withArgs(predicted);
    });

    it("Should not emit cloned address event with predicted address", async function () {
      const predicted = await forwarderFactory.predictCloneAddress(masterForwarderAddress, 1);

      function isDifferentThanPredicted(address: string): boolean {
        return address != predicted;
      }

      await expect(forwarderFactory.cloneForwarder(masterForwarderAddress, 2))
        .to.emit(forwarderFactory, "ClonedAddress")
        .withArgs(isDifferentThanPredicted);
    });
  });
});
