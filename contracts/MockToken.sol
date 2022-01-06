//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20{
    constructor(
        string memory _name,
        string memory _symbol,
        uint256 _supply,
        uint256 _decimal
    ) ERC20(_name, _symbol) {
        uint256 totalSupply = _supply * 10 ** _decimal;
        _mint(msg.sender, totalSupply);
    }
}
