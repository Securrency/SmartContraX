pragma solidity ^0.5.0;

import "../interfaces/IPMTokenRolesStorage.sol";
import "./BaseStorage.sol";


/**
* @title Permission module token roles storage
*/
contract PMTokenRolesStorage is IPMTokenRolesStorage, BaseStorage {
    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    event TokenDependentRoleAdded(address indexed wallet, address indexed token, bytes32 role);

    /**
    * @notice Write info to the log when the role was deleted
    */
    event TokenDependentRoleDeleted(address indexed wallet, address indexed token, bytes32 role);

    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Permission Module.

    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    function emitTokenDependentRoleAdded(
        address wallet,
        address token, 
        bytes32 role
    )
        public
        onlyPermissionModule(msg.sender)
    {
        emit TokenDependentRoleAdded(
            wallet,
            token, 
            role
        );
    }

    /**
    * @notice Write info to the log when the role was deleted
    */
    function emitTokenDependentRoleDeleted(
        address wallet, 
        address token, 
        bytes32 role
    ) 
        public
        onlyPermissionModule(msg.sender)
    {
        emit TokenDependentRoleDeleted(
            wallet, 
            token, 
            role
        );
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        tokenDependentRoles[wallet][token][role] = status;
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        listOfTheTokenDependentRoles[wallet][token][index] = role;
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        indexesOfTheTokenDependentRoles[wallet][token][role] = index;
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        tokenDependentRolesIndex[wallet][token] = index;
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        delete indexesOfTheTokenDependentRoles[wallet][token][role];
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        delete listOfTheTokenDependentRoles[wallet][token][index];
    }

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
        returns (uint8)
    {
        return tokenDependentRolesIndex[wallet][token];
    }

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
        returns (uint8)
    {
        return indexesOfTheTokenDependentRoles[wallet][token][role];
    }

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
        returns (bytes32)
    {
        return listOfTheTokenDependentRoles[wallet][token][index];
    }

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
        returns (bool)
    {
        return tokenDependentRoles[wallet][token][role];
    }

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
        returns (bool)
    {
        uint8 index =  tokenDependentRolesIndex[sender][token];
        bytes32 role;
        for (uint8 i = 0; i < index; i++) {
            role = listOfTheTokenDependentRoles[sender][token][i];
            if (roleMethods[role][methodId] && roleStatus[role]) {
                return true;
            }
        }

        return false;
    }

    /**
    * @notice Returns list of all roles of the wallet
    */
    function getWalletRolesForToken(
        address wallet,
        address token
    ) 
        public
        view
        returns (bytes32[20] memory)
    {
        return listOfTheTokenDependentRoles[wallet][token];
    }
}