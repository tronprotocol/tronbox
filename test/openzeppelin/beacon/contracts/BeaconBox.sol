// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract BeaconBox {
  uint256 public value;

  function initialize(uint256 _value) public {
    value = _value;
  }

  function setValue(uint256 newValue) public {
    value = newValue;
  }
}
