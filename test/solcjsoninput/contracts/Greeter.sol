// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

/**
 * @title Greeter
 * @dev A simple contract that stores and returns a greeting message
 * This is a standalone contract with no external dependencies
 */
contract Greeter {
  string private greeting;
  address public owner;
  uint256 public greetingChangeCount;

  event GreetingChanged(string oldGreeting, string newGreeting, address changedBy);

  /**
   * @dev Constructor sets the initial greeting
   * @param _greeting The initial greeting message
   */
  constructor(string memory _greeting) {
    greeting = _greeting;
    owner = msg.sender;
    greetingChangeCount = 0;
  }

  /**
   * @dev Get the current greeting
   * @return The current greeting string
   */
  function greet() public view returns (string memory) {
    return greeting;
  }

  /**
   * @dev Set a new greeting (anyone can call)
   * @param _greeting The new greeting message
   */
  function setGreeting(string memory _greeting) public {
    string memory oldGreeting = greeting;
    greeting = _greeting;
    greetingChangeCount++;

    emit GreetingChanged(oldGreeting, _greeting, msg.sender);
  }

  /**
   * @dev Reset greeting to default (only owner)
   */
  function resetGreeting() public {
    require(msg.sender == owner, 'Only owner can reset');
    setGreeting('Hello, World!');
  }

  /**
   * @dev Get greeting statistics
   * @return message The current greeting
   * @return changes Number of times greeting has been changed
   * @return currentOwner The contract owner
   */
  function getGreetingInfo() public view returns (string memory message, uint256 changes, address currentOwner) {
    return (greeting, greetingChangeCount, owner);
  }
}
