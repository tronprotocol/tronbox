// SPDX-License-Identifier: MIT
// NOTE: Do not use this code snippet, it's incomplete and has a critical vulnerability! Only for test cases.

pragma solidity >=0.4.22 <0.9.0;

contract TransparentBoxV2 {
  uint256 public value;
  uint256 public valueV2;

  function initialize(uint256 _value) public {
    value = _value;
  }

  function setValue(uint256 newValue) public {
    value = newValue;
  }

  function setValueV2(uint256 newValue) public {
    valueV2 = newValue;
  }
}
