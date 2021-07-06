// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/drafts/ERC20Permit.sol";

contract ICPRToken is ERC20, ERC20Burnable, ERC20Permit, Ownable {
    string private constant NAME = "ICP Reboot";
    string private constant SYMBOL = "ICPR";
    uint256 private constant GENESIS_SUPPLY = 470_000_000 * 10**18;

    constructor() ERC20(NAME, SYMBOL) ERC20Permit(NAME)  {
        _mint(msg.sender, GENESIS_SUPPLY);
    }

    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }
}
