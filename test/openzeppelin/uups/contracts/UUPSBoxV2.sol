// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import '@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol';
import '@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol';

contract UUPSBoxV2 is Initializable, OwnableUpgradeable, UUPSUpgradeable {
  uint256 public value;
  uint256 public valueV2;

  /// @custom:oz-upgrades-unsafe-allow constructor
  constructor() {
    _disableInitializers();
  }

  function initialize(uint256 _value) public initializer {
    value = _value;
    __Ownable_init();
    __UUPSUpgradeable_init();
  }

  function _authorizeUpgrade(
    address newImplementation
  ) internal override onlyOwner {}

  function setValue(uint256 newValue) public {
    value = newValue;
  }

  function setValueV2(uint256 newValue) public {
    valueV2 = newValue;
  }
}
