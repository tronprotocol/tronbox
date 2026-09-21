// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// TIP-44 isContract, TIP-43 batchvalidatesign, TIP-60 validatemultisign
contract TvmBuiltins {
  function checkContract(address a) external view returns (bool) {
    return a.isContract;
  }

  function batchValidateSign(bytes32 hash, bytes[] memory signatures, address[] memory addresses)
    public
    pure
    returns (bytes32)
  {
    return batchvalidatesign(hash, signatures, addresses);
  }

  function validateMultiSign(address a, uint256 permissionId, bytes32 hash, bytes[] memory signatures)
    public
    view
    returns (bool)
  {
    return validatemultisign(a, permissionId, hash, signatures);
  }
}
