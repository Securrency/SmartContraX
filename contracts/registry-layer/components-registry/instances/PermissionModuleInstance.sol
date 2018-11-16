pragma solidity ^0.5.0;

import "../../../request-verification-layer/permission-module/interfaces/IPermissionModule.sol";
import "../getters/PermissionModuleAddress.sol";


/**
* @title Permission module instance
* @dev Create IPermissionModule
*/
contract PermissionModuleInstance is PermissionModuleAddress {
    /**
    * @notice Returns permission module instance
    */
    function pmInstance() public view returns (IPermissionModule) {
        return IPermissionModule(getPermissionModuleAddress());
    }
}