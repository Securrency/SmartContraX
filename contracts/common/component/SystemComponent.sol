pragma solidity ^0.5.0;

import "./interfaces/IComponent.sol";


/**
* @title System component
*/
contract SystemComponent is IComponent {
    // Component id 
    bytes4 public componentId;

    // Component name
    bytes public componentName;

    /**
    * @notice Return component id
    */
    function getComponentId() public view returns (bytes4) {
        return componentId;
    }

    /**
    * @notice Retun component name
    */
    function getComponentName() public view returns (bytes memory) {
        return componentName;
    }
}