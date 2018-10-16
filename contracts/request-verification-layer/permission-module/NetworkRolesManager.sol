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
        bool roleStatus = PMStorage().getWalletRoleStatus(wallet, roleName);
        require(!roleStatus, "Role already added.");

        uint8 index = PMStorage().getWalletRoleIndex(wallet);
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
        bool roleStatus = PMStorage().getWalletRoleStatus(wallet, roleName);
        require(roleStatus, "The wallet has no this role.");

        removeRole(wallet, roleName);
    }

    /**
    * @notice Transfer ownership
    * @param newOwner Address of the new owner
    */
    function transferOwnership(address newOwner) public onlyOwner() {
        require(newOwner != address(0), "Invalid new owner address.");
        
        uint8 index = PMStorage().getWalletRoleIndex(newOwner);
        require(index <= rolesLimit, "The limit for number of roles has been reached.");

        removeRole(msg.sender, ownerRole);
        addRole(newOwner, ownerRole);

        PMStorage().emitTransferedOwnership(msg.sender, newOwner);
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
        return PMStorage().checkPermission(methodId, sender);
    }

    /**
    * @notice Returns list of all roles of the wallet
    */
    function getWalletRoles(address wallet) public view returns (bytes32[20]) {
        return PMStorage().getWalletRoles(wallet);
    }

    /**
    * @notice Add a role to the wallet
    * @param wallet Wallet address
    * @param role Name of the role which will be added to the wallet
    */
    function addRole(address wallet, bytes32 role) internal {
        PMStorage().setWalletRoleStatus(wallet, role, true);

        uint8 index = PMStorage().getWalletRoleIndex(wallet);
        PMStorage().setWalletRoleToTheList(wallet, role, index);
        
        PMStorage().setWalletRoleIndex(wallet, role, index);
        PMStorage().setWalletRolesIndex(wallet, index.add(1));

        PMStorage().emitRoleAdded(wallet, role);
    }

    /**
    * @notice Remove role from the wallet
    * @param wallet Wallet address
    * @param role Name of the role which will be removed from the wallet
    */
    function removeRole(address wallet, bytes32 role) internal {
        PMStorage().setWalletRoleStatus(wallet,role,false);

        uint8 index = PMStorage().getWalletRoleIndexInTheList(wallet,role);
        uint8 last = PMStorage().getWalletRoleIndex(wallet).sub(1);
        
        if(last != 0) {
            bytes32 roleToUpdate = PMStorage().getWalletRoleFromTheList(wallet,last);

            PMStorage().setWalletRoleIndex(wallet,roleToUpdate,index);
            PMStorage().setWalletRoleToTheList(wallet,roleToUpdate,index);
        }

        PMStorage().deleteWalletRoleIndex(wallet,role);
        PMStorage().deleteWalletRole(wallet,last);
        PMStorage().setWalletRolesIndex(wallet,last);

        PMStorage().emitRoleDeleted(wallet,role);
    }
}