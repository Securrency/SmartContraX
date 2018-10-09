pragma solidity ^0.4.24;


/**
* @title Components registry interface
*/
contract IComponentsRegistry {
    /**
    * @notice Update existing component
    * @param oldAddress Component to update
    * @param newAddress New component address
    */
    function updateComponent(address oldAddress, address newAddress) external;

    /**
    * @notice Register new components int the system
    * @param componentAddress Address of the new component
    */
    function registerNewComponent(address componentAddress) public;

    /**
    * @notice Remove component from the system
    * @param componentAddress Address of the component which will be removed
    */
    function removeComponent(address componentAddress) public;

    /**
    * @notice Return component address by component id
    * @param id Component identifier
    */
    function getAddressById(bytes4 id) public view returns (address);

    /**
    * @notice Return component name by component id
    * @param id Component identifier
    */
    function getNameById(bytes4 id) public view returns (bytes);

    /**
    * @notice Get the number of components
    */
    function numberOfComponents() public view returns (uint);
}