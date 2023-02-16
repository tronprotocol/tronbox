// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import "./ConvertLib.sol";

// This is just a simple example of a coin-like contract.
// It is not standards compatible and cannot be expected to talk to other
// coin/token contracts.

contract MetaCoin {
  uint256 public totalSupply = 0;
  mapping(address => uint) balances;

  event Transfer(address _from, address _to, uint256 _value);

  address owner;

  constructor(uint initialBalance) {
    owner = msg.sender;
    balances[msg.sender] = initialBalance;
  }

  function sendCoin(address receiver, uint amount) public returns (bool sufficient) {
    if (balances[msg.sender] < amount) return false;
    balances[msg.sender] -= amount;
    balances[receiver] += amount;
    emit Transfer(msg.sender, receiver, amount);
    return true;
  }

  function getBalance(address addr) public view returns (uint) {
    return balances[addr];
  }

  function getConvertedBalance(address addr) public view returns (uint){
    return ConvertLib.convert(getBalance(addr), 2);
  }

  function getOwner() public view returns (address) {
    return owner;
  }

  // Helper functions
  function getMsgSender() public view returns (address sender) {
    sender = msg.sender;
  }
  function getTrxBalance(address addr) public view returns (uint256 balance) {
    balance = addr.balance;
  }
  function getBlockNumber() public view returns (uint256 blockNumber) {
    blockNumber = block.number;
  }
  function getBlockHash(uint256 blockNumber) public view returns (bytes32 blockHash) {
    blockHash = blockhash(blockNumber);
  }
  function getLastBlockHash() public view returns (bytes32 blockHash) {
    blockHash = blockhash(block.number - 1);
  }
  function getCurrentBlockTimestamp() public view returns (uint256 timestamp) {
    timestamp = block.timestamp;
  }
  function getCurrentBlockDifficulty() public view returns (uint256 difficulty) {
    difficulty = block.difficulty;
  }
  function getCurrentBlockGasLimit() public view returns (uint256 gaslimit) {
    gaslimit = block.gaslimit;
  }
  function getCurrentBlockCoinbase() public view returns (address coinbase) {
    coinbase = block.coinbase;
  }
}
