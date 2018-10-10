pragma solidity ^0.4.24;

import "../component/SystemComponent.sol";


/**
* @title Component mock
*/
contract ComponentMock is SystemComponent {
    // init component
    constructor(bytes name) public {
        componentName = name;
        componentId = bytes4(keccak256(name));
    }
}