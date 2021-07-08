# ICP Reboot

[![Test](https://github.com/icpReboot/contracts/actions/workflows/workflow.yml/badge.svg)](https://github.com/icpReboot/contracts/actions/workflows/workflow.yml)
[![License](https://img.shields.io/github/license/icpReboot/contracts?style=flat-square)](https://github.com/icpReboot/contracts/blob/master/LICENSE)

ICPR will be first represented as a standard and audited ERC20 token, with EIP2612 permit (EIP712 signed approvals) functionality to ease the integration of the token with the rest of the protocol and the ecosystem.

At launch, a total of 470M ICPR tokens will be minted and governed by the ICP Reboot DAO (a 6-out-of-9 MultiSig).

According to their original allocations, about 165M ICPR tokens will be distributed to ICP early contributors and seed investors in the first phase. The distribution will be managed by a separate contract, allowing contributors to claim their fully vested allocations without any additional locking or vesting schedule. Due to the convoluted, complicated, and semi-transparent way dfinity.org handled these allocations, we expect this contract to be launched after an overhaul effort of mapping and auditing these allocations.

We in the ICP Reboot community are well aware of the mishandling and mismanagement of early contributors and seed investors who have put their trust in the toolset offered by dfinity.org, thus lost access to their original key material and backups. We are committed to set a compliant and transparent process of analyzing such cases and reallocate contributor allocations via the DAO.

During the first phases, the ICPR token might be subjected to a DAO governed and audited inflation to support any additional community claimed incentive programs to support early adopters of the network (such as staking, liquidity provision, etc.). Initially, the DAO will govern this capability, but eventually, it will be renounced and delegated to the staking incentives smart contract.
