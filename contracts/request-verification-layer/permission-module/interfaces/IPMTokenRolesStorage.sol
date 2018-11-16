pragma solidity ^0.5.0;


/**
* @notice Permission module token roles storage
*/
contract IPMTokenRolesStorage {
    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Permission Module.

    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    function emitTokenDependetRoleAdded(address wallet, address token, bytes32 role) public;

    /**
    * @notice Write info to the log when the role was deleted
    */
    function emitTokenDependetRoleDeleted(address wallet, address token, bytes32 role) public;

    /// Methods which updates the storage. Allowed only for the Permission Module.

    /**
    * @notice Update token dependent role status
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    * @param status Status
    */
    function setTokenDependentRoleStatus(
        address wallet,
        address token,
        bytes32 role,
        bool status
    ) 
        public;

    /**
    * @notice Add token dependent role to the list
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    * @param index Index
    */
    function setToTheTokenDependentList(
        address wallet,
        address token,
        bytes32 role,
        uint index
    ) 
        public;

    /**
    * @notice Set index of the token dependent role
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    * @param index Index
    */
    function setTokenDependentRoleIndex(
        address wallet,
        address token,
        bytes32 role,
        uint8 index
    ) 
        public;

    /**
    * @notice Set token dependent roles index
    * @param wallet Wallet address
    * @param token Address of the token
    * @param index Index
    */
    function setTokenDependentRolesIndex(
        address wallet,
        address token,
        uint8 index
    ) 
        public;

    /**
    * @notice Delete index of the token dependent role
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    */
    function delTokenDependentRoleIndex(
        address wallet,
        address token,
        bytes32 role
    )
        public;

    /**
    * @notice Delete token dependent role from the list of the roles
    * @param wallet Wallet address
    * @param token Address of the token
    * @param index Index
    */
    function delTokenDependentRole(
        address wallet,
        address token,
        uint8 index
    ) 
        public;
    
    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns token dependent roles index
    * @param wallet Wallet address
    * @param token Address of the token
    */
    function getTokenDependentRolesIndex(
        address wallet,
        address token
    ) 
        public
        view
        returns (uint8);

    /**
    * @notice Returns index of the token dependent role 
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    */
    function getIndexOfTheTokeDependentRole(
        address wallet,
        address token,
        bytes32 role
    ) 
        public
        view
        returns (uint8);

    /**
    * @notice Get token dependent role by index
    * @param wallet Wallet address
    * @param token Address of the token
    * @param index Index
    */
    function getTokenDependentRoleByIndex(
        address wallet,
        address token,
        uint8 index
    ) 
        public 
        view 
        returns (bytes32);

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    */
    function checkTokenPermission(
        bytes4 methodId,
        address sender,
        address token
    ) 
        public
        view
        returns (bool);

    /**
    * @notice Returns list of all roles of the wallet
    */
    function getWalletRolesForToken(
        address wallet,
        address token
    ) 
        public
        view
        returns (bytes32[20] memory);

    /**
    * @notice Returns token dependent role status
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    */
    function getTokenDependentRoleStatus(
        address wallet,
        address token,
        bytes32 role
    ) 
        public
        view
        returns (bool);
}