pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

contract Tuple{
    struct Person{
        string name;
        uint256 age;
    }

    Person[] persons;

    constructor(Person memory person) {
        persons.push(person);
        persons.push(Person("zhang",20));
        persons.push(Person("zhaoliu",30));
    }

    
    function insert(Person memory person) public{
        persons.push(person);
    }

    function insertBatch(Person[] memory person) public {
        for(uint256 i = 0; i < person.length; i++){
            persons.push(person[i]);
        }
    }

    function insertBatch2(Person[] memory person) public returns(Person[] memory){
        for(uint256 i = 0; i < person.length; i++){
            persons.push(person[i]);
        }
        return persons;
    }

    function getPerson() view public returns(Person[] memory){
        return persons;
    }

    function getPerson2(Person memory person) pure public returns(Person memory){
        return person;
    }

    function getPersonById(uint256 id) view public returns(Person memory){
        return persons[id];
    }

}