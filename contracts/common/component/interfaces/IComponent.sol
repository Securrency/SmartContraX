pragma solidity ^0.5.0;


/**
* @title System component interface
*/
contract IComponent {
    /**
    * @notice Return component id
    */
    function getComponentId() public view returns (bytes4);

    /**
    * @notice Retun component name
    */
    function getComponentName() public view returns (bytes memory);
}