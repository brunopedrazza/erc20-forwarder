import { HardhatUserConfig, vars } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-abi-exporter";

import "./tasks/predictCloneAddress";
import "./tasks/cloneForwarderAndFlushERC20";

const privateKey = vars.get("FORWARDER_PRIVATE_KEY");

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    }
  },
  typechain: {
    outDir: 'src/types',
    target: 'ethers-v5',
  },
  etherscan: {
    apiKey: {
      mainnet: vars.get("ETHERSCAN_API_KEY"),
      sepolia: vars.get("ETHERSCAN_API_KEY"),
      polygon: vars.get("POLYGONSCAN_API_KEY"),
      polygonAmoy: vars.get("POLYGONSCAN_API_KEY"),
    }
  },
  networks: {
    hardhat: {
      allowUnlimitedContractSize: true
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    mainnet: {
      url: vars.get("MAINNET_RPC_ENDPOINT"),
      accounts: [privateKey],
      gas: 12450000
    },
    sepolia: {
      url: vars.get("SEPOLIA_RPC_ENDPOINT"),
      accounts: [privateKey],
      gas: 12450000
    },
    polygon: {
      url: vars.get("POLYGON_RPC_ENDPOINT"),
      accounts: [privateKey],
      gas: 12450000
    },
    polygonAmoy: {
      url: vars.get("AMOY_RPC_ENDPOINT"),
      accounts: [privateKey],
      gas: 12450000
    },
  },
  abiExporter: [
    {
      path: './abi/pretty',
      pretty: true,
    },
    {
      path: './abi/ugly',
      pretty: false,
    },
  ]
}

export default config;
