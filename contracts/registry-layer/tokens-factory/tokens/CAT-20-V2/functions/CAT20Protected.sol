pragma solidity >0.4.99 <0.6.0;

import "../CAT20TokenStorage.sol";
import "../../../../../request-verification-layer/permission-module/interfaces/IPermissionModule.sol";


/**
* @title Extension for CAT-20 methods which allows verifying permissions
*/
contract CAT20Protected is CAT20TokenStorage {
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
}