// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

contract Tuple {
  struct Person {
    string name;
    uint256 age;
  }

  Person[] persons;

  constructor(Person memory person) {
    persons.push(person);
    persons.push(Person('Lily', 20));
    persons.push(Person('Oscar', 30));
  }

  function insert(Person memory person) public {
    persons.push(person);
  }

  function insertBatch(Person[] memory person) public {
    for (uint256 i = 0; i < person.length; i++) {
      persons.push(person[i]);
    }
  }

  function getPerson() public view returns (Person[] memory) {
    return persons;
  }

  function echoPerson(Person memory person) public pure returns (Person memory) {
    return person;
  }

  function getPersonById(uint256 id) public view returns (Person memory) {
    return persons[id];
  }

  function func(uint256) public pure returns (bytes4) {
    return bytes4(keccak256('func(uint256)')); // 7f98a45e
  }

  function func(address) public pure returns (bytes4) {
    return bytes4(keccak256('func(address)')); // b8550dc7
  }
}
