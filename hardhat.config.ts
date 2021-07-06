import { HardhatUserConfig } from "hardhat/config";

import "tsconfig-paths/register";

import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@typechain/hardhat";
import "solidity-coverage";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.7.6",
    settings: {
      optimizer: {
        enabled: true,
        runs: 10000
      },
      metadata: {
        bytecodeHash: "none"
      }
    }
  },

  mocha: {
    timeout: 300000,
    color: true,
    bail: true
  }
};

export default config;
