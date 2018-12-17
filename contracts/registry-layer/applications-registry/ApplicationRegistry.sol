pragma solidity ^0.5.0;

import "./ApplicationRegistryMetadata.sol";
import "./interfaces/IApplicationRegistry.sol";
import "./interfaces/IARStorage.sol";
import "../../request-verification-layer/permission-module/Protected.sol";
import "../../common/libraries/SafeMath.sol";
import "../../common/component/SystemComponent.sol";


/**
* @title Application registry
*/
contract ApplicationRegistry is IApplicationRegistry, Protected, SystemComponent, ApplicationRegistryMetadata {
    // Declare libraries
    using SafeMath for uint;
    
    // Stora storage address
    address arStorage;
    
    // Initialize contract
    constructor(address componentsRegistry, address storageAddr) 
        public
        WithComponentsRegistry(componentsRegistry)
    {
        componentName = APPLICATION_REGISTRY_NAME;
        componentId = APPLICATION_REGISTRY_ID;

        arStorage = storageAddr;
    }

    /**
    * @notice Create application in the "CAT registry"
    * @param app Application address
    */
    function createCATApp(address app)
        public
        verifyPermission(msg.sig, msg.sender)
    {
        require(app != address(0), "Invalid application address.");

        IARStorage s = ARSStorage();

        uint index = s.getCATAppsLength();
        
        s.pushNewCATApp(app);
        s.setCATAppIndex(app, index);
        s.setCATAppRegistrationStatus(app, true);

        s.emitCATAppCreated(app);
    }

    /**
    * @notice Remove application from the "CAT registry"
    * @param app Application to be removed
    */
    function removeCATApp(address app)
        public
        verifyPermission(msg.sig, msg.sender)
    {
        require(app != address(0), "Invalid application address.");

        IARStorage s = ARSStorage();

        uint index = s.getCATAppIndex(app);
        uint last = s.getCATAppsLength().sub(1);

        if (last > 0) {
            address toUpdate = s.getCATAppByIndex(last);
            s.addCATAppToIndex(toUpdate, index);
            s.setCATAppIndex(toUpdate, index);
        }

        s.deleteCATAppFromTheList(last);
        s.deleteCATAppIndex(app);
        s.setCATAppsLength(last);
        s.setCATAppRegistrationStatus(app, false);

        s.emitCATAppRemoved(app);
    }

    /**
    * @notice Pause application in the "CAT registry"
    * @param app Application to be paused
    * @param status New application status
    */
    function changeCATAppStatus(address app, bool status) 
        public
        verifyPermission(msg.sig, msg.sender)
    {
        require(app != address(0), "Invalid application address.");

        IARStorage s = ARSStorage();

        uint index = s.getCATAppIndex(app);
        s.setCATAppStatus(index, status);

        s.emitCATAppStatusUpdated(app, status);
    }

    /**
    * @notice Create application in the "Token registry"
    * @param app Application address
    * @param token Token address
    */
    function createTokenApp(address app, address token)
        public
        verifyPermissionForToken(msg.sig, msg.sender, token)
    {
        require(app != address(0), "Invalid application address.");
        require(token != address(0), "Invalid token address.");

        IARStorage s = ARSStorage();

        uint index = s.getTokenAppsLength(token);

        s.pushNewTokenApp(app, token);
        s.setTokenAppIndex(app, token, index);
        s.setTokenAppStatus(index, token, true);

        s.emitTokenAppCreated(app, token);
    }

    /**
    * @notice Remove application from the "Token registry"
    * @param app Application to be removed
    * @param token Token address
    */
    function removeTokenApp(address app, address token)
        public
        verifyPermissionForToken(msg.sig, msg.sender, token)
    {
        require(app != address(0), "Invalid application address.");
        require(token != address(0), "Invalid token address.");

        IARStorage s = ARSStorage();

        uint index = s.getTokenAppIndex(app, token);
        uint last = s.getTokenAppsLength(token).sub(1);

        if (last > 0) {
            address toUpdate = s.getTokenAppByIndex(last, token);
            s.addTokenAppToIndex(toUpdate, token, index);
            s.setTokenAppIndex(toUpdate, token, index);
        }

        s.setTokenAppStatus(last, token, false);
        s.deleteTokenAppFromTheList(last, token);
        s.deleteTokenAppIndex(app, token);
        s.setTokenAppsLength(last, token);

        s.emitTokenAppRemoved(app, token);
    }

    /**
    * @notice Change application status in the "Token registry"
    * @param app Application address
    * @param token Token address
    * @param status New application status
    */
    function changeTokenAppStatus(address app, address token, bool status) 
        public
        verifyPermissionForToken(msg.sig, msg.sender, token)
    {
        require(app != address(0), "Invalid application address.");
        require(token != address(0), "Invalid token address.");

        IARStorage s = ARSStorage();

        uint index = s.getTokenAppIndex(app, token);
        s.setTokenAppStatus(index, token, status);

        s.emitTokenAppStatusUpdated(app, token, status);
    }

    /**
    * @notice Checks whether an application is registered or not
    * @param app Application address
    */
    function isRegistredApp(address app, address token) public view returns (bool) {
        IARStorage s = ARSStorage();

        bool result = s.getCATAppStatusByAddress(app);
        if (!result && token != address(0)) {
            return s.getTokenAppStatusByAddress(app, token);
        }

        return result;
    }

    /**
    * @notice Returns IARStorage instance
    */
    function ARSStorage() internal view returns (IARStorage) {
        return IARStorage(arStorage);
    }
}