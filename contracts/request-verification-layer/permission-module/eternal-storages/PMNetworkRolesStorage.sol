pragma solidity ^0.4.24;

import "./BaseStorage.sol";
import "../interfaces/IPMNetworkRolesStorage.sol";


/**
* @title Permission module network roles storage
*/
contract PMNetworkRolesStorage is IPMNetworkRolesStorage, BaseStorage {
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
    * @notice Write info to the log about new ownership transfer request
    */
    event OwnershipTransferRequest(address newOwner);
    
    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Permission Module.

    /**
    * @notice Write info to the log when the new role was added to the wallet
    */
    function emitRoleAdded(address wallet, bytes32 role) 
        public
        onlyPermissionModule(msg.sender) 
    {
        emit RoleAdded(wallet, role);
    }

    /**
    * @notice Write info to the log when the role was deleted
    */
    function emitRoleDeleted(address wallet, bytes32 role) 
        public
        onlyPermissionModule(msg.sender) 
    {
        emit RoleDeleted(wallet, role);
    }

    /**
    * @notice Write info to the log about ownership transfer
    */
    function emitTransferedOwnership(address oldOwner, address newOwner) 
        public
        onlyPermissionModule(msg.sender) 
    {
        emit TransferedOwnership(oldOwner, newOwner);
    }

    /**
    * @notice Emit event OwnershipTransferRequest
    */
    function emitOwnershipTransferRequest(address newOwner) 
        public
        onlyPermissionModule(msg.sender)
    {
        emit OwnershipTransferRequest(newOwner);
    }


    /// Methods which updates the storage. Allowed only for the Permission Module.

    /**
    * @notice Create request on the ownership transferring
    * @param newOwner Address of the new owner
    */
    function createRequestOnOwnershipTransfer(address newOwner) 
        public
        onlyPermissionModule(msg.sender)
    {
        futureOwner = newOwner;
    }

    /**
    * @notice Delete request on the ownership transferring
    */
    function deleteRequestOnOwnershipTransfer() 
        public
        onlyPermissionModule(msg.sender)
    {
        futureOwner = address(0);
    }

    /**
    * @notice Set an address which wants transfer ownership
    * @param owner An address which wants transfer ownership
    */
    function setOldOwner(address owner) 
        public
        onlyPermissionModule(msg.sender)
    {
        oldOwner = owner;
    }

    /**
    * @notice Set an address which wants transfer ownership
    */
    function deleteOldOwner() 
        public
        onlyPermissionModule(msg.sender)
    {
        oldOwner = address(0);
    }

    /**
    * @notice Set status of the role
    * @param wallet Wallet address
    * @param role Role name
    * @param status Role status
    */
    function setWalletRoleStatus(address wallet, bytes32 role, bool status) 
        public
        onlyPermissionModule(msg.sender) 
    {
        walletRoles[wallet][role] = status;
    }

    /**
    * @notice Set wallet role to the list
    * @param wallet Wallet address
    * @param role Role name
    * @param index Role index
    */
    function setWalletRoleToTheList(address wallet, bytes32 role, uint8 index) 
        public
        onlyPermissionModule(msg.sender) 
    {
        listOfTheWalletRoles[wallet][index] = role;
    }

    /**
    * @notice Delete wallet role index
    * @param wallet Wallet address
    * @param role Role name
    */
    function deleteWalletRoleIndex(address wallet, bytes32 role) 
        public
        onlyPermissionModule(msg.sender) 
    {
        delete indexesOfTheWalletRoles[wallet][role];
    }

    /**
    * @notice Delete wallet role from the list
    * @param wallet Wallet address
    * @param index Role index
    */
    function deleteWalletRole(address wallet, uint8 index) 
        public
        onlyPermissionModule(msg.sender) 
    {
        delete listOfTheWalletRoles[wallet][index];
    }

    /**
    * @notice Set wallet role index
    * @param wallet Wallet address
    * @param index Index
    */
    function setWalletRolesIndex(address wallet, uint8 index) 
        public
        onlyPermissionModule(msg.sender) 
    {
        walletRolesIndex[wallet] = index;
    }

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns wallet role index in the roles list
    * @param wallet Wallet address
    * @param role Role name
    */
    function getWalletRoleIndexInTheList(address wallet, bytes32 role) public view returns (uint8) {
        return indexesOfTheWalletRoles[wallet][role];
    }

    /**
    * @notice Returns wallet role status
    * @param wallet Wallet address
    * @param role Role name
    */
    function getWalletRoleStatus(address wallet, bytes32 role) public view returns (bool) {
        return walletRoles[wallet][role];
    }

    /**
    * @notice Retuns wallet role index
    * @param wallet Wallet address
    */
    function getWalletRoleIndex(address wallet) public view returns (uint8) {
        return walletRolesIndex[wallet];
    }

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    */
    function checkPermission(
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
    * @param wallet Wallet address
    */
    function getWalletRoles(address wallet) public view returns (bytes32[20]) {
        return listOfTheWalletRoles[wallet];
    }

    /**
    * @notice Get wallet role by the index
    * @param wallet Wallet address
    * @param index Index of the role
    */
    function getWalletRoleFromTheList(address wallet, uint8 index) public view returns (bytes32) {
        return listOfTheWalletRoles[wallet][index];
    }

    /**
    * @notice Returns address of the feature network owner
    */
    function getFutureOwner() public view returns (address) {
        return futureOwner;
    }
    
    /**
    * @notice Returns address which wants transfer ownership
    */
    function getOldOwner() public view returns (address) {
        return oldOwner;
    }
}