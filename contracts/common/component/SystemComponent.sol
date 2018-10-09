pragma solidity ^0.4.24;

import "./interfaces/IComponent.sol";


/**
* @title System component
*/
contract SystemComponent is IComponent {
    // Component id 
    bytes4 public id;

    // Component name
    bytes public name;
    
    /**
    * @notice Return component id
    */
    function getId() public view returns (bytes4) {
        return id;
    }

    /**
    * @notice Retun component name
    */
    function getName() public view returns (bytes) {
        return name;
    }
}