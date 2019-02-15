pragma solidity >0.4.99 <0.6.0;


/**
* @notice Permission module extended token roles storage
*/
contract IPMETokenRolesStorage {
    /// Events emitters. Write info about any state changes to the log.
    /// Allowed only for the Permission Module.

    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    function emitTokenDependentRoleAddedWithSubId(
        address wallet, 
        address token,
        bytes32 role,
        bytes32 subId
    ) 
        public;

    /**
    * @notice Write info to the log when the role was deleted
    */
    function emitTokenDependentRoleDeletedWithSubId(
        address wallet,
        address token,
        bytes32 role,
        bytes32 subId
    ) 
        public;

    /// Methods which updates the storage. Allowed only for the Permission Module.

    /**
    * @notice Update token dependent role status
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    * @param status Status
    * @param subId Additional role identifier
    */
    function setTokenDependentRoleStatusWithSubId(
        address wallet,
        address token,
        bytes32 role,
        bool status,
        bytes32 subId
    ) 
        public;

    /**
    * @notice Add a token dependent role to the list
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    * @param index Index
    * @param subId Additional role identifier
    */
    function setToTheTokenDependentListWithSubId(
        address wallet,
        address token,
        bytes32 role,
        uint index,
        bytes32 subId
    ) 
        public;

    /**
    * @notice Set index of the token dependent role
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    * @param index Index
    * @param subId Additional role identifier
    */
    function setTokenDependentRoleIndexWithSubId(
        address wallet,
        address token,
        bytes32 role,
        uint8 index,
        bytes32 subId
    ) 
        public;

    /**
    * @notice Set token dependent roles index
    * @param wallet Wallet address
    * @param token Address of the token
    * @param index Index
    * @param subId Additional role identifier
    */
    function setTokenDependentRolesIndexWithSubId(
        address wallet,
        address token,
        uint8 index,
        bytes32 subId
    ) 
        public;

    /**
    * @notice Delete index of the token dependent role
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    * @param subId Additional role identifier
    */
    function delTokenDependentRoleIndexWithSubId(
        address wallet,
        address token,
        bytes32 role,
        bytes32 subId
    )
        public;

    /**
    * @notice Delete token dependent role from the list of the roles
    * @param wallet Wallet address
    * @param token Address of the token
    * @param index Index
    * @param subId Additional role identifier
    */
    function delTokenDependentRoleWithSubId(
        address wallet,
        address token,
        uint8 index,
        bytes32 subId
    ) 
        public;

    /**
    * @notice Remove a role from a specific token
    * @param wallet Wallet address
    * @param token Token address
    * @param roleName Name of the role which will be removed from the wallet
    * @param subId Additional role identifier
    */
    function removeRoleFromSpecificTokenWithSubId(
        address wallet,
        address token,
        bytes32 roleName,
        bytes32 subId
    ) 
        public;
    
    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns token dependent roles index
    * @param wallet Wallet address
    * @param token Address of the token
    * @param subId Additional role identifier
    */
    function getTokenDependentRolesIndexWithSubId(
        address wallet,
        address token,
        bytes32 subId
    ) 
        public
        view
        returns (uint8);

    /**
    * @notice Returns the index of the token dependent role 
    * @param wallet Wallet address
    * @param token Address of the token
    * @param subId Additional role identifier
    * @param role Role name
    */
    function getIndexOfTheTokeDependentRoleWithSubId(
        address wallet,
        address token,
        bytes32 role,
        bytes32 subId
    ) 
        public
        view
        returns (uint8);

    /**
    * @notice Get token dependent role by index
    * @param wallet Wallet address
    * @param token Address of the token
    * @param index Index
    * @param subId Additional role identifier
    */
    function getTokenDependentRoleByIndexWithSubId(
        address wallet,
        address token,
        uint8 index,
        bytes32 subId
    ) 
        public 
        view 
        returns (bytes32);

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    * @param subId Additional role identifier
    */
    function checkTokenPermissionWithSubId(
        bytes4 methodId,
        address sender,
        address token,
        bytes32 subId
    ) 
        public
        view
        returns (bool);

    /**
    * @notice Returns a list of all roles of the wallet
    * @param subId Additional role identifier
    */
    function getWalletRolesForTokenWithSubId(
        address wallet,
        address token,
        bytes32 subId
    ) 
        public
        view
        returns (bytes32[20] memory);

    /**
    * @notice Returns token dependent role status
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    * @param subId Additional role identifier
    */
    function getTokenDependentRoleStatusWithSubId(
        address wallet,
        address token,
        bytes32 role,
        bytes32 subId
    ) 
        public
        view
        returns (bool);
}