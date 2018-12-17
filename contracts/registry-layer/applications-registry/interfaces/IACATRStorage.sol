pragma solidity ^0.5.0;


/**
* @title Application CAT registry storage interface
* @notice In the system present two application registries.
* @notice One is called "CAT registry" and store applications
* @notice that are allowed to all tokens.
* @notice Other is called "Tokens registry" and store applications
* @notice that are allowed for some token, issuer can manage these applications.
* @notice -------------------
* @notice |  IACATRStorage  |
* @notice -------------------
*/
contract IACATRStorage {
    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Application Registry.

    /**
    * @notice Write info to the log when added new application
    * @param app Application address
    */
    function emitCATAppCreated(address app) public;

    /**
    * @notice Write info to the log when application was removed
    * @param app Application to be removed
    */
    function emitCATAppRemoved(address app) public;

    /**
    * @notice Write info to the log when application was updated
    * @param app Application to be updated
    * @param status New application status
    */
    function emitCATAppStatusUpdated(address app, bool status) public;

    /// Methods which updates the storage. Allowed only for the Application Registry.

    /**
    * @notice Set application index in the "CAT registry"
    * @param app Application address
    * @param index Application index 
    */
    function setCATAppIndex(address app, uint index) public;

    /**
    * @notice Add application to the index in the registry
    * @param app Application address
    * @param index Application index 
    */
    function addCATAppToIndex(address app, uint index) public;

    /**
    * @notice Push new application
    * @param app Application address
    */
    function pushNewCATApp(address app) public;

    /**
    * @notice Remove CAT application from the list
    * @param index Index of the application that will be removed
    */
    function deleteCATAppFromTheList(uint index) public;

    /**
    * @notice Remove CAT application index
    * @param app Application address
    */
    function deleteCATAppIndex(address app) public;

    /**
    * @notice Update length of the CAT applications list
    * @param length New length
    */
    function setCATAppsLength(uint length) public;

    /**
    * @notice Set CAT application status
    * @param index Application index
    * @param status Application statu
    */
    function setCATAppStatus(uint index, bool status) public;

    /**
    * @notice Update application registration status
    * @param app Application address
    * @param status Status to be set
    */
    function setCATAppRegistrationStatus(address app, bool status) public;

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns application status from the CAT registry
    * @param index Application index
    */
    function getCATAppStatus(uint index) public view returns (bool);

    /**
    * @notice Returns application status from the CAT registry
    * @param app Application address
    */
    function getCATAppStatusByAddress(address app) public view returns (bool);

    /**
    * @notice Returns all applications in the "CAT registry"
    */
    function getCATApplications() public view returns (address[] memory);
    
    /**
    * @notice Returns application index from the "CAT registry"
    * @param app Application address
    */
    function getCATAppIndex(address app) public view returns (uint);

    /**
    * @notice Returns applications length
    */
    function getCATAppsLength() public view returns (uint);

    /**
    * @notice Returns application by index
    * @param index Application index
    */
    function getCATAppByIndex(uint index) public view returns (address);
}