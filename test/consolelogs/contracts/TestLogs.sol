// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

import '../../../console.sol';

contract TestLogs {
  address addr1 = 0x000000000000000000000000000000000000aDd1;
  address addr2 = 0x000000000000000000000000000000000000adD2;
  address addr3 = 0x000000000000000000000000000000000000add3;
  address addr4 = 0x000000000000000000000000000000000000ADD4;

  bool bool1 = true;
  bool bool2 = false;
  bool bool3 = true;
  bool bool4 = false;

  string str1 = 'string1';
  string str2 = 'string2';
  string str3 = 'string3';
  string str4 = 'string4';

  int256 i1 = 1;

  uint256 u1 = 1;
  uint256 u2 = 2;
  uint256 u3 = 3;
  uint256 u4 = 4;

  bytes1 b1 = 0x01;
  bytes2 b2 = 0x0002;
  bytes3 b3 = 0x000003;
  bytes4 b4 = 0x00000004;
  bytes5 b5 = 0x0000000005;
  bytes6 b6 = 0x000000000006;
  bytes7 b7 = 0x00000000000007;
  bytes8 b8 = 0x0000000000000008;
  bytes9 b9 = 0x000000000000000009;
  bytes10 b10 = 0x00000000000000000010;
  bytes11 b11 = 0x0000000000000000000011;
  bytes12 b12 = 0x000000000000000000000012;
  bytes13 b13 = 0x00000000000000000000000013;
  bytes14 b14 = 0x0000000000000000000000000014;
  bytes15 b15 = 0x000000000000000000000000000015;
  bytes16 b16 = 0x00000000000000000000000000000016;
  bytes17 b17 = 0x0000000000000000000000000000000017;
  bytes18 b18 = 0x000000000000000000000000000000000018;
  bytes19 b19 = 0x00000000000000000000000000000000000019;
  bytes20 b20 = bytes20(0x0000000000000000000000000000000000000020);
  bytes21 b21 = 0x000000000000000000000000000000000000000021;
  bytes22 b22 = 0x00000000000000000000000000000000000000000022;
  bytes23 b23 = 0x0000000000000000000000000000000000000000000023;
  bytes24 b24 = 0x000000000000000000000000000000000000000000000024;
  bytes25 b25 = 0x00000000000000000000000000000000000000000000000025;
  bytes26 b26 = 0x0000000000000000000000000000000000000000000000000026;
  bytes27 b27 = 0x000000000000000000000000000000000000000000000000000027;
  bytes28 b28 = 0x00000000000000000000000000000000000000000000000000000028;
  bytes29 b29 = 0x0000000000000000000000000000000000000000000000000000000029;
  bytes30 b30 = 0x000000000000000000000000000000000000000000000000000000000030;
  bytes31 b31 = 0x00000000000000000000000000000000000000000000000000000000000031;
  bytes32 b32 = 0x0000000000000000000000000000000000000000000000000000000000000032;
  bytes bs = abi.encode(0x01, 0x01);
}

contract AddressAddressLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(address)');
    console.log(addr1);
    console.log('log(address,address)');
    console.log(addr1, addr2);
    console.log('log(address,address,address)');
    console.log(addr1, addr2, addr3);
    console.log('log(address,address,address,address)');
    console.log(addr1, addr2, addr3, addr4);
    console.log('log(address,address,address,bool)');
    console.log(addr1, addr2, addr3, bool1);
    console.log('log(address,address,address,string)');
    console.log(addr1, addr2, addr3, str1);
    console.log('log(address,address,address,uint256)');
    console.log(addr1, addr2, addr3, u1);
    console.log('log(address,address,bool)');
    console.log(addr1, addr2, bool1);
    console.log('log(address,address,bool,address)');
    console.log(addr1, addr2, bool1, addr3);
    console.log('log(address,address,bool,bool)');
    console.log(addr1, addr2, bool1, bool2);
    console.log('log(address,address,bool,string)');
    console.log(addr1, addr2, bool1, str1);
    console.log('log(address,address,bool,uint256)');
    console.log(addr1, addr2, bool1, u1);
    console.log('log(address,address,string)');
    console.log(addr1, addr2, str1);
    console.log('log(address,address,string,address)');
    console.log(addr1, addr2, str1, addr3);
    console.log('log(address,address,string,bool)');
    console.log(addr1, addr2, str1, bool1);
    console.log('log(address,address,string,string)');
    console.log(addr1, addr2, str1, str2);
    console.log('log(address,address,string,uint256)');
    console.log(addr1, addr2, str1, u1);
    console.log('log(address,address,uint256)');
    console.log(addr1, addr2, u1);
    console.log('log(address,address,uint256,address)');
    console.log(addr1, addr2, u1, addr3);
    console.log('log(address,address,uint256,bool)');
    console.log(addr1, addr2, u1, bool1);
    console.log('log(address,address,uint256,string)');
    console.log(addr1, addr2, u1, str1);
    console.log('log(address,address,uint256,uint256)');
    console.log(addr1, addr2, u1, u2);
    return true;
  }
}

contract AddressBoolLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(address,bool)');
    console.log(addr1, bool1);
    console.log('log(address,bool,address)');
    console.log(addr1, bool1, addr2);
    console.log('log(address,bool,address,address)');
    console.log(addr1, bool1, addr2, addr3);
    console.log('log(address,bool,address,bool)');
    console.log(addr1, bool1, addr2, bool2);
    console.log('log(address,bool,address,string)');
    console.log(addr1, bool1, addr2, str1);
    console.log('log(address,bool,address,uint256)');
    console.log(addr1, bool1, addr2, u1);
    console.log('log(address,bool,bool)');
    console.log(addr1, bool1, bool2);
    console.log('log(address,bool,bool,address)');
    console.log(addr1, bool1, bool2, addr2);
    console.log('log(address,bool,bool,bool)');
    console.log(addr1, bool1, bool2, bool3);
    console.log('log(address,bool,bool,string)');
    console.log(addr1, bool1, bool2, str1);
    console.log('log(address,bool,bool,uint256)');
    console.log(addr1, bool1, bool2, u1);
    console.log('log(address,bool,string)');
    console.log(addr1, bool1, str1);
    console.log('log(address,bool,string,address)');
    console.log(addr1, bool1, str1, addr2);
    console.log('log(address,bool,string,bool)');
    console.log(addr1, bool1, str1, bool2);
    console.log('log(address,bool,string,string)');
    console.log(addr1, bool1, str1, str2);
    console.log('log(address,bool,string,uint256)');
    console.log(addr1, bool1, str1, u1);
    console.log('log(address,bool,uint256)');
    console.log(addr1, bool1, u1);
    console.log('log(address,bool,uint256,address)');
    console.log(addr1, bool1, u1, addr2);
    console.log('log(address,bool,uint256,bool)');
    console.log(addr1, bool1, u1, bool2);
    console.log('log(address,bool,uint256,string)');
    console.log(addr1, bool1, u1, str1);
    console.log('log(address,bool,uint256,uint256)');
    console.log(addr1, bool1, u1, u2);
    return true;
  }
}

contract AddressStringLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(address,string)');
    console.log(addr1, str1);
    console.log('log(address,string,address)');
    console.log(addr1, str1, addr2);
    console.log('log(address,string,address,address)');
    console.log(addr1, str1, addr2, addr3);
    console.log('log(address,string,address,bool)');
    console.log(addr1, str1, addr2, bool1);
    console.log('log(address,string,address,string)');
    console.log(addr1, str1, addr2, str2);
    console.log('log(address,string,address,uint256)');
    console.log(addr1, str1, addr2, u1);
    console.log('log(address,string,bool)');
    console.log(addr1, str1, bool1);
    console.log('log(address,string,bool,address)');
    console.log(addr1, str1, bool1, addr2);
    console.log('log(address,string,bool,bool)');
    console.log(addr1, str1, bool1, bool2);
    console.log('log(address,string,bool,string)');
    console.log(addr1, str1, bool1, str2);
    console.log('log(address,string,bool,uint256)');
    console.log(addr1, str1, bool1, u1);
    console.log('log(address,string,string)');
    console.log(addr1, str1, str2);
    console.log('log(address,string,string,address)');
    console.log(addr1, str1, str2, addr2);
    console.log('log(address,string,string,bool)');
    console.log(addr1, str1, str2, bool1);
    console.log('log(address,string,string,string)');
    console.log(addr1, str1, str2, str3);
    console.log('log(address,string,string,uint256)');
    console.log(addr1, str1, str2, u1);
    console.log('log(address,string,uint256)');
    console.log(addr1, str1, u1);
    console.log('log(address,string,uint256,address)');
    console.log(addr1, str1, u1, addr2);
    console.log('log(address,string,uint256,bool)');
    console.log(addr1, str1, u1, bool1);
    console.log('log(address,string,uint256,string)');
    console.log(addr1, str1, u1, str2);
    console.log('log(address,string,uint256,uint256)');
    console.log(addr1, str1, u1, u2);
    return true;
  }
}

contract AddressUintLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(address,uint256)');
    console.log(addr1, u1);
    console.log('log(address,uint256,address)');
    console.log(addr1, u1, addr2);
    console.log('log(address,uint256,address,address)');
    console.log(addr1, u1, addr2, addr3);
    console.log('log(address,uint256,address,bool)');
    console.log(addr1, u1, addr2, bool1);
    console.log('log(address,uint256,address,string)');
    console.log(addr1, u1, addr2, str1);
    console.log('log(address,uint256,address,uint256)');
    console.log(addr1, u1, addr2, u2);
    console.log('log(address,uint256,bool)');
    console.log(addr1, u1, bool1);
    console.log('log(address,uint256,bool,address)');
    console.log(addr1, u1, bool1, addr2);
    console.log('log(address,uint256,bool,bool)');
    console.log(addr1, u1, bool1, bool2);
    console.log('log(address,uint256,bool,string)');
    console.log(addr1, u1, bool1, str1);
    console.log('log(address,uint256,bool,uint256)');
    console.log(addr1, u1, bool1, u2);
    console.log('log(address,uint256,string)');
    console.log(addr1, u1, str1);
    console.log('log(address,uint256,string,address)');
    console.log(addr1, u1, str1, addr2);
    console.log('log(address,uint256,string,bool)');
    console.log(addr1, u1, str1, bool1);
    console.log('log(address,uint256,string,string)');
    console.log(addr1, u1, str1, str2);
    console.log('log(address,uint256,string,uint256)');
    console.log(addr1, u1, str1, u2);
    console.log('log(address,uint256,uint256)');
    console.log(addr1, u1, u2);
    console.log('log(address,uint256,uint256,address)');
    console.log(addr1, u1, u2, addr2);
    console.log('log(address,uint256,uint256,bool)');
    console.log(addr1, u1, u2, bool1);
    console.log('log(address,uint256,uint256,string)');
    console.log(addr1, u1, u2, str1);
    console.log('log(address,uint256,uint256,uint256)');
    console.log(addr1, u1, u2, u3);
    return true;
  }
}

contract BoolAddressLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(bool,address)');
    console.log(bool1, addr1);
    console.log('log(bool,address,address)');
    console.log(bool1, addr1, addr2);
    console.log('log(bool,address,address,address)');
    console.log(bool1, addr1, addr2, addr3);
    console.log('log(bool,address,address,bool)');
    console.log(bool1, addr1, addr2, bool2);
    console.log('log(bool,address,address,string)');
    console.log(bool1, addr1, addr2, str1);
    console.log('log(bool,address,address,uint256)');
    console.log(bool1, addr1, addr2, u1);
    console.log('log(bool,address,bool)');
    console.log(bool1, addr1, bool2);
    console.log('log(bool,address,bool,address)');
    console.log(bool1, addr1, bool2, addr2);
    console.log('log(bool,address,bool,bool)');
    console.log(bool1, addr1, bool2, bool3);
    console.log('log(bool,address,bool,string)');
    console.log(bool1, addr1, bool2, str1);
    console.log('log(bool,address,bool,uint256)');
    console.log(bool1, addr1, bool2, u1);
    console.log('log(bool,address,string)');
    console.log(bool1, addr1, str1);
    console.log('log(bool,address,string,address)');
    console.log(bool1, addr1, str1, addr2);
    console.log('log(bool,address,string,bool)');
    console.log(bool1, addr1, str1, bool2);
    console.log('log(bool,address,string,string)');
    console.log(bool1, addr1, str1, str2);
    console.log('log(bool,address,string,uint256)');
    console.log(bool1, addr1, str1, u1);
    console.log('log(bool,address,uint256)');
    console.log(bool1, addr1, u1);
    console.log('log(bool,address,uint256,address)');
    console.log(bool1, addr1, u1, addr2);
    console.log('log(bool,address,uint256,bool)');
    console.log(bool1, addr1, u1, bool2);
    console.log('log(bool,address,uint256,string)');
    console.log(bool1, addr1, u1, str1);
    console.log('log(bool,address,uint256,uint256)');
    console.log(bool1, addr1, u1, u2);
    return true;
  }
}

contract BoolBoolLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(bool)');
    console.log(bool1);
    console.log('log(bool,bool)');
    console.log(bool1, bool2);
    console.log('log(bool,bool,address)');
    console.log(bool1, bool2, addr1);
    console.log('log(bool,bool,address,address)');
    console.log(bool1, bool2, addr1, addr2);
    console.log('log(bool,bool,address,bool)');
    console.log(bool1, bool2, addr1, bool3);
    console.log('log(bool,bool,address,string)');
    console.log(bool1, bool2, addr1, str1);
    console.log('log(bool,bool,address,uint256)');
    console.log(bool1, bool2, addr1, u1);
    console.log('log(bool,bool,bool)');
    console.log(bool1, bool2, bool3);
    console.log('log(bool,bool,bool,address)');
    console.log(bool1, bool2, bool3, addr1);
    console.log('log(bool,bool,bool,bool)');
    console.log(bool1, bool2, bool3, bool1);
    console.log('log(bool,bool,bool,string)');
    console.log(bool1, bool2, bool3, str1);
    console.log('log(bool,bool,bool,uint256)');
    console.log(bool1, bool2, bool3, u1);
    console.log('log(bool,bool,string)');
    console.log(bool1, bool2, str1);
    console.log('log(bool,bool,string,address)');
    console.log(bool1, bool2, str1, addr1);
    console.log('log(bool,bool,string,bool)');
    console.log(bool1, bool2, str1, bool1);
    console.log('log(bool,bool,string,string)');
    console.log(bool1, bool2, str1, str2);
    console.log('log(bool,bool,string,uint256)');
    console.log(bool1, bool2, str1, u1);
    console.log('log(bool,bool,uint256)');
    console.log(bool1, bool2, u1);
    console.log('log(bool,bool,uint256,address)');
    console.log(bool1, bool2, u1, addr1);
    console.log('log(bool,bool,uint256,bool)');
    console.log(bool1, bool2, u1, bool3);
    console.log('log(bool,bool,uint256,string)');
    console.log(bool1, bool2, u1, str1);
    console.log('log(bool,bool,uint256,uint256)');
    console.log(bool1, bool2, u1, u2);
    return true;
  }
}

contract BoolStringLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(bool,string)');
    console.log(bool1, str1);
    console.log('log(bool,string,address)');
    console.log(bool1, str1, addr1);
    console.log('log(bool,string,address,address)');
    console.log(bool1, str1, addr1, addr2);
    console.log('log(bool,string,address,bool)');
    console.log(bool1, str1, addr1, bool1);
    console.log('log(bool,string,address,string)');
    console.log(bool1, str1, addr1, str1);
    console.log('log(bool,string,address,uint256)');
    console.log(bool1, str1, addr1, u1);
    console.log('log(bool,string,bool)');
    console.log(bool1, str1, bool1);
    console.log('log(bool,string,bool,address)');
    console.log(bool1, str1, bool1, addr1);
    console.log('log(bool,string,bool,bool)');
    console.log(bool1, str1, bool1, bool2);
    console.log('log(bool,string,bool,string)');
    console.log(bool1, str1, bool1, str1);
    console.log('log(bool,string,bool,uint256)');
    console.log(bool1, str1, bool1, u1);
    console.log('log(bool,string,string)');
    console.log(bool1, str1, str2);
    console.log('log(bool,string,string,address)');
    console.log(bool1, str1, str2, addr1);
    console.log('log(bool,string,string,bool)');
    console.log(bool1, str1, str2, bool1);
    console.log('log(bool,string,string,string)');
    console.log(bool1, str1, str2, str3);
    console.log('log(bool,string,string,uint256)');
    console.log(bool1, str1, str2, u1);
    console.log('log(bool,string,uint256)');
    console.log(bool1, str1, u1);
    console.log('log(bool,string,uint256,address)');
    console.log(bool1, str1, u1, addr1);
    console.log('log(bool,string,uint256,bool)');
    console.log(bool1, str1, u1, bool1);
    console.log('log(bool,string,uint256,string)');
    console.log(bool1, str1, u1, str1);
    console.log('log(bool,string,uint256,uint256)');
    console.log(bool1, str1, u1, u2);
    return true;
  }
}

contract BoolUintLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(bool,uint256)');
    console.log(bool1, u1);
    console.log('log(bool,uint256,address)');
    console.log(bool1, u1, addr1);
    console.log('log(bool,uint256,address,address)');
    console.log(bool1, u1, addr1, addr2);
    console.log('log(bool,uint256,address,bool)');
    console.log(bool1, u1, addr1, bool1);
    console.log('log(bool,uint256,address,string)');
    console.log(bool1, u1, addr1, str1);
    console.log('log(bool,uint256,address,uint256)');
    console.log(bool1, u1, addr1, u1);
    console.log('log(bool,uint256,bool)');
    console.log(bool1, u1, bool1);
    console.log('log(bool,uint256,bool,address)');
    console.log(bool1, u1, bool1, addr1);
    console.log('log(bool,uint256,bool,bool)');
    console.log(bool1, u1, bool1, bool1);
    console.log('log(bool,uint256,bool,string)');
    console.log(bool1, u1, bool1, str1);
    console.log('log(bool,uint256,bool,uint256)');
    console.log(bool1, u1, bool1, u2);
    console.log('log(bool,uint256,string)');
    console.log(bool1, u1, str1);
    console.log('log(bool,uint256,string,address)');
    console.log(bool1, u1, str1, addr1);
    console.log('log(bool,uint256,string,bool)');
    console.log(bool1, u1, str1, bool2);
    console.log('log(bool,uint256,string,string)');
    console.log(bool1, u1, str1, str2);
    console.log('log(bool,uint256,string,uint256)');
    console.log(bool1, u1, str1, u2);
    console.log('log(bool,uint256,uint256)');
    console.log(bool1, u1, u2);
    console.log('log(bool,uint256,uint256,address)');
    console.log(bool1, u1, u2, addr1);
    console.log('log(bool,uint256,uint256,bool)');
    console.log(bool1, u1, u2, bool2);
    console.log('log(bool,uint256,uint256,string)');
    console.log(bool1, u1, u2, str1);
    console.log('log(bool,uint256,uint256,uint256)');
    console.log(bool1, u1, u2, u3);
    return true;
  }
}

contract StringAddressLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(string,address)');
    console.log(str1, addr1);
    console.log('log(string,address,address)');
    console.log(str1, addr1, addr2);
    console.log('log(string,address,address,address)');
    console.log(str1, addr1, addr2, addr3);
    console.log('log(string,address,address,bool)');
    console.log(str1, addr1, addr2, bool1);
    console.log('log(string,address,address,string)');
    console.log(str1, addr1, addr2, str2);
    console.log('log(string,address,address,uint256)');
    console.log(str1, addr1, addr2, u1);
    console.log('log(string,address,bool)');
    console.log(str1, addr1, bool1);
    console.log('log(string,address,bool,address)');
    console.log(str1, addr1, bool1, addr2);
    console.log('log(string,address,bool,bool)');
    console.log(str1, addr1, bool1, bool2);
    console.log('log(string,address,bool,string)');
    console.log(str1, addr1, bool1, str2);
    console.log('log(string,address,bool,uint256)');
    console.log(str1, addr1, bool1, u1);
    console.log('log(string,address,string)');
    console.log(str1, addr1, bool1, str2);
    console.log('log(string,address,string,address)');
    console.log(str1, addr1, str2, addr2);
    console.log('log(string,address,string,bool)');
    console.log(str1, addr1, str2, bool1);
    console.log('log(string,address,string,string)');
    console.log(str1, addr1, str2, str3);
    console.log('log(string,address,string,uint256)');
    console.log(str1, addr1, str2, u1);
    console.log('log(string,address,uint256)');
    console.log(str1, addr1, u1);
    console.log('log(string,address,uint256,address)');
    console.log(str1, addr1, u1, addr2);
    console.log('log(string,address,uint256,bool)');
    console.log(str1, addr1, u1, bool1);
    console.log('log(string,address,uint256,string)');
    console.log(str1, addr1, u1, str1);
    console.log('log(string,address,uint256,uint256)');
    console.log(str1, addr1, u1, u2);
    return true;
  }
}

contract StringBoolLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(string,bool)');
    console.log(str1, bool1);
    console.log('log(string,bool,address)');
    console.log(str1, bool1, addr1);
    console.log('log(string,bool,address,address)');
    console.log(str1, bool1, addr1, addr2);
    console.log('log(string,bool,address,bool)');
    console.log(str1, bool1, addr1, bool1);
    console.log('log(string,bool,address,string)');
    console.log(str1, bool1, addr1, str1);
    console.log('log(string,bool,address,uint256)');
    console.log(str1, bool1, addr1, u1);
    console.log('log(string,bool,bool)');
    console.log(str1, bool1, bool2);
    console.log('log(string,bool,bool,address)');
    console.log(str1, bool1, bool2, addr1);
    console.log('log(string,bool,bool,bool)');
    console.log(str1, bool1, bool2, bool3);
    console.log('log(string,bool,bool,string)');
    console.log(str1, bool1, bool2, str2);
    console.log('log(string,bool,bool,uint256)');
    console.log(str1, bool1, bool2, u1);
    console.log('log(string,bool,string)');
    console.log(str1, bool1, str2);
    console.log('log(string,bool,string,address)');
    console.log(str1, bool1, str2, addr1);
    console.log('log(string,bool,string,bool)');
    console.log(str1, bool1, str2, bool1);
    console.log('log(string,bool,string,string)');
    console.log(str1, bool1, str2, str1);
    console.log('log(string,bool,string,uint256)');
    console.log(str1, bool1, str2, u1);
    console.log('log(string,bool,uint256)');
    console.log(str1, bool1, u1);
    console.log('log(string,bool,uint256,address)');
    console.log(str1, bool1, u1, addr1);
    console.log('log(string,bool,uint256,bool)');
    console.log(str1, bool1, u1, bool1);
    console.log('log(string,bool,uint256,string)');
    console.log(str1, bool1, u1, str1);
    console.log('log(string,bool,uint256,uint256)');
    console.log(str1, bool1, u1, u2);
    return true;
  }
}

contract StringStringLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(string)');
    console.log(str1);
    console.log('log(string,string)');
    console.log(str1, str2);
    console.log('log(string,string,address)');
    console.log(str1, str2, addr1);
    console.log('log(string,string,address,address)');
    console.log(str1, str2, addr1, addr2);
    console.log('log(string,string,address,bool)');
    console.log(str1, str2, addr1, bool1);
    console.log('log(string,string,address,string)');
    console.log(str1, str2, addr1, str3);
    console.log('log(string,string,address,uint256)');
    console.log(str1, str2, addr1, u1);
    console.log('log(string,string,bool)');
    console.log(str1, str2, bool1);
    console.log('log(string,string,bool,address)');
    console.log(str1, str2, bool1, addr1);
    console.log('log(string,string,bool,bool)');
    console.log(str1, str2, bool1, bool2);
    console.log('log(string,string,bool,string)');
    console.log(str1, str2, bool1, str3);
    console.log('log(string,string,bool,uint256)');
    console.log(str1, str2, bool1, u1);
    console.log('log(string,string,string)');
    console.log(str1, str2, str3);
    console.log('log(string,string,string,address)');
    console.log(str1, str2, str3, addr1);
    console.log('log(string,string,string,bool)');
    console.log(str1, str2, str3, bool1);
    console.log('log(string,string,string,string)');
    console.log(str1, str2, str3, str4);
    console.log('log(string,string,string,uint256)');
    console.log(str1, str2, str3, u1);
    console.log('log(string,string,uint256)');
    console.log(str1, str2, u1);
    console.log('log(string,string,uint256,address)');
    console.log(str1, str2, u1, addr1);
    console.log('log(string,string,uint256,bool)');
    console.log(str1, str2, u1, bool1);
    console.log('log(string,string,uint256,string)');
    console.log(str1, str2, u1, str3);
    console.log('log(string,string,uint256,uint256)');
    console.log(str1, str2, u1, u2);
    return true;
  }
}

contract StringUintLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(string,uint256)');
    console.log(str1, u1);
    console.log('log(string,uint256,address)');
    console.log(str1, u1, addr1);
    console.log('log(string,uint256,address,address)');
    console.log(str1, u1, addr1, addr2);
    console.log('log(string,uint256,address,bool)');
    console.log(str1, u1, addr1, bool1);
    console.log('log(string,uint256,address,string)');
    console.log(str1, u1, addr1, str2);
    console.log('log(string,uint256,address,uint256)');
    console.log(str1, u1, addr1, u2);
    console.log('log(string,uint256,bool)');
    console.log(str1, u1, bool1);
    console.log('log(string,uint256,bool,address)');
    console.log(str1, u1, bool1, addr1);
    console.log('log(string,uint256,bool,bool)');
    console.log(str1, u1, bool1, bool2);
    console.log('log(string,uint256,bool,string)');
    console.log(str1, u1, bool1, str1);
    console.log('log(string,uint256,bool,uint256)');
    console.log(str1, u1, bool1, u2);
    console.log('log(string,uint256,string)');
    console.log(str1, u1, str1);
    console.log('log(string,uint256,string,address)');
    console.log(str1, u1, str1, addr1);
    console.log('log(string,uint256,string,bool)');
    console.log(str1, u1, str1, bool1);
    console.log('log(string,uint256,string,string)');
    console.log(str1, u1, str1, str2);
    console.log('log(string,uint256,string,uint256)');
    console.log(str1, u1, str1, u2);
    console.log('log(string,uint256,uint256)');
    console.log(str1, u1, u2);
    console.log('log(string,uint256,uint256,address)');
    console.log(str1, u1, u2, addr1);
    console.log('log(string,uint256,uint256,bool)');
    console.log(str1, u1, u2, bool1);
    console.log('log(string,uint256,uint256,string)');
    console.log(str1, u1, u2, str2);
    console.log('log(string,uint256,uint256,uint256)');
    console.log(str1, u1, u2, u3);
    return true;
  }
}

contract UintAddressLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(uint256,address)');
    console.log(u1, addr1);
    console.log('log(uint256,address,address)');
    console.log(u1, addr1, addr2);
    console.log('log(uint256,address,address,address)');
    console.log(u1, addr1, addr2, addr3);
    console.log('log(uint256,address,address,bool)');
    console.log(u1, addr1, addr2, bool1);
    console.log('log(uint256,address,address,string)');
    console.log(u1, addr1, addr2, str1);
    console.log('log(uint256,address,address,uint256)');
    console.log(u1, addr1, addr2, u2);
    console.log('log(uint256,address,bool)');
    console.log(u1, addr1, bool1);
    console.log('log(uint256,address,bool,address)');
    console.log(u1, addr1, bool1, addr2);
    console.log('log(uint256,address,bool,bool)');
    console.log(u1, addr1, bool1, bool2);
    console.log('log(uint256,address,bool,string)');
    console.log(u1, addr1, bool1, str1);
    console.log('log(uint256,address,bool,uint256)');
    console.log(u1, addr1, bool1, u2);
    console.log('log(uint256,address,string)');
    console.log(u1, addr1, str1);
    console.log('log(uint256,address,string,address)');
    console.log(u1, addr1, str1, addr1);
    console.log('log(uint256,address,string,bool)');
    console.log(u1, addr1, str1, bool1);
    console.log('log(uint256,address,string,string)');
    console.log(u1, addr1, str1, str2);
    console.log('log(uint256,address,string,uint256)');
    console.log(u1, addr1, str1, u2);
    console.log('log(uint256,address,uint256)');
    console.log(u1, addr1, u2);
    console.log('log(uint256,address,uint256,address)');
    console.log(u1, addr1, u2, addr2);
    console.log('log(uint256,address,uint256,bool)');
    console.log(u1, addr1, u2, bool1);
    console.log('log(uint256,address,uint256,string)');
    console.log(u1, addr1, u2, str1);
    console.log('log(uint256,address,uint256,uint256)');
    console.log(u1, addr1, u2, u3);
    return true;
  }
}

contract UintBoolLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(uint256,bool)');
    console.log(u1, bool1);
    console.log('log(uint256,bool,address)');
    console.log(u1, bool1, addr1);
    console.log('log(uint256,bool,address,address)');
    console.log(u1, bool1, addr1, addr2);
    console.log('log(uint256,bool,address,bool)');
    console.log(u1, bool1, addr1, bool2);
    console.log('log(uint256,bool,address,string)');
    console.log(u1, bool1, addr1, str1);
    console.log('log(uint256,bool,address,uint256)');
    console.log(u1, bool1, addr1, u2);
    console.log('log(uint256,bool,bool)');
    console.log(u1, bool1, bool2);
    console.log('log(uint256,bool,bool,address)');
    console.log(u1, bool1, bool2, addr1);
    console.log('log(uint256,bool,bool,bool)');
    console.log(u1, bool1, bool2, bool3);
    console.log('log(uint256,bool,bool,string)');
    console.log(u1, bool1, bool2, str1);
    console.log('log(uint256,bool,bool,uint256)');
    console.log(u1, bool1, bool2, u2);
    console.log('log(uint256,bool,string)');
    console.log(u1, bool1, str1);
    console.log('log(uint256,bool,string,address)');
    console.log(u1, bool1, str1, addr1);
    console.log('log(uint256,bool,string,bool)');
    console.log(u1, bool1, str1, bool2);
    console.log('log(uint256,bool,string,string)');
    console.log(u1, bool1, str1, str2);
    console.log('log(uint256,bool,string,uint256)');
    console.log(u1, bool1, str1, u2);
    console.log('log(uint256,bool,uint256)');
    console.log(u1, bool1, u2);
    console.log('log(uint256,bool,uint256,address)');
    console.log(u1, bool1, u2, addr1);
    console.log('log(uint256,bool,uint256,bool)');
    console.log(u1, bool1, u2, bool2);
    console.log('log(uint256,bool,uint256,string)');
    console.log(u1, bool1, u2, str1);
    console.log('log(uint256,bool,uint256,uint256)');
    console.log(u1, bool1, u2, u3);
    return true;
  }
}

contract UintStringLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(uint256,string)');
    console.log(u1, str1);
    console.log('log(uint256,string,address)');
    console.log(u1, str1, addr1);
    console.log('log(uint256,string,address,address)');
    console.log(u1, str1, addr1, addr2);
    console.log('log(uint256,string,address,bool)');
    console.log(u1, str1, addr1, bool1);
    console.log('log(uint256,string,address,string)');
    console.log(u1, str1, addr1, str1);
    console.log('log(uint256,string,address,uint256)');
    console.log(u1, str1, addr1, u2);
    console.log('log(uint256,string,bool)');
    console.log(u1, str1, bool1);
    console.log('log(uint256,string,bool,address)');
    console.log(u1, str1, bool1, addr1);
    console.log('log(uint256,string,bool,bool)');
    console.log(u1, str1, bool1, bool2);
    console.log('log(uint256,string,bool,string)');
    console.log(u1, str1, bool1, str2);
    console.log('log(uint256,string,bool,uint256)');
    console.log(u1, str1, bool1, u2);
    console.log('log(uint256,string,string)');
    console.log(u1, str1, str2);
    console.log('log(uint256,string,string,address)');
    console.log(u1, str1, str2, addr1);
    console.log('log(uint256,string,string,bool)');
    console.log(u1, str1, str2, bool1);
    console.log('log(uint256,string,string,string)');
    console.log(u1, str1, str2, str3);
    console.log('log(uint256,string,string,uint256)');
    console.log(u1, str1, str2, u2);
    console.log('log(uint256,string,uint256)');
    console.log(u1, str1, u2);
    console.log('log(uint256,string,uint256,address)');
    console.log(u1, str1, u2, addr1);
    console.log('log(uint256,string,uint256,bool)');
    console.log(u1, str1, u2, bool1);
    console.log('log(uint256,string,uint256,string)');
    console.log(u1, str1, u2, str2);
    console.log('log(uint256,string,uint256,uint256)');
    console.log(u1, str1, u2, u3);
    return true;
  }
}

contract UintUintLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log(uint256)');
    console.log(u1);
    console.log('log(uint256,uint256)');
    console.log(u1, u2);
    console.log('log(uint256,uint256,address)');
    console.log(u1, u2, addr1);
    console.log('log(uint256,uint256,address,address)');
    console.log(u1, u2, addr1, addr2);
    console.log('log(uint256,uint256,address,bool)');
    console.log(u1, u2, addr1, bool1);
    console.log('log(uint256,uint256,address,string)');
    console.log(u1, u2, addr1, str1);
    console.log('log(uint256,uint256,address,uint256)');
    console.log(u1, u2, addr1, u3);
    console.log('log(uint256,uint256,bool)');
    console.log(u1, u2, bool1);
    console.log('log(uint256,uint256,bool,address)');
    console.log(u1, u2, bool1, addr1);
    console.log('log(uint256,uint256,bool,bool)');
    console.log(u1, u2, bool1, bool2);
    console.log('log(uint256,uint256,bool,string)');
    console.log(u1, u2, bool1, str1);
    console.log('log(uint256,uint256,bool,uint256)');
    console.log(u1, u2, bool1, u3);
    console.log('log(uint256,uint256,string)');
    console.log(u1, u2, str1);
    console.log('log(uint256,uint256,string,address)');
    console.log(u1, u2, str1, addr1);
    console.log('log(uint256,uint256,string,bool)');
    console.log(u1, u2, str1, bool1);
    console.log('log(uint256,uint256,string,string)');
    console.log(u1, u2, str1, str2);
    console.log('log(uint256,uint256,string,uint256)');
    console.log(u1, u2, str1, u3);
    console.log('log(uint256,uint256,uint256)');
    console.log(u1, u2, u3);
    console.log('log(uint256,uint256,uint256,address)');
    console.log(u1, u2, u3, addr1);
    console.log('log(uint256,uint256,uint256,bool)');
    console.log(u1, u2, u3, bool1);
    console.log('log(uint256,uint256,uint256,string)');
    console.log(u1, u2, u3, str1);
    console.log('log(uint256,uint256,uint256,uint256)');
    console.log(u1, u2, u3, u4);
    return true;
  }
}

contract SingleLogs is TestLogs {
  function callLogs() public view returns (bool) {
    console.log('log()');
    console.log();
    console.logAddress(addr1);
    console.log('logBool(bool)');
    console.logBool(bool1);
    console.log('logBytes(bytes)');
    console.logBytes(bs);
    console.log('logBytes1(bytes1)');
    console.logBytes1(b1);
    console.log('logBytes2(bytes2)');
    console.logBytes2(b2);
    console.log('logBytes3(bytes3)');
    console.logBytes3(b3);
    console.log('logBytes4(bytes4)');
    console.logBytes4(b4);
    console.log('logBytes5(bytes5)');
    console.logBytes5(b5);
    console.log('logBytes6(bytes6)');
    console.logBytes6(b6);
    console.log('logBytes7(bytes7)');
    console.logBytes7(b7);
    console.log('logBytes8(bytes8)');
    console.logBytes8(b8);
    console.log('logBytes9(bytes9)');
    console.logBytes9(b9);
    console.log('logBytes10(bytes10)');
    console.logBytes10(b10);
    console.log('logBytes11(bytes11)');
    console.logBytes11(b11);
    console.log('logBytes12(bytes12)');
    console.logBytes12(b12);
    console.log('logBytes13(bytes13)');
    console.logBytes13(b13);
    console.log('logBytes14(bytes14)');
    console.logBytes14(b14);
    console.log('logBytes15(bytes15)');
    console.logBytes15(b15);
    console.log('logBytes16(bytes16)');
    console.logBytes16(b16);
    console.log('logBytes17(bytes17)');
    console.logBytes17(b17);
    console.log('logBytes18(bytes18)');
    console.logBytes18(b18);
    console.log('logBytes19(bytes19)');
    console.logBytes19(b19);
    console.log('logBytes20(bytes20)');
    console.logBytes20(b20);
    console.log('logBytes21(bytes21)');
    console.logBytes21(b21);
    console.log('logBytes22(bytes22)');
    console.logBytes22(b22);
    console.log('logBytes23(bytes23)');
    console.logBytes23(b23);
    console.log('logBytes24(bytes24)');
    console.logBytes24(b24);
    console.log('logBytes25(bytes25)');
    console.logBytes25(b25);
    console.log('logBytes26(bytes26)');
    console.logBytes26(b26);
    console.log('logBytes27(bytes27)');
    console.logBytes27(b27);
    console.log('logBytes28(bytes28)');
    console.logBytes28(b28);
    console.log('logBytes29(bytes29)');
    console.logBytes29(b29);
    console.log('logBytes30(bytes30)');
    console.logBytes30(b30);
    console.log('logBytes31(bytes31)');
    console.logBytes31(b31);
    console.log('logBytes32(bytes32)');
    console.logBytes32(b32);
    console.log('logInt(int256)');
    console.logInt(i1);
    console.log('logString(string)');
    console.logString(str1);
    console.log('logUint(uint256)');
    console.logUint(u1);
    return true;
  }
}

contract MostSignificantBitSetLogs {
  function callLogs() public view returns (bool) {
    uint256 p0 = uint256(0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff);
    uint256 p1 = uint256(0x8000000000000000000000000000000000000000000000000000000000000000);
    int256 p2 = int256(uint256(0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff));
    int256 p3 = int256(uint256(0x8000000000000000000000000000000000000000000000000000000000000000));
    console.log(p0);
    console.log(p1);
    console.logInt(p2);
    console.logInt(p3);
    return true;
  }
}

contract CreationLogs {
  constructor() {
    console.log('Deploy');
  }
}

contract CreationRevertingLogs {
  constructor() {
    console.log('Deploy Revert');
    revert();
  }
}

contract CreationMultipleLogs {
  constructor() {
    console.log('Before Deploy');
    new CreationLogs();
    console.log('After Deploy');
  }
}

contract SubTriggerLogs {
  function f1() public view {
    console.log('Trigger');
  }

  function f2() public view {
    console.log('Trigger Revert');
    revert();
  }
}

contract TriggerLogs {
  function f1() public {
    console.log('Before Trigger');
    SubTriggerLogs d = new SubTriggerLogs();
    d.f1();
    console.log('After Trigger');
  }

  function f2() public {
    console.log('Before Trigger');
    SubTriggerLogs d = new SubTriggerLogs();
    d.f2();
    console.log('After Trigger');
  }
}
