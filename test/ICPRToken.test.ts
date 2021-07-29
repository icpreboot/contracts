import { expect } from "chai";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { TypedDataUtils, signTypedMessage } from "eth-sig-util";
import { fromRpcSig } from "ethereumjs-util";
import Wallet from "ethereumjs-wallet";

import Contracts from "./Contracts";
import { ICPRToken } from "../typechain";

const {
  constants: { AddressZero, MaxUint256 }
} = ethers;

describe("ICPRToken", () => {
  const TOKEN_NAME = "ICP Reboot";
  const TOKEN_SYMBOL = "ICPR";

  let accounts: SignerWithAddress[];
  let owner: SignerWithAddress;
  let holder: SignerWithAddress;
  let spender: SignerWithAddress;

  let token: ICPRToken;

  before(async () => {
    accounts = await ethers.getSigners();

    [owner, holder, spender] = accounts;
  });

  beforeEach(async () => {
    token = await Contracts.ICPRToken.deploy();
  });

  describe("initialization", () => {
    const GENESIS_SUPPLY = BigNumber.from(470_000_000).mul(BigNumber.from(10).pow(18));

    it("should be initialized", async () => {
      expect(await token.symbol()).to.be.equal(TOKEN_SYMBOL);
      expect(await token.name()).to.be.equal(TOKEN_NAME);
      expect(await token.totalSupply()).to.be.equal(GENESIS_SUPPLY);
      expect(await token.balanceOf(owner.address)).to.be.equal(GENESIS_SUPPLY);
    });
  });

  describe("permit", () => {
    const VERSION = "1";
    const HARDHAT_CHAIN_ID = 31337;
    const PERMIT_TYPE: "EIP712Domain" | "Permit" = "Permit";

    const EIP712_DOMAIN = [
      { name: "name", type: "string" },
      { name: "version", type: "string" },
      { name: "chainId", type: "uint256" },
      { name: "verifyingContract", type: "address" }
    ];

    const PERMIT = [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" }
    ];

    const wallet = Wallet.generate();
    const sender = wallet.getAddressString();

    const domainSeparator = (name: string, version: string, chainId: number, verifyingContract: string) => {
      return (
        "0x" +
        TypedDataUtils.hashStruct(
          "EIP712Domain",
          { name, version, chainId, verifyingContract },
          { EIP712Domain: EIP712_DOMAIN }
        ).toString("hex")
      );
    };

    const buildData = (
      name: string,
      version: string,
      chainId: number,
      verifyingContract: string,
      owner: string,
      spender: string,
      amount: BigNumberish,
      nonce: BigNumberish,
      deadline: BigNumberish = MaxUint256.toString()
    ) => ({
      primaryType: PERMIT_TYPE,
      types: { EIP712Domain: EIP712_DOMAIN, Permit: PERMIT },
      domain: { name, version, chainId, verifyingContract },
      message: { owner, spender, value: amount, nonce, deadline }
    });

    const latest = async () => {
      const block = await ethers.provider.getBlock("latest");
      return BigNumber.from(block.timestamp);
    };

    it("should have the correct domain separator", async () => {
      expect(await token.DOMAIN_SEPARATOR()).to.be.equal(
        await domainSeparator(TOKEN_NAME, VERSION, HARDHAT_CHAIN_ID, token.address)
      );
    });

    it("should allow EIP2612 permits", async function () {
      const amount = BigNumber.from(123);

      const data = buildData(
        TOKEN_NAME,
        VERSION,
        HARDHAT_CHAIN_ID,
        token.address,
        sender,
        spender.address,
        amount.toNumber(),
        0
      );
      const signature = signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await token.permit(sender, spender.address, amount, MaxUint256, v, r, s);

      expect(await token.nonces(sender)).to.be.equal(BigNumber.from(1));
      expect(await token.allowance(sender, spender.address)).to.be.equal(amount);
    });

    it("should reject a reused signature", async function () {
      const amount = BigNumber.from(100);

      const data = buildData(
        TOKEN_NAME,
        VERSION,
        HARDHAT_CHAIN_ID,
        token.address,
        sender,
        spender.address,
        amount.toNumber(),
        0
      );
      const signature = signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await token.permit(sender, spender.address, amount, MaxUint256, v, r, s);

      await expect(token.permit(sender, spender.address, amount, MaxUint256, v, r, s)).to.be.revertedWith(
        "ERC20Permit: invalid signature"
      );
    });

    it("should reject an invalid signature", async function () {
      const amount = BigNumber.from(222);

      const otherWallet = Wallet.generate();
      const data = buildData(
        TOKEN_NAME,
        VERSION,
        HARDHAT_CHAIN_ID,
        token.address,
        sender,
        spender.address,
        amount.toNumber(),
        0
      );
      const signature = signTypedMessage(otherWallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await expect(token.permit(sender, spender.address, amount, MaxUint256, v, r, s)).to.be.revertedWith(
        "ERC20Permit: invalid signature"
      );
    });

    it("should reject an expired permit", async function () {
      const amount = BigNumber.from(500);
      const deadline = (await latest()).sub(BigNumber.from(1));

      const data = buildData(
        TOKEN_NAME,
        VERSION,
        HARDHAT_CHAIN_ID,
        token.address,
        sender,
        spender.address,
        amount.toNumber(),
        0,
        deadline.toNumber()
      );
      const signature = signTypedMessage(wallet.getPrivateKey(), { data });
      const { v, r, s } = fromRpcSig(signature);

      await expect(token.permit(sender, spender.address, amount, deadline, v, r, s)).to.be.revertedWith(
        "ERC20Permit: expired deadline"
      );
    });
  });

  describe("minting", () => {
    it("should allow the owner to mint tokens", async () => {
      const prevBalance = await token.balanceOf(holder.address);
      const prevTotalSupply = await token.totalSupply();

      const newAmount = BigNumber.from(123);
      const tx = await token.connect(owner).mint(holder.address, newAmount);
      await expect(tx).to.emit(token, "Transfer").withArgs(AddressZero, holder.address, newAmount);

      expect(await token.balanceOf(holder.address)).to.be.equal(prevBalance.add(newAmount));
      expect(await token.totalSupply()).to.be.equal(prevTotalSupply.add(newAmount));
    });

    it("should not allow any other account to mint tokens", async () => {
      await expect(token.connect(holder).mint(holder.address, BigNumber.from(1))).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
    });
  });

  describe("burning", () => {
    const INITIAL_BALANCE = BigNumber.from(234234);

    beforeEach(async () => {
      await token.connect(owner).transfer(holder.address, INITIAL_BALANCE);
    });

    it("should allow token holders to burn their tokens", async () => {
      const amount = BigNumber.from(12345);
      const prevBalance = await token.balanceOf(holder.address);

      const tx = await token.connect(holder).burn(amount);
      await expect(tx).to.emit(token, "Transfer").withArgs(holder.address, AddressZero, amount);

      expect(await token.balanceOf(holder.address)).to.be.equal(prevBalance.sub(amount));
    });

    it("should not allow token holders to burn more than their balance", async () => {
      await expect(
        token.connect(holder).burn((await token.balanceOf(holder.address)).add(BigNumber.from(1)))
      ).to.be.revertedWith("ERC20: burn amount exceeds balance");
    });

    context("with an allowance", async () => {
      const INITIAL_ALLOWANCE = BigNumber.from(10000);

      beforeEach(async () => {
        await token.connect(holder).approve(spender.address, INITIAL_ALLOWANCE);
      });

      it("should allow token holders to approve burning of their tokens", async () => {
        const amount = BigNumber.from(1);
        const prevBalance = await token.balanceOf(holder.address);

        const tx = await token.connect(spender).burnFrom(holder.address, amount);
        await expect(tx).to.emit(token, "Transfer").withArgs(holder.address, AddressZero, amount);

        expect(await token.balanceOf(holder.address)).to.be.equal(prevBalance.sub(amount));
      });

      it("should not allow token holders to approve burning more than their balance", async () => {
        await expect(
          token
            .connect(spender)
            .burnFrom(holder.address, (await token.balanceOf(holder.address)).add(BigNumber.from(1)))
        ).to.be.revertedWith("ERC20: burn amount exceeds allowance");
      });

      it("should not allow token holders to approve burning more than their approved allowance", async () => {
        await expect(
          token
            .connect(spender)
            .burnFrom(holder.address, (await token.allowance(holder.address, spender.address)).add(BigNumber.from(1)))
        ).to.be.revertedWith("ERC20: burn amount exceeds allowance");
      });
    });
  });
});
