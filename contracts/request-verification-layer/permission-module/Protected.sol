pragma solidity 0.4.24;

import "./interfaces/IPermissionModule.sol";

/**
* @title Protected
*/
contract Protected {
    // Permission module address
    address pm;

    /**
    * @notice Verify permission for the method and sender wallet
    * @param method Requested method
    * @param sender Transaction sender address
    */
    modifier verifyPermission(bytes4 method, address sender) {
        require(IPermissionModule(pm).allowed(method, sender, address(0)), "Declined by Permission Module.");
        _;
    }

    /**
    * @notice Verify permission for the method, sender and for the token
    * @param method Requested method
    * @param sender Transaction sender address
    * @param token Token address
    */
    modifier verifyPermissionForToken(bytes4 method, address sender, address token) {
        require(IPermissionModule(pm).allowed(method, sender, token), "Declined by Permission Module.");
        _;
    }

    /**
    * @notice Verify permission for the method, sender and for the token
    * @param method Requested method
    * @param sender Transaction sender address
    */
    modifier verifyPermissionForCurrentToken(bytes4 method, address sender) {
        require(IPermissionModule(pm).allowed(method, sender, address(this)), "Declined by Permission Module.");
        _;
    }

    /**
    * @notice Initialize contract with permission module
    */
    constructor(address permissionMudule) public {
        pm = permissionMudule;
    }
}