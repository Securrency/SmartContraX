pragma solidity 0.4.24;

import "./interfaces/IRolesManager.sol";
import "./PermissionModuleStorage.sol";

/**
* @title Roles Manager
*/
contract RolesManager is PermissionModuleStorage, IRolesManager {
    // Predefined name of the owner role
    bytes32 ownerRole = bytes32("Owner");

    // Roles limit for the wallet
    uint8 constant rolesLimit = 20;

    /**
    * @notice Write info to the log when new role was created
    * @param name Name of the new role
    * @param parent Name of the parent role
    */
    event CreatedRole(bytes32 name, bytes32 parent);

    /**
    * @notice Write info to the log when role was deactivated
    * @param name Name of the role which was deactivated
    */
    event DeactivatedRole(bytes32 name);

    /**
    * @notice Write info to the log when role was activated
    * @param name Name of the role which was activated
    */
    event ActivatedRole(bytes32 name);

    /**
    * @notice Write info to the log when method was added to the role
    * @param methodId Method identifier
    * @param role Role
    */
    event MethodAdded(bytes4 methodId, bytes32 role);

    /**
    * @notice Write info to the log when method was added to the role
    * @param methodId Method identifier
    * @param role Role
    */
    event MethodRemoved(bytes4 methodId, bytes32 role);

    /**
    * @notice Verify sender
    */
    modifier onlyOwner() {
        require(walletRoles[msg.sender][ownerRole], "Allowed only for the owner.");
        _;
    }

    /**
    * @notice Verify role
    */
    modifier validRole(bytes32 role) {
        require((role != 0x00 && roles[role] != 0x00) || role == ownerRole, "Invalid role.");
        _;
    }

    /**
    * @notice Verify permissions on the role management
    */
    modifier canWorkWithRole(bytes32 role) {
        bytes32 parentRole = roles[role];
        require(walletRoles[msg.sender][parentRole], "Role management not allowed.");
        _;
    }

    /**
    * @notice Initialze permission module
    */ 
    constructor() public {
        roles[ownerRole] = 0x00;
        roleStatus[ownerRole] = true;
        walletRoles[msg.sender][ownerRole] = true;
        listOfTheWalletRoles[msg.sender][0] = ownerRole;
        indexesOfTheWalletRoles[msg.sender][ownerRole] = 0;
        walletRolesIndex[msg.sender] = 1;
        listOfTheRoles.push(ownerRole);
    }

    /**
    * @notice Create a new role in the permission module
    * @param roleName Name of the new role
    * @param parent Name of the new role parent
    */
    function createRole(bytes32 roleName, bytes32 parent) public onlyOwner() {
        require(roleName != 0x00, "Invalid role.");
        require(parent != 0x00, "Invalid parent role.");
        require(roleStatus[parent], "Parent role is not active.");
        require(roles[roleName] == 0x00, "Role already exists.");
        
        roles[roleName] = parent;
        roleStatus[roleName] = true;
        listOfTheRoles.push(roleName);

        emit CreatedRole(roleName, parent);
    }

    /**
    * @notice Deactivate role and stops all role permissions
    * @param name Role name
    */
    function deactivateRole(bytes32 name) public onlyOwner() validRole(name) {
        require(roleStatus[name], "Role is not active.");
        
        roleStatus[name] = false;

        emit DeactivatedRole(name);
    }

    /**
    * @notice Activate role
    * @param name Role name
    */
    function activateRole(bytes32 name) public onlyOwner() validRole(name) {
        require(!roleStatus[name], "Role is active.");

        roleStatus[name] = true;

        emit ActivatedRole(name);
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
        require(!roleMethods[roleName][methodId], "Method already added to the role.");

        roleMethods[roleName][methodId] = true;
        indexesOfTheRoleMethods[roleName][methodId] = listOfTheRoleMethods[roleName].length;
        listOfTheRoleMethods[roleName].push(methodId);

        emit MethodAdded(methodId, roleName);
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
        require(roleMethods[roleName][methodId], "Method is not supported.");

        roleMethods[roleName][methodId] = false;

        uint index = indexesOfTheRoleMethods[roleName][methodId];
        uint last = listOfTheRoleMethods[roleName].length - 1;
        
        indexesOfTheRoleMethods[roleName][listOfTheRoleMethods[roleName][last]] = index;
        listOfTheRoleMethods[roleName][index] = listOfTheRoleMethods[roleName][last];

        delete listOfTheRoleMethods[roleName][last];
        delete indexesOfTheRoleMethods[roleName][methodId];
        listOfTheRoleMethods[roleName].length--;

        emit MethodRemoved(methodId, roleName);
    }

    /**
    * @notice Returns list of all supported roles
    */
    function getListOfAllRoles() public view returns (bytes32[]) {
        return listOfTheRoles;
    }

    /**
    * @notice Returns list of all supported methods by role
    */
    function getSupportedMethodsByRole(bytes32 roleName) public view returns (bytes4[]) {
        return listOfTheRoleMethods[roleName];
    }
}