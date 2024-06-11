import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";


const LockModule = buildModule("Forwarder", (m) => {
    const forwarder = m.contract("Forwarder");

    m.call(forwarder, "init", [m.getParameter("destination")])
    
    const forwarderFactory = m.contract("ForwarderFactory", [forwarder]);

    return { forwarder, forwarderFactory };
});

export default LockModule;