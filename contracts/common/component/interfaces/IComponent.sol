pragma solidity ^0.4.24;


/**
* @title System component interface
*/
contract IComponent {
    /**
    * @notice Return component id
    */
    function getId() public view returns (bytes4);

    /**
    * @notice Retun component name
    */
    function getName() public view returns (bytes);
}