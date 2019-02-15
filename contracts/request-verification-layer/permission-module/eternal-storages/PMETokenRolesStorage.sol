pragma solidity ^0.5.0;

import "../interfaces/IPMETokenRolesStorage.sol";
import "../interfaces/IPMRolesManagerStorage.sol";
import "../../../common/libraries/SafeMath8.sol";
import "../../../registry-layer/components-registry/getters/PermissionModuleAddress.sol";

/**
* @title Permission module extended token roles storage
*/
contract PMETokenRolesStorage is IPMETokenRolesStorage, PermissionModuleAddress {
    // define libraries
    using SafeMath8 for uint8;

    // Permission module extended token roles storage
    IPMRolesManagerStorage rms;

    // extended token dependet roles
    // Declare storage for the token dependent roles
    mapping(address => mapping(address => mapping(bytes32 => mapping(bytes32 => bool)))) internal tokenDependentRoles;

    // Declare storage for the token dependent roles indexes
    mapping(address => mapping(address => mapping(bytes32 => mapping(bytes32 => uint8)))) internal indexesOfTheTokenDependentRoles;

    // Declare storage for the token dependent roles
    mapping(address => mapping(address => mapping(bytes32 => bytes32[20]))) internal listOfTheTokenDependentRoles;

    // Declare storage for the last index of the token dependent roles
    mapping(address => mapping(address => mapping(bytes32 => uint8))) internal tokenDependentRolesIndex;

    /**
    * @notice Verify sender address
    */
    modifier onlyPermissionModule(address sender) {
        address permissionModule = getPermissionModuleAddress();
        require(sender == permissionModule, "Allowed only for the permission module.");
        _;
    }

    // Set components registry address
    constructor(address componentsRegistry, address mainStorage)
        public
        WithComponentsRegistry(componentsRegistry) 
    {
        rms = IPMRolesManagerStorage(mainStorage);
    }

    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    event TokenDependentRoleAdded(
        address indexed wallet,
        address indexed token,
        bytes32 role,
        bytes32 subId
    );

    /**
    * @notice Write info to the log when the role was deleted
    */
    event TokenDependentRoleDeleted(
        address indexed wallet,
        address indexed token,
        bytes32 role,
        bytes32 subId
    );

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
        public
        onlyPermissionModule(msg.sender)
    {
        emit TokenDependentRoleAdded(
            wallet,
            token, 
            role,
            subId
        );
    }

    /**
    * @notice Write info to the log when the role was deleted
    */
    function emitTokenDependentRoleDeletedWithSubId(
        address wallet, 
        address token, 
        bytes32 role,
        bytes32 subId
    ) 
        public
        onlyPermissionModule(msg.sender)
    {
        emit TokenDependentRoleDeleted(
            wallet, 
            token, 
            role,
            subId
        );
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        tokenDependentRoles[wallet][token][subId][role] = status;
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        listOfTheTokenDependentRoles[wallet][token][subId][index] = role;
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        indexesOfTheTokenDependentRoles[wallet][token][subId][role] = index;
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        tokenDependentRolesIndex[wallet][token][subId] = index;
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        delete indexesOfTheTokenDependentRoles[wallet][token][subId][role];
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        delete listOfTheTokenDependentRoles[wallet][token][subId][index];
    }

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
        public
        onlyPermissionModule(msg.sender)
    {
        setTokenDependentRoleStatusWithSubId(
            wallet,
            token,
            roleName,
            false,
            subId
        );

        uint8 index = getIndexOfTheTokeDependentRoleWithSubId(
            wallet,
            token,
            roleName,
            subId
        );
        uint8 last = getTokenDependentRolesIndexWithSubId(wallet,token,subId).sub(1);

        if (last > 0) {
            bytes32 roleToUpdate = getTokenDependentRoleByIndexWithSubId(wallet, token, last, subId);
            setTokenDependentRoleIndexWithSubId(wallet,token,roleToUpdate,index,subId);
            setToTheTokenDependentListWithSubId(wallet,token,roleToUpdate,index,subId);
        }

        delTokenDependentRoleIndexWithSubId(wallet,token,roleName,subId);
        delTokenDependentRoleWithSubId(wallet,token,last,subId);
        setTokenDependentRolesIndexWithSubId(wallet,token,last,subId);
        emitTokenDependentRoleDeletedWithSubId(wallet, token, roleName, subId);
    }

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
        returns (uint8)
    {
        return tokenDependentRolesIndex[wallet][token][subId];
    }

    /**
    * @notice Returns the index of the token dependent role
    * @param wallet Wallet address
    * @param token Address of the token
    * @param role Role name
    * @param subId Additional role identifier
    */
    function getIndexOfTheTokeDependentRoleWithSubId(
        address wallet,
        address token,
        bytes32 role,
        bytes32 subId
    ) 
        public
        view
        returns (uint8)
    {
        return indexesOfTheTokenDependentRoles[wallet][token][subId][role];
    }

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
        returns (bytes32)
    {
        return listOfTheTokenDependentRoles[wallet][token][subId][index];
    }

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
        returns (bool)
    {
        return tokenDependentRoles[wallet][token][subId][role];
    }

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
        returns (bool)
    {
        uint8 index =  tokenDependentRolesIndex[sender][token][subId];
        bytes32 role;
        for (uint8 i = 0; i < index; i++) {
            role = listOfTheTokenDependentRoles[sender][token][subId][i];
            if (rms.getMethodStatus(role, methodId) && rms.getRoleStatus(role)) {
                return true;
            }
        }

        return false;
    }

    /**
    * @notice Returns list of all roles of the wallet
    */
    function getWalletRolesForTokenWithSubId(
        address wallet,
        address token,
        bytes32 subId
    ) 
        public
        view
        returns (bytes32[20] memory)
    {
        return listOfTheTokenDependentRoles[wallet][token][subId];
    }
}