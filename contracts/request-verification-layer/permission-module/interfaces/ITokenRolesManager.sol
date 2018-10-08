pragma solidity ^0.4.24;

contract ITokenRolesManager {
    /**
    * @notice Add role for a specific token
    * @param wallet Wallet address
    * @param token Token address
    * @param roleName Name of the role which will be added to the wallet
    */
    function addRoleForSpecificToken(address wallet, address token, bytes32 roleName) public;

    /**
    * @notice Remove role from a specific token
    * @param wallet Wallet address
    * @param token Token address
    * @param roleName Name of the role which will be removed from the wallet
    */
    function removeRoleFromSpecificToken(address wallet, address token, bytes32 roleName) public;

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    */
    function allowedForToken(bytes4 methodId, address sender, address token) public view returns (bool);

    /**
    * @notice Returns list of all roles of the wallet
    */
    function getWalletRolesForToken(address wallet, address token) public view returns (bytes32[20]);    
}