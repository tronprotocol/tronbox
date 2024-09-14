// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MyContract2 {
  uint256 public myNumber;

  constructor(uint256 _myNumber) payable {
    myNumber = _myNumber;
  }

  function setMyNumber(uint256 _myNumber) public payable {
    myNumber = _myNumber;
  }

  function getBalance(address _addr) public view returns (uint256 balance) {
    balance = _addr.balance;
  }

  function myAddress() public view returns (address addr) {
    addr = address(this);
  }

  function getSender() public view returns (address addr) {
    addr = msg.sender;
  }
}
