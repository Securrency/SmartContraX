pragma solidity ^0.4.24;

import "./interfaces/IPermissionModule.sol";
import "./NetworkRolesManager.sol";
import "./TokenRolesManager.sol";
import "./PermissionModuleMetadata.sol";
import "../../common/component/SystemComponent.sol";


/**
* @title Permission Module
*/
contract PermissionModule is NetworkRolesManager, TokenRolesManager, SystemComponent, PermissionModuleMetadata {  
    // Initialize module
    constructor(address _componentsRegistry, address storageAddress) 
        public
        WithComponentsRegistry(_componentsRegistry)
        RolesManager(storageAddress)
    {
        componentName = PERMISSION_MODULE_NAME;
        componentId = PERMISSION_MODULE_ID;
    }

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    */
    function allowed(
        bytes4 methodId,
        address sender,
        address token
    ) 
        public 
        view 
        returns (bool)
    {
        if (token != address(0)) {
            return allowedForToken(methodId, sender, token);
        }

        return allowedForWallet(methodId, sender);
    }
}