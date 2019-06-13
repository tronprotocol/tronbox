pragma solidity ^0.4.23;

library ConvertLib{
	function convert(uint amount,uint conversionRate) public pure returns (uint convertedAmount)
	{
		return amount * conversionRate;
	}
}
