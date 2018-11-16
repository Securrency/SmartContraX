pragma solidity ^0.5.0;


/**
* @title Permission module network roles storage
*/
contract IPMNetworkRolesStorage {
    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Permission Module.

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

    /**
    * @notice Emit event OwnershipTransferRequest
    */
    function emitOwnershipTransferRequest(address newOwner) public;

    /// Methods which updates the storage. Allowed only for the Permission Module.

    /**
    * @notice Set status of the role
    * @param wallet Wallet address
    * @param role Role name
    * @param status Role status
    */
    function setWalletRoleStatus(address wallet, bytes32 role, bool status) public;

    /**
    * @notice Set wallet role to the list
    * @param wallet Wallet address
    * @param role Role name
    * @param index Role index
    */
    function setWalletRoleToTheList(address wallet, bytes32 role, uint8 index) public;

    /**
    * @notice Delete wallet role index
    * @param wallet Wallet address
    * @param role Role name
    */
    function deleteWalletRoleIndex(address wallet, bytes32 role) public;

    /**
    * @notice Delete wallet role from the list
    * @param wallet Wallet address
    * @param index Role index
    */
    function deleteWalletRole(address wallet, uint8 index) public;

    /**
    * @notice Set wallet role index
    * @param wallet Wallet address
    * @param index Index
    */
    function setWalletRolesIndex(address wallet, uint8 index) public;

    /**
    * @notice Create request on the symbol ownership transferring
    * @param newOwner Address of the new symbol owner
    */
    function createRequestOnOwnershipTransfer(address newOwner) public;

    /**
    * @notice Delete request on the symbol ownership transferring
    */
    function deleteRequestOnOwnershipTransfer() public;

    /**
    * @notice Set address which wants transfer ownership
    * @param owner Address which wants transfer ownership
    */
    function setOldOwner(address owner) public;

    /**
    * @notice Set address which wants transfer ownership
    */
    function deleteOldOwner() public;

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns wallet role index in the roles list
    * @param wallet Wallet address
    * @param role Role name
    */
    function getWalletRoleIndexInTheList(address wallet, bytes32 role) public view returns (uint8);

    /**
    * @notice Returns wallet role status
    * @param wallet Wallet address
    * @param role Role name
    */
    function getWalletRoleStatus(address wallet, bytes32 role) public view returns (bool);

    /**
    * @notice Retuns wallet role index
    * @param wallet Wallet address
    */
    function getWalletRoleIndex(address wallet) public view returns (uint8);

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
        returns (bool);

    /**
    * @notice Returns list of all roles of the wallet
    * @param wallet Wallet address
    */
    function getWalletRoles(address wallet) public view returns (bytes32[20] memory);

    /**
    * @notice Get wallet role by the index
    * @param wallet Wallet address
    * @param index Index of the role
    */
    function getWalletRoleFromTheList(address wallet, uint8 index) public view returns (bytes32);

    /**
    * @notice Returns address of the feature network owner
    */
    function getFutureOwner() public view returns (address);

    /**
    * @notice Returns address which wants transfer ownership
    */
    function getOldOwner() public view returns (address);
}