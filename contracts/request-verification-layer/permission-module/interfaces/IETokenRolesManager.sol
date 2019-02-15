pragma solidity >0.4.99 <0.6.0;


/**
* @title An interface of the extended tokens roles manager
*/
contract IETokenRolesManager {
    /**
    * @notice Add role for a specific token
    * @param wallet Wallet address
    * @param token Token address
    * @param roleName Name of the role which will be added to the wallet
    * @param subId Additional role identifier
    */
    function addRoleForSpecificTokenWithSubId(
        address wallet,
        address token,
        bytes32 roleName,
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

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    * @param subId Additional role identifier
    */
    function allowedForTokenWithSubId(
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
}