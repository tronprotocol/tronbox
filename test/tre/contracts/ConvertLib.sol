// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

library ConvertLib {
    function convert(uint256 amount, uint256 conversionRate) public pure returns (uint256 convertedAmount) {
        return amount * conversionRate;
    }
}
