pragma solidity ^0.4.24;

import "./WithComponentsRegistry.sol";
import "../../../request-verification-layer/permission-module/PermissionModuleMetadata.sol";


/**
* @title Permission module address
*/
contract PermissionModuleAddress is WithComponentsRegistry, PermissionModuleMetadata {
    /**
    * @notice Get permission module address from the components registry
    */
    function getPermissionModuleAddress() public view returns (address) {
        return componentsRegistry.getAddressById(PERMISSION_MODULE_ID);
    }
}