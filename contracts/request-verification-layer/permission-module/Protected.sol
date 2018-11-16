pragma solidity ^0.5.0;

import "./interfaces/IPermissionModule.sol";
import "../../registry-layer/components-registry/instances/PermissionModuleInstance.sol";


/**
* @title Protected
*/
contract Protected is PermissionModuleInstance {
    /**
    * @notice Verify permission for the method and sender wallet
    * @param method Requested method
    * @param sender Transaction sender address
    */
    modifier verifyPermission(bytes4 method, address sender) {
        require(pmInstance().allowed(method, sender, address(0)), "Declined by Permission Module.");
        _;
    }

    /**
    * @notice Verify permission for the method, sender and for the token
    * @param method Requested method
    * @param sender Transaction sender address
    * @param token Token address
    */
    modifier verifyPermissionForToken(bytes4 method, address sender, address token) {
        require(pmInstance().allowed(method, sender, token), "Declined by Permission Module.");
        _;
    }

    /**
    * @notice Verify permission for the method, sender and for the token
    * @param method Requested method
    */
    modifier verifyPermissionForCurrentToken(bytes4 method) {
        require(pmInstance().allowed(method, msg.sender, address(this)), "Declined by Permission Module.");
        _;
    }
}