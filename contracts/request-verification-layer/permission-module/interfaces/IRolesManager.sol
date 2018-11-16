pragma solidity ^0.5.0;

contract IRolesManager {
    /**
    * @notice Create a new role in the permission module
    * @param name Name of the new role
    * @param parent Name of the new role parent
    */
    function createRole(bytes32 name, bytes32 parent) public;

    /**
    * @notice Deactivate role and stops all role permissions
    * @param name Role name
    */
    function deactivateRole(bytes32 name) public;

    /**
    * @notice Activate role
    * @param name Role name
    */
    function activateRole(bytes32 name) public;
    
    /**
    * @notice Add smart contract method to the role
    * @param methodId Method identifier
    * @param roleName Role name
    */
    function addMethodToTheRole(bytes4 methodId, bytes32 roleName) public;

    /**
    * @notice Remove smart contract method from the role
    * @param methodId Method identifier
    * @param roleName Role name
    */
    function removeMethodFromTheRole(bytes4 methodId, bytes32 roleName) public;

    /**
    * @notice Returns list of all supported roles
    */
    function getListOfAllRoles() public view returns (bytes32[] memory);

    /**
    * @notice Returns list of all supported methods by role
    */
    function getSupportedMethodsByRole(bytes32 roleName) public view returns (bytes4[] memory);
}