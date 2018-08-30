pragma solidity 0.4.24;

contract INetworkRolesManager {
    /**
    * @notice Add a role to the wallet
    * @param wallet Wallet address
    * @param roleName Name of the role which will be added to the wallet
    */
    function addRoleToTheWallet(address wallet, bytes32 roleName) public;

    /**
    * @notice Remove role from the wallet
    * @param wallet Wallet address
    * @param roleName Name of the role which will be removed from the wallet
    */
    function removeRoleFromTheWallet(address wallet, bytes32 roleName) public;

    /**
    * @notice Transfer ownership
    * @param newOwner Address of the new owner
    */
    function transferOwnership(address newOwner) public;

    /**
    * @notice Returns list of all roles of the wallet
    */
    function getWalletRoles(address wallet) public view returns (bytes32[20]);

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    */
    function allowedForWallet(bytes4 methodId, address sender) public view returns (bool);
}