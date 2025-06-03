// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ConvertLib - Conversion Library
 * @dev Provides a simple conversion function to multiply a value by a conversion rate.
 */
library ConvertLib {
  /**
   * @dev Multiplies the input value by the specified conversion rate.
   * @param _amount The value to convert.
   * @param _conversionRate The conversion rate.
   * @return convertedAmount The converted value.
   */
  function convert(uint _amount, uint _conversionRate) public pure returns (uint convertedAmount) {
    return _amount * _conversionRate;
  }
}
