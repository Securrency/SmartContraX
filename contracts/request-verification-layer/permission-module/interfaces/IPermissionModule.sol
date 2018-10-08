pragma solidity ^0.4.24;

/**
* @title Permission module interface
*/
contract IPermissionModule {
    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    */
    function allowed(bytes4 methodId, address sender, address token) public view returns (bool);
}