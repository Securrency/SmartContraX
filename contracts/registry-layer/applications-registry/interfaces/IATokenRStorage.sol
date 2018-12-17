pragma solidity ^0.5.0;


/**
* @title Application Token registry storage interface
* @notice In the system present two application registries.
* @notice One is called "CAT registry" and store applications
* @notice that are allowed to all tokens.
* @notice Other is called "Tokens registry" and store applications
* @notice that are allowed for some token, issuer can manage these applications.
* @notice ---------------------
* @notice |  IATokenRStorage  |
* @notice ---------------------
*/
contract IATokenRStorage {
    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Application Registry.

    /**
    * @notice Write info to the log when added new application
    * @param app Application address
    * @param token Token address
    */
    function emitTokenAppCreated(address app, address token) public;

    /**
    * @notice Write info to the log when application was removed
    * @param app Application to be removed
    * @param token Token address
    */
    function emitTokenAppRemoved(address app, address token) public;

    /**
    * @notice Write info to the log when application was paused
    * @param app Application to be paused
    * @param token Token address
    * @param status New application status
    */
    function emitTokenAppStatusUpdated(address app, address token, bool status) public;

    /// Methods which updates the storage. Allowed only for the Application Registry.

    /**
    * @notice Set application index in the "Token registry"
    * @param app Application address
    * @param token Token address
    * @param index Application index 
    */
    function setTokenAppIndex(address app, address token, uint index) public;

    /**
    * @notice Add application to the index in the registry
    * @param app Application address
    * @param token Token address
    * @param index Application index 
    */
    function addTokenAppToIndex(address app, address token, uint index) public;
    
    /**
    * @notice Push new application
    * @param app Application address
    * @param token Token Address
    */
    function pushNewTokenApp(address app, address token) public;

    /**
    * @notice Remove Token application from the list
    * @param index Index of the application that will be removed
    * @param token Token address
    */
    function deleteTokenAppFromTheList(uint index, address token) public;

    /**
    * @notice Remove Token application index
    * @param app Application address
    * @param token Token address
    */
    function deleteTokenAppIndex(address app, address token) public;

    /**
    * @notice Update length of the Token applications list
    * @param length New length
    * @param token Token address
    */
    function setTokenAppsLength(uint length, address token) public;

    /**
    * @notice Set Token application status
    * @param index Application index
    * @param token Token address
    * @param status Application statu
    */
    function setTokenAppStatus(uint index, address token, bool status) public;

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns application status from the Token registry
    * @param index Application index
    * @param token Token address
    */
    function getTokenAppStatus(uint index, address token) public view returns (bool);

    /**
    * @notice Returns application status from the Token registry
    * @param app Application address
    * @param token Token address
    */
    function getTokenAppStatusByAddress(address app, address token) public view returns (bool);

    /**
    * @notice Returns all applications in the "Token registry"
    * @param token Token address
    */
    function getTokenApplications(address token) public view returns (address[] memory);
    
    /**
    * @notice Returns application index from the "Token registry"
    * @param app Application address
    * @param token Token address
    */
    function getTokenAppIndex(address app, address token) public view returns (uint);

    /**
    * @notice Returns applications length
    * @param token Token address
    */
    function getTokenAppsLength(address token) public view returns (uint);

    /**
    * @notice Returns application by index
    * @param index Application index
    * @param token Token address
    */
    function getTokenAppByIndex(uint index, address token) public view returns (address);
}