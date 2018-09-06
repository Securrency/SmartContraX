pragma solidity 0.4.24;

import "./interfaces/ITokenRolesManager.sol";
import "./RolesManager.sol";

/**
* @title Token roles manager
*/
contract TokenRolesManager is RolesManager, ITokenRolesManager {
    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    event TokenDependetRoleAdded(address indexed wallet, address indexed token, bytes32 role);

    /**
    * @notice Write info to the log when the role was deleted
    */
    event TokenDependetRoleDeleted(address indexed wallet, address indexed token, bytes32 role);

    /**
    * @notice Add role for a specific token
    * @param wallet Wallet address
    * @param token Token address
    * @param roleName Name of the role which will be added to the wallet
    */
    function addRoleForSpecificToken(
        address wallet,
        address token,
        bytes32 roleName
    ) 
        public
        validRole(roleName)
        canWorkWithRole(roleName)
    {
        require(token != address(0), "Invalid token address.");
        require(!tokenDependentRoles[wallet][token][roleName], "Role already added.");

        uint8 index = tokenDependentRolesIndex[wallet][token];
        require(index <= rolesLimit, "The limit for number of roles has been reached.");

        tokenDependentRoles[wallet][token][roleName] = true;

        listOfTheTokenDependentRoles[wallet][token][index] = roleName;

        indexesOfTheTokenDependentRoles[wallet][token][roleName] = index;
        tokenDependentRolesIndex[wallet][token]++;

        emit TokenDependetRoleAdded(wallet, token, roleName);
    }

    /**
    * @notice Remove role from a specific token
    * @param wallet Wallet address
    * @param token Token address
    * @param roleName Name of the role which will be removed from the wallet
    */
    function removeRoleFromSpecificToken(
        address wallet,
        address token,
        bytes32 roleName
    ) 
        public
        validRole(roleName)
        canWorkWithRole(roleName)
    {
        require(token != address(0), "Invalid token address.");
        require(tokenDependentRoles[wallet][token][roleName], "The wallet has no this role.");

        tokenDependentRoles[wallet][token][roleName] = false;

        uint8 index = indexesOfTheTokenDependentRoles[wallet][token][roleName];
        uint8 last =  tokenDependentRolesIndex[wallet][token] - 1;

        if (last != 0) {
            indexesOfTheTokenDependentRoles[wallet][token][listOfTheTokenDependentRoles[wallet][token][last]] = index;
            listOfTheTokenDependentRoles[wallet][token][index] = listOfTheTokenDependentRoles[wallet][token][last];
        }

        delete indexesOfTheTokenDependentRoles[wallet][token][roleName];
        delete listOfTheTokenDependentRoles[wallet][token][last];
        tokenDependentRolesIndex[wallet][token]--;

        emit TokenDependetRoleDeleted(wallet, token, roleName);
    }

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    */
    function allowedForToken(
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
        returns (bytes32[20])
    {
        return listOfTheTokenDependentRoles[wallet][token];
    }
}