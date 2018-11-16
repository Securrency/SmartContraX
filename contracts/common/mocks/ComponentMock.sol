pragma solidity ^0.5.0;

import "../component/SystemComponent.sol";


/**
* @title Component mock
*/
contract ComponentMock is SystemComponent {
    // init component
    constructor(bytes memory name) public {
        componentName = name;
        componentId = bytes4(keccak256(name));
    }
}