pragma solidity ^0.4.24;

import "./BaseStorage.sol";
import "../interfaces/IPMRolesManagerStorage.sol";


/**
* @title Permission module roles manager storage
*/
contract PMRolesManagerStorage is BaseStorage {
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
    * @notice Write info to the log when new role was created
    * @param name Name of the new role
    * @param parent Name of the parent role
    */
    event CreatedRole(bytes32 name, bytes32 parent);

    /**
    * @notice Initialize storage with owner role
    */
    constructor() public {
        roles[ownerRole] = 0x00;
        roleStatus[ownerRole] = true;
        walletRoles[msg.sender][ownerRole] = true;
        listOfTheWalletRoles[msg.sender][0] = ownerRole;
        indexesOfTheWalletRoles[msg.sender][ownerRole] = 0;
        walletRolesIndex[msg.sender] = 1;
        listOfTheRoles.push(ownerRole);

        emit CreatedRole(ownerRole, 0x00);
    }

    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Permission Module.

    /**
    * @notice Write info to the log when role was deactivated
    * @param name Name of the role which was deactivated
    */
    function emitDeactivatedRole(bytes32 name) 
        public
        onlyPermissionModule(msg.sender) 
    {
        emit DeactivatedRole(name);
    }

    /**
    * @notice Write info to the log when role was activated
    * @param name Name of the role which was activated
    */
    function emitActivatedRole(bytes32 name) 
        public
        onlyPermissionModule(msg.sender) 
    {
        emit ActivatedRole(name);
    }

    /**
    * @notice Write info to the log when method was added to the role
    * @param methodId Method identifier
    * @param role Role
    */
    function emitMethodAdded(bytes4 methodId, bytes32 role) 
        public
        onlyPermissionModule(msg.sender) 
    {
        emit MethodAdded(methodId, role);
    }

    /**
    * @notice Write info to the log when method was added to the role
    * @param methodId Method identifier
    * @param role Role
    */
    function emitMethodRemoved(bytes4 methodId, bytes32 role) 
        public
        onlyPermissionModule(msg.sender) 
    {
        emit MethodRemoved(methodId, role);
    }

    /**
    * @notice Write info to the log when new role was created
    * @param name Name of the new role
    * @param parent Name of the parent role
    */
    function emitCreatedRole(bytes32 name, bytes32 parent) public {
        emit CreatedRole(name, parent);
    }

    /// Methods which updates the storage. Allowed only for the Permission Module.

    /**
    * @notice Add role the roles list
    * @param role Role which will be added
    */
    function addRoleToTheList(bytes32 role) 
        public
        onlyPermissionModule(msg.sender)
    {
        listOfTheRoles.push(role);
    }

    /**
    * @notice Update role by index
    * @param index Index
    * @param role Role which will be set on the index
    */
    function setRoleOnTheIndex(uint index, bytes32 role) 
        public
        onlyPermissionModule(msg.sender)
    {
        listOfTheRoles[index] = role;
    }

    /**
    * @notice Delete role by index
    * @param index Index of the role to delete
    */
    function deleteRoleFromList(uint index) 
        public
        onlyPermissionModule(msg.sender) 
    {
        delete listOfTheRoles[index];
    }

    /**
    * @notice Set parent role
    * @param role Role
    * @param parent Parent role
    */
    function setParentRole(bytes32 role, bytes32 parent) 
        public
        onlyPermissionModule(msg.sender)
    {
        roles[role] = parent;
    }

    /**
    * @notice Set role status
    * @param role Role
    * @param status Status of the role
    */
    function setRoleStatus(bytes32 role, bool status) 
        public
        onlyPermissionModule(msg.sender)
    {
        roleStatus[role] = status;    
    }

    // wallet dependent roles

    /**
    * @notice Update status of the wallet role
    * @param wallet Wallet address
    * @param role Role
    * @param status Status
    */
    function updateWalletRole(
        address wallet,
        bytes32 role,
        bool status
    )
        public
        onlyPermissionModule(msg.sender)
    {
        walletRoles[wallet][role] = status;
    }

    /**
    * @notice Add wallet role to the list of the roles
    * @param wallet Wallet address
    * @param role Role
    * @param index Index of the role in the list
    */
    function addWalletRoleToTheList(
        address wallet,
        bytes32 role,
        uint8 index
    )
        public
        onlyPermissionModule(msg.sender)
    {
        listOfTheWalletRoles[wallet][index] = role;
    }

    /**
    * @notice Set wallet role index
    * @param wallet Wallet address
    * @param role Role
    * @param index Index of the role in the list
    */
    function setWalletRoleIndex(
        address wallet,
        bytes32 role,
        uint8 index
    )
        public
        onlyPermissionModule(msg.sender)
    {
        indexesOfTheWalletRoles[wallet][role] = index;
    }

    /**
    * @notice Update wallet roles index
    * @param wallet Wallet address
    * @param index New index
    */
    function updateWalletRolesIndex(address wallet, uint8 index) 
        public
        onlyPermissionModule(msg.sender)
    {
        walletRolesIndex[wallet] = index;
    }

    // roles methods
    
    /**
    * @notice Set method index
    * @param role Role
    * @param sig Method id
    * @param index Index of the method
    */
    function setMetodIndex(
        bytes32 role,
        bytes4 sig,
        uint index
    )
        public
        onlyPermissionModule(msg.sender)
    {
        indexesOfTheRoleMethods[role][sig] = index;
    }

    /**
    * @notice Change method status
    * @param role Role
    * @param sig Method id
    * @param status Wallet role status (true - enabled | false - disabled)
    */
    function setMethodStatus(
        bytes32 role,
        bytes4 sig,
        bool status
    )
        public
        onlyPermissionModule(msg.sender)
    {
        roleMethods[role][sig] = status;
    }

    /**
    * @notice Add method to the list
    * @param role Role
    * @param sig Method id
    */
    function addMethod(bytes32 role, bytes4 sig) 
        public
        onlyPermissionModule(msg.sender)
    {
        listOfTheRoleMethods[role].push(sig);
    }

    /**
    * @notice Add method to the list
    * @param role Role
    * @param sig Method id
    * @param index Method index
    */
    function addMethodToIndex(bytes32 role, bytes4 sig, uint index) 
        public
        onlyPermissionModule(msg.sender)
    {
        listOfTheRoleMethods[role][index] = sig;
    }

    /**
    * @notice Add method to the list
    * @param role Role
    * @param sig Method id
    */
    function deleteMethodIndex(bytes32 role, bytes4 sig) 
        public
        onlyPermissionModule(msg.sender)
    {
        delete indexesOfTheRoleMethods[role][sig];
    }

    /**
    * @notice Remove method from the list
    * @param role Role
    * @param index Index in the list
    */
    function deleteMethodFromTheList(bytes32 role, uint index) 
        public
        onlyPermissionModule(msg.sender)
    {
        delete listOfTheRoleMethods[role][index];
    }

    /**
    * @notice Set methods list length
    * @param role Role
    * @param length Length to be set
    */
    function setMethodsListLength(bytes32 role, uint length) 
        public
        onlyPermissionModule(msg.sender)
    {
        listOfTheRoleMethods[role].length = length;
    }

    /// Getters. Public methods which are allowed for anyone.
    
    /**
    * @notice Return role by the index
    * @param index Index of the role
    */
    function getRoleByTheIndex(uint index) public view returns (bytes32) {
        return listOfTheRoles[index];
    }

    /**
    * @notice Get roles length
    */
    function getRolesLength() public view returns (uint) {
        return listOfTheRoles.length;
    }

    /**
    * @notice Returns list od the all roles
    */
    function getListOfAllRoles() public view returns (bytes32[]) {
        return listOfTheRoles;
    }

    /**
    * @notice Get parent role
    * @param role Role
    */
    function getParentRole(bytes32 role) public view returns (bytes32) {
        return roles[role];
    }

    /**
    * @notice Return role status
    * @param role Role
    */
    function getRoleStatus(bytes32 role) public view returns (bool) {
        return roleStatus[role];
    }

    /**
    * @notice Check if wallet has role
    * @param wallet Wallet address
    * @param role Role
    */
    function verifyRole(address wallet, bytes32 role) public view returns (bool) {
        return walletRoles[wallet][role];
    }

    /**
    * @notice Returns lenght of the methods list
    * @param role Role
    */
    function getMethodsLength(bytes32 role) public view returns (uint) {
        return listOfTheRoleMethods[role].length;
    }

    /**
    * @notice Returns method by index
    * @param role Role
    * @param index Index of the method
    */
    function getMethodByIndex(bytes32 role, uint index) public view returns (bytes4) {
        return listOfTheRoleMethods[role][index];
    }

    /**
    * @notice Supported methods by the role
    * @param role Role
    */
    function getSupportedMethodsByRole(bytes32 role) public view returns (bytes4[]) {
        return listOfTheRoleMethods[role];
    }

    /**
    * @notice Returns method status (true - enabled | false - disabled)
    * @param role Role
    * @param sig Method id
    */
    function getMethodStatus(bytes32 role, bytes4 sig) public view returns (bool) {
        return roleMethods[role][sig];
    }

    /**
    * @notice Returns method index
    * @param role Role
    * @param sig Method id
    */
    function getMethodIndex(bytes32 role, bytes4 sig) public view returns (uint) {
        return indexesOfTheRoleMethods[role][sig];
    }
}