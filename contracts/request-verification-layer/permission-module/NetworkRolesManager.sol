pragma solidity ^0.4.24;

import "./interfaces/INetworkRolesManager.sol";
import "./RolesManager.sol";
import "../../common/libraries/SafeMath8.sol";

/**
* @title Network roles manager
*/
contract NetworkRolesManager is RolesManager, INetworkRolesManager {
    // define libraries
    using SafeMath8 for uint8;

    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    event RoleAdded(address indexed wallet, bytes32 role);

    /**
    * @notice Write info to the log when the role was deleted
    */
    event RoleDeleted(address indexed wallet, bytes32 role);

    /**
    * @notice Write info to the log about ownership transfer
    */
    event TransferedOwnership(address oldOwner, address newOwner);

    /**
    * @notice Add a role to the wallet
    * @param wallet Wallet address
    * @param roleName Name of the role which will be added to the wallet
    */
    function addRoleToTheWallet(
        address wallet,
        bytes32 roleName
    ) 
        public
        validRole(roleName)
        canWorkWithRole(roleName)
    {
        require(!walletRoles[wallet][roleName], "Role already added.");

        uint8 index = walletRolesIndex[wallet];
        require(index <= rolesLimit, "The limit for number of roles has been reached.");
    
        addRole(wallet, roleName);
    }

    /**
    * @notice Remove role from the wallet
    * @param wallet Wallet address
    * @param roleName Name of the role which will be removed from the wallet
    */
    function removeRoleFromTheWallet(
        address wallet,
        bytes32 roleName
    )
        public
        validRole(roleName)
        canWorkWithRole(roleName)
    {
        require(walletRoles[wallet][roleName], "The wallet has no this role.");

        removeRole(wallet, roleName);
    }

    /**
    * @notice Transfer ownership
    * @param newOwner Address of the new owner
    */
    function transferOwnership(address newOwner) public onlyOwner() {
        require(newOwner != address(0), "Invalid new owner address.");
        require(walletRolesIndex[newOwner] <= rolesLimit, "The limit for number of roles has been reached.");

        removeRole(msg.sender, ownerRole);
        addRole(newOwner, ownerRole);

        emit TransferedOwnership(msg.sender, newOwner);
    }

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    */
    function allowedForWallet(
        bytes4 methodId,
        address sender
    ) 
        public
        view
        returns (bool) 
    {
        uint8 index = walletRolesIndex[sender];
        bytes32 role;
        for (uint8 i = 0; i < index; i++) {
            role = listOfTheWalletRoles[sender][i];
            if (roleMethods[role][methodId] && roleStatus[role]) {
                return true;
            }
        }

        return false;
    }

    /**
    * @notice Returns list of all roles of the wallet
    */
    function getWalletRoles(address wallet) public view returns (bytes32[20]) {
        return listOfTheWalletRoles[wallet];
    }

    /**
    * @notice Add a role to the wallet
    * @param wallet Wallet address
    * @param role Name of the role which will be added to the wallet
    */
    function addRole(address wallet, bytes32 role) internal {
        walletRoles[wallet][role] = true;

        uint8 index = walletRolesIndex[wallet];
        listOfTheWalletRoles[wallet][index] = role;

        indexesOfTheWalletRoles[wallet][role] = index;
        walletRolesIndex[wallet]++;

        emit RoleAdded(wallet, role);
    }

    /**
    * @notice Remove role from the wallet
    * @param wallet Wallet address
    * @param role Name of the role which will be removed from the wallet
    */
    function removeRole(address wallet, bytes32 role) internal {
        walletRoles[wallet][role] = false;

        uint8 index = indexesOfTheWalletRoles[wallet][role];
        uint8 last = walletRolesIndex[wallet].sub(1);

        if(last != 0) {
            indexesOfTheWalletRoles[wallet][listOfTheWalletRoles[wallet][last]] = index;
            listOfTheWalletRoles[wallet][index] = listOfTheWalletRoles[wallet][last];
        }
        
        delete indexesOfTheWalletRoles[wallet][role];
        delete listOfTheWalletRoles[wallet][last];
        walletRolesIndex[wallet] = last;

        emit RoleDeleted(wallet, role);
    }
}