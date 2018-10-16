pragma solidity ^0.4.24;


/**
* @title Roles manager eternal storage interface
*/
contract IPMRolesManagerStorage {
    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Permission Module.

    /**
    * @notice Write info to the log when new role was created
    * @param name Name of the new role
    * @param parent Name of the parent role
    */
    function emitCreatedRole(bytes32 name, bytes32 parent) public;

    /**
    * @notice Write info to the log when role was deactivated
    * @param name Name of the role which was deactivated
    */
    function emitDeactivatedRole(bytes32 name) public;

    /**
    * @notice Write info to the log when role was activated
    * @param name Name of the role which was activated
    */
    function emitActivatedRole(bytes32 name) public;

    /**
    * @notice Write info to the log when method was added to the role
    * @param methodId Method identifier
    * @param role Role
    */
    function emitMethodAdded(bytes4 methodId, bytes32 role) public;

    /**
    * @notice Write info to the log when method was added to the role
    * @param methodId Method identifier
    * @param role Role
    */
    function emitMethodRemoved(bytes4 methodId, bytes32 role) public;

    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    function emitTokenDependetRoleAdded(
        address wallet,
        address token, 
        bytes32 role
    )
        public;

    /**
    * @notice Write info to the log when the role was deleted
    */
    function emitTokenDependetRoleDeleted(
        address wallet, 
        address token, 
        bytes32 role
    ) 
        public;

    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    function emitRoleAdded(address wallet, bytes32 role) public;

    /**
    * @notice Write info to the log when the role was deleted
    */
    function emitRoleDeleted(address wallet, bytes32 role) public;

    /**
    * @notice Write info to the log about ownership transfer
    */
    function emitTransferedOwnership(address oldOwner, address newOwner) public;

    /// Methods which updates the storage. Allowed only for the Permission Module.

    /**
    * @notice Add role the roles list
    * @param role Role which will be added
    */
    function addRoleToTheList(bytes32 role) public;

    /**
    * @notice Update role by index
    * @param index Index
    * @param role Role which will be set on the index
    */
    function setRoleOnTheIndex(uint index, bytes32 role) public;

    /**
    * @notice Delete role by index
    * @param index Index of the role to delete
    */
    function deleteRoleFromList(uint index) public;

    /**
    * @notice Set parent role
    * @param role Role
    * @param parent Parent role
    */
    function setParentRole(bytes32 role, bytes32 parent) public;

    /**
    * @notice Set role status
    * @param role Role
    * @param status Status of the role
    */
    function setRoleStatus(bytes32 role, bool status) public;

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
        public;

    /**
    * @notice Add wallet role to the list of the roles
    * @param wallet Wallet address
    * @param role Role
    * @param index Index of the role in the list
    */
    function addWalletRoleToTheList(
        address wallet,
        bytes32 role,
        uint index
    )
        public;

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
        public;

    /**
    * @notice Update wallet roles index
    * @param wallet Wallet address
    * @param index New index
    */
    function updateWalletRolesIndex(address wallet, uint index) public;

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
        public;

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
        public;

    /**
    * @notice Add method to the list
    * @param role Role
    * @param sig Method id
    */
    function addMethod(bytes32 role, bytes4 sig) public;

    /**
    * @notice Add method to the list
    * @param role Role
    * @param sig Method id
    * @param index Method index
    */
    function addMethodToIndex(bytes32 role, bytes4 sig, uint index) public;

    /**
    * @notice Add method to the list
    * @param role Role
    * @param sig Method id
    */
    function deleteMethodIndex(bytes32 role, bytes4 sig) public;

    /**
    * @notice Remove method from the list
    * @param role Role
    * @param index Index in the list
    */
    function deleteMethodFromTheList(bytes32 role, uint index) public;

    /**
    * @notice Set methods list length
    * @param role Role    
    * @param length Length to be set
    */
    function setMethodsListLength(bytes32 role, uint length) public;

    /// Getters. Public methods which are allowed for anyone.
    
    /**
    * @notice Return role by the index
    * @param index Index of the role
    */
    function getRoleByTheIndex(uint index) public view returns (bytes32);

    /**
    * @notice Get parent role
    * @param role Role
    */
    function getParentRole(bytes32 role) public view returns (bytes32);

    /**
    * @notice Return role status
    * @param role Role
    */
    function getRoleStatus(bytes32 role) public view returns (bool);

    /**
    * @notice Check if wallet has role
    * @param wallet Wallet address
    * @param role Role
    */
    function verifyRole(address wallet, bytes32 role) public view returns (bool);

    /**
    * @notice Returns lenght of the methods list
    * @param role Role
    */
    function getMethodsLength(bytes32 role) public view returns (uint);

    /**
    * @notice Supported methods by the role
    * @param role Role
    */
    function getSupportedMethodsByRole(bytes32 role) public view returns (bytes4[]);

    /**
    * @notice Returns list od the all roles
    */
    function getListOfAllRoles() public view returns (bytes32[]);

    /**
    * @notice Returns method by index
    * @param role Role
    * @param index Index of the method
    */
    function getMethodByIndex(bytes32 role, uint index) public view returns (bytes4);

    /**
    * @notice Returns method status (true - enabled | false - disabled)
    * @param role Role
    * @param sig Method id
    */
    function getMethodStatus(bytes32 role, bytes4 sig) public view returns (bool);

    /**
    * @notice Returns method index
    * @param role Role
    * @param sig Method id
    */
    function getMethodIndex(bytes32 role, bytes4 sig) public view returns (uint);
    
    /**
    * @notice Get roles length
    */
    function getRolesLength() public view returns (uint);
}