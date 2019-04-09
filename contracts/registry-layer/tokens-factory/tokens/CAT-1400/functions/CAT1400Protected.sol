pragma solidity >0.4.99 <0.6.0;

import "../CAT1400TokenStorage.sol";
import "../../../../../request-verification-layer/permission-module/interfaces/IPermissionModule.sol";


/**
* @title Extension for CAT-1400 methods which allows verifying permissions
*/
contract CAT1400Protected is CAT1400TokenStorage {
    /**
    * @notice Verify permission for the method and sender wallet
    * @param method Requested method
    * @param sender Transaction sender address
    */
    modifier verifyPermission(bytes4 method, address sender) {
        require(
            IPermissionModule(permissionModuleAddress).allowed(method, sender, address(this)),
            "Declined by Permission Module"
        );
        _;
    }
    
    /**
    * @notice Verify permission for the method and sender wallet
    * @param method Requested method
    * @param sender Transaction sender address
    * @param subId Additional role identifier
    */
    modifier verifyPermissionByPartition(bytes4 method, address sender, bytes32 subId) {
        require(
            IPermissionModule(permissionModuleAddress).allowedForTokenWithSubId(
                method,
                sender,
                address(this),
                subId
            ),
            "Declined by Permission Module"
        );
        _;
    }
}