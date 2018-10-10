pragma solidity ^0.4.24;


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
    function getComponentName() public view returns (bytes);
}