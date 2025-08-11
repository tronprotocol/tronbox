// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { ERC20 } from '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import './ConvertLib.sol';

// To use console.log, you need TronBox Runtime Environment
// (https://hub.docker.com/r/tronbox/tre) as your private network.
// Uncomment this line to use console.log
// import "tronbox/console.sol";

/**
 * @title MetaCoin - Example Token Contract
 * @dev Implements a MetaCoin token contract with example methods.
 */
contract MetaCoin is ERC20 {
  // Address of the contract deployer
  address public owner;

  // Unlock time for TRX locking feature
  uint256 public unlockTime;

  /**
   * @param _initialSupply The initial supply.
   */
  constructor(uint256 _initialSupply) ERC20('MetaCoin', 'MC') {
    owner = msg.sender;
    _mint(msg.sender, _initialSupply);
  }

  /**
   * @dev Transfers tokens to a specified address.
   * @param _receiver The address to receive the tokens.
   * @param _amount The amount of tokens to send.
   * @return success Whether the transfer was successful. Returns false if the balance is insufficient.
   */
  function sendCoin(address _receiver, uint256 _amount) public returns (bool success) {
    _transfer(msg.sender, _receiver, _amount);

    // Uncomment the following line and the import of "tronbox/console.sol" to print logs in the terminal.
    // console.log("Transferring from %s to %s %s tokens", msg.sender, _receiver, _amount);

    return true;
  }

  /**
   * @dev Locks a certain amount of TRX until a specified unlock time.
   * @param _unlockTime The future unlock time.
   */
  function lock(uint256 _unlockTime) public payable {
    require(block.timestamp < _unlockTime, 'Unlock time should be in the future');
    require(msg.sender == owner, "You aren't the owner");

    unlockTime = _unlockTime;
  }

  /**
   * @dev Withdraws locked TRX to a specified address after the unlock time has passed.
   * @param _to The address to send the TRX to.
   */
  function withdraw(address _to) public {
    require(block.timestamp >= unlockTime, "You can't withdraw yet");
    require(msg.sender == owner, "You aren't the owner");
    require(_to != address(0), 'Invalid address');

    payable(_to).transfer(address(this).balance);
  }

  /**
   * @dev Gets the token balance of the specified address and converts it to another unit.
   * @param _account The address to query the balance for.
   * @return convertedBalance The converted balance.
   */
  function getConvertedBalance(address _account) public view returns (uint256 convertedBalance) {
    return ConvertLib.convert(balanceOf(_account), 2);
  }

  /**
   * @dev Gets the address of the contract owner.
   * @return ownerAddress The address of the contract owner.
   */
  function getOwner() public view returns (address ownerAddress) {
    return owner;
  }
}
