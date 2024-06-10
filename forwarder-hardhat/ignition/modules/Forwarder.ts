import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("Forwarder", (m) => {
    const masterForwarder = m.contract("Forwarder");
    m.call(masterForwarder, "init", [m.getParameter("destination")]);
    const forwarderFactory = m.contract("ForwarderFactory");
    return { masterForwarder, forwarderFactory };
});