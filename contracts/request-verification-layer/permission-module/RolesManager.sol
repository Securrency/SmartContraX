pragma solidity ^0.5.0;

import "./interfaces/IRolesManager.sol";
import "./interfaces/IPMStorage.sol";
import "../../common/libraries/SafeMath8.sol";
import "../../common/libraries/SafeMath.sol";

/**
* @title Roles Manager
*/
contract RolesManager is IRolesManager {
    // define libraries
    using SafeMath for uint256;
    using SafeMath8 for uint8;

    // Predefined name of the owner role
    bytes32 ownerRole = bytes32("Owner");

    // Roles limit for the wallet
    uint8 constant rolesLimit = 20;

    // Address of the Permission module storage
    address pmStorage;

    /**
    * @notice Verify sender
    */
    modifier onlyOwner() {
        require(PMStorage().verifyRole(msg.sender, ownerRole), "Allowed only for the owner.");
        _;
    }

    /**
    * @notice Verify role
    */
    modifier validRole(bytes32 role) {
        bytes32 parentRole = PMStorage().getParentRole(role);
        require((role != 0x00 && parentRole != 0x00) || role == ownerRole, "Invalid role.");
        _;
    }

    /**
    * @notice Verify permissions on the role management
    */
    modifier canWorkWithRole(bytes32 role) {
        bytes32 parentRole = PMStorage().getParentRole(role);
        require(PMStorage().verifyRole(msg.sender, parentRole), "Role management not allowed.");
        _;
    }

    /**
    * @notice Initialze permission module
    */ 
    constructor(address storageAddress) public {
        pmStorage = storageAddress;
    }

    /**
    * @notice Create a new role in the permission module
    * @param roleName Name of the new role
    * @param parent Name of the new role parent
    */
    function createRole(bytes32 roleName, bytes32 parent) 
        public 
        onlyOwner() 
    {
        require(roleName != 0x00, "Invalid role.");
        require(parent != 0x00, "Invalid parent role.");
        require(PMStorage().getRoleStatus(parent), "Parent role is not active.");
        require(PMStorage().getParentRole(roleName) == 0x00, "Role already exists.");
        
        PMStorage().setParentRole(roleName, parent);
        PMStorage().setRoleStatus(roleName, true);        
        PMStorage().addRoleToTheList(roleName);

        PMStorage().emitCreatedRole(roleName, parent);
    }

    /**
    * @notice Deactivate role and stops all role permissions
    * @param name Role name
    */
    function deactivateRole(bytes32 name) public onlyOwner() validRole(name) {
        require(PMStorage().getRoleStatus(name), "Role is not active.");
        
        PMStorage().setRoleStatus(name, false);  

        PMStorage().emitDeactivatedRole(name);
    }

    /**
    * @notice Activate role
    * @param name Role name
    */
    function activateRole(bytes32 name) public onlyOwner() validRole(name) {
        require(!PMStorage().getRoleStatus(name), "Role is active.");

        PMStorage().setRoleStatus(name, true);
        PMStorage().emitActivatedRole(name);
    }
    
    /**
    * @notice Add smart contract method to the role
    * @param methodId Method identifier
    * @param roleName Role name
    */
    function addMethodToTheRole(
        bytes4 methodId,
        bytes32 roleName
    ) 
        public 
        onlyOwner() 
        validRole(roleName) 
    {
        require(methodId != 0x00, "Invalid method id.");
        require(!PMStorage().getMethodStatus(roleName, methodId), "Method already added to the role.");

        PMStorage().setMethodStatus(roleName, methodId, true);
        uint length = PMStorage().getMethodsLength(roleName);
        PMStorage().setMethodIndex(roleName, methodId, length);
        PMStorage().addMethod(roleName, methodId);

        PMStorage().emitMethodAdded(methodId, roleName);
    }

    /**
    * @notice Remove smart contract method from the role
    * @param methodId Method identifier
    * @param roleName Role name
    */
    function removeMethodFromTheRole(
        bytes4 methodId,
        bytes32 roleName
    )
        public 
        onlyOwner() 
        validRole(roleName) 
    {
        require(methodId != 0x00, "Invalid method id.");
        require(PMStorage().getMethodStatus(roleName, methodId), "Method is not supported.");

        PMStorage().setMethodStatus(roleName, methodId, false);

        uint index = PMStorage().getMethodIndex(roleName, methodId);
        uint last = PMStorage().getMethodsLength(roleName).sub(1);

        if (last > 0) {
            bytes4 idToUpdate = PMStorage().getMethodByIndex(roleName, last);
            PMStorage().setMethodIndex(roleName, idToUpdate, index);
            PMStorage().addMethodToIndex(roleName, idToUpdate, index);
        }
        
        PMStorage().deleteMethodFromTheList(roleName, last);
        PMStorage().deleteMethodIndex(roleName, methodId);
        PMStorage().setMethodsListLength(roleName, last);

        PMStorage().emitMethodRemoved(methodId, roleName);
    }

    /**
    * @notice Returns list of all supported roles
    */
    function getListOfAllRoles() public view returns (bytes32[] memory) {
        return PMStorage().getListOfAllRoles();
    }

    /**
    * @notice Returns list of all supported methods by role
    */
    function getSupportedMethodsByRole(bytes32 roleName) public view returns (bytes4[] memory) {
        return PMStorage().getSupportedMethodsByRole(roleName);
    }

    /**
    * @notice Returns permission module storage instance
    */
    function PMStorage() internal view returns (IPMStorage) {
        return IPMStorage(pmStorage);
    }
}