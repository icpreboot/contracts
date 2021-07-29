import { ethers } from "hardhat";
import { ContractFactory } from "@ethersproject/contracts";
import { Signer } from "@ethersproject/abstract-signer";

import { ICPRToken__factory } from "../typechain";

type AsyncReturnType<T extends (...args: any) => any> = T extends (...args: any) => Promise<infer U>
  ? U
  : T extends (...args: any) => infer U
  ? U
  : any;

type Contract<F extends ContractFactory> = AsyncReturnType<F["deploy"]>;

const deployOrAttach = <F extends ContractFactory>(contractName: string) => {
  return {
    deploy: async (...args: Parameters<any>): Promise<Contract<F>> => {
      let defaultSigner = (await ethers.getSigners())[0];
      return (await ethers.getContractFactory(contractName, defaultSigner)).deploy(...args) as Contract<F>;
    },
    attach: attachOnly<F>(contractName).attach
  };
};

const attachOnly = <F extends ContractFactory>(contractName: string) => {
  return {
    attach: async (address: string, signer?: Signer): Promise<Contract<F>> => {
      let defaultSigner = (await ethers.getSigners())[0];
      return ethers.getContractAt(contractName, address, signer ? signer : defaultSigner) as Contract<F>;
    }
  };
};

const getContracts = () => ({
  ICPRToken: deployOrAttach<ICPRToken__factory>("ICPRToken")
});

export default getContracts();
