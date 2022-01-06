//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Swap is Ownable {
    using SafeMath for uint256;

    //List token whitelist for swap
    mapping(address => bool) tokenWhitelist;

    //Exchange rates by from A to middle token
    mapping(address => uint256) exchangeRates;

    //Token Decimal
    mapping(address => uint8) decimals;

    // User token approval
    mapping(address => mapping(address => address)) tokenApproval;

    event SwapToken(address tokenA, address tokenB, uint256 amount);

    constructor() {

    }

    modifier pairCheck(address _tokenA, address _tokenB) {
        require(tokenWhitelist[_tokenA] == true && tokenWhitelist[_tokenB], "Token not whitelisted");
        // require(decimals[_tokenA] != 0 && decimals[_tokenB] != 0, "Token decimal is not valid"); // Throw error if whitelist native token with decimal = 0
        require(exchangeRates[_tokenA] != 0 && exchangeRates[_tokenB] != 0, "Exchange rates is not valid");
        _;
    }

    function _checkWhitelist(address _address) internal view returns (bool){
        return tokenWhitelist[_address];
    }

    function checkTokenWhitelist(address _address) external view returns (bool){
        return tokenWhitelist[_address];
    }

    function whitelist(address _token, uint8 _decimal, uint256 _rate) external onlyOwner {
        tokenWhitelist[_token] = true;
        decimals[_token] = _decimal;
        exchangeRates[_token] = _rate;
    }

    function delist(address _token) external onlyOwner {
        tokenWhitelist[_token] = false;
        decimals[_token] = 0;
    }

    function swapToken(address _tokenA, address _tokenB, uint256 _amount) external payable pairCheck(_tokenA, _tokenB) {
        console.log("Swap from %s to %s with amount %s", _tokenA, _tokenB, _amount);
        uint256 swapAmount = (_amount * exchangeRates[_tokenA] * 10 ** decimals[_tokenA])
        / (exchangeRates[_tokenB] * 10 ** decimals[_tokenB]);
        console.log("Rate A %s Decimal %s", exchangeRates[_tokenA], decimals[_tokenA]);
        console.log("Rate B %s Decimal %s", exchangeRates[_tokenB], decimals[_tokenB]);
        console.log("Swap Amount %s", swapAmount);

        if (_tokenA == address(0)) {
            // No necessary due to amount already included. Just need to check amount is correct or do something like forward to another address
            // (bool sent,) = address(this).call{value : _amount}("");
            // console.log(sent, "Transaction result");
            require(msg.value == _amount);
        } else {
            IERC20 tokenA = IERC20(_tokenA);
            tokenA.transferFrom(msg.sender, address(this), _amount);
        }

        if (_tokenB == address(0)) {
            (bool sent,) = msg.sender.call{value : swapAmount}("");
            require(sent, "Transaction failed");
        } else {
            IERC20 tokenB = IERC20(_tokenB);
            tokenB.transfer(msg.sender, swapAmount);
        }
    }

    // Function to receive Ether. msg.data must be empty
    receive() external payable {}

    // Fallback function is called when msg.data is not empty
    fallback() external payable {}

    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
