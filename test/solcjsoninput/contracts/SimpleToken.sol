// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import '@openzeppelin/contracts/access/Ownable.sol';

/**
 * @title SimpleToken
 * @dev A basic ERC20 token with minting capability
 * This contract demonstrates OpenZeppelin imports for testing TronBox compilation and JSON input file generation
 */
contract SimpleToken is ERC20, Ownable {
  uint256 public constant MAX_SUPPLY = 1000000 * 10 ** 18; // 1 million tokens

  /**
   * @dev Constructor that gives msg.sender all of initial supply
   * @param initialSupply The initial token supply to mint
   */
  constructor(uint256 initialSupply) ERC20('Simple Token', 'SMPL') Ownable(msg.sender) {
    require(initialSupply <= MAX_SUPPLY, 'Initial supply exceeds max supply');
    _mint(msg.sender, initialSupply);
  }

  /**
   * @dev Mint new tokens (only owner)
   * @param to Address to receive the minted tokens
   * @param amount Amount of tokens to mint
   */
  function mint(address to, uint256 amount) external onlyOwner {
    require(totalSupply() + amount <= MAX_SUPPLY, 'Would exceed max supply');
    _mint(to, amount);
  }

  /**
   * @dev Burn tokens from caller's balance
   * @param amount Amount of tokens to burn
   */
  function burn(uint256 amount) external {
    _burn(msg.sender, amount);
  }
}
