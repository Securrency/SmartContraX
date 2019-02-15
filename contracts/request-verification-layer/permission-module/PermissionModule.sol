pragma solidity ^0.5.0;

import "./interfaces/IPermissionModule.sol";
import "./NetworkRolesManager.sol";
import "./TokenRolesManager.sol";
import "./ETokenRolesManager.sol";
import "./PermissionModuleMetadata.sol";
import "../../common/component/SystemComponent.sol";


/**
* @title Permission Module
*/
contract PermissionModule is NetworkRolesManager, TokenRolesManager, ETokenRolesManager, SystemComponent, PermissionModuleMetadata {  
    // Initialize module
    constructor(address _componentsRegistry, address storageAddress, address storageAddress2) 
        public
        WithComponentsRegistry(_componentsRegistry)
        RolesManager(storageAddress, storageAddress2)
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
        returns (bool) 
    {
        return super.allowedForTokenWithSubId(
            methodId,
            sender,
            token,
            subId
        );
    }
}