pragma solidity ^0.5.0;

import "../interfaces/IACATRStorage.sol";
import "./BaseARStorage.sol";


/**
* @title Application CAT registry storage
*/
contract ACATRStorage is BaseARStorage, IACATRStorage {
    // Declare storage for the "CAT registry" application indexes
    // application address => index
    mapping(address => uint) CATAppsIndexes;

    // Declare storage for the registred applications
    // application address => status (true - registred)
    mapping(address => bool) registredCATApps;

    // Declare storage for the list of the all applications in the "CAT registry"
    address[] CATApps;

    // Writes info in the log when an added application in the "CAT registry"
    event CATAppCreated(address indexed app);

    // Writes info in the log when application was removed from the "CAT registry"
    event CATAppRemoved(address indexed app);

    // Writes info to the log when application in the "CAT registry" was updated
    event CATAppStatusUpdated(address indexed app, bool status);

    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Application Registry.

    /**
    * @notice Write info to the log when added new application
    * @param app Application address
    */
    function emitCATAppCreated(address app) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        emit CATAppCreated(app);
    }

    /**
    * @notice Write info to the log when application was removed
    * @param app Application to be removed
    */
    function emitCATAppRemoved(address app)
        public
        onlyApplicationRegistry(msg.sender)
    {
        emit CATAppRemoved(app);
    }

    /**
    * @notice Write info to the log when application was updated
    * @param app Application to be updated
    * @param status New application status
    */
    function emitCATAppStatusUpdated(address app, bool status)
        public
        onlyApplicationRegistry(msg.sender)
    {
        emit CATAppStatusUpdated(app, status);
    }

    /// Methods which updates the storage. Allowed only for the Application Registry.

    /**
    * @notice Set application index in the "CAT registry"
    * @param app Application address
    * @param index Application index 
    */
    function setCATAppIndex(address app, uint index) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        CATAppsIndexes[app] = index;
    }

    /**
    * @notice Add application to the index in the registry
    * @param app Application address
    * @param index Application index 
    */
    function addCATAppToIndex(address app, uint index) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        CATApps[index] = app;
    }

    /**
    * @notice Push new application
    * @param app Application address
    */
    function pushNewCATApp(address app) public {
        CATApps.push(app);
    }

    /**
    * @notice Remove CAT application from the list
    * @param index Index of the application that will be removed
    */
    function deleteCATAppFromTheList(uint index) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        delete CATApps[index];
    }

    /**
    * @notice Remove CAT application index
    * @param app Application address
    */
    function deleteCATAppIndex(address app) 
        public
        onlyApplicationRegistry(msg.sender) 
    {
        delete CATAppsIndexes[app];
    }

    /**
    * @notice Update length of the CAT applications list
    * @param length New length
    */
    function setCATAppsLength(uint length) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        CATApps.length = length;
    }

    /**
    * @notice Set CAT application status
    * @param index Application index
    * @param status Application statu
    */
    function setCATAppStatus(uint index, bool status) 
        public 
        onlyApplicationRegistry(msg.sender)
    {
        registredCATApps[CATApps[index]] = status;
    }

    /**
    * @notice Update application registration status
    * @param app Application address
    * @param status Status to be set
    */
    function setCATAppRegistrationStatus(address app, bool status) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        registredCATApps[app] = status;
    }

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns application status from the CAT registry
    * @param index Application index
    */
    function getCATAppStatus(uint index) public view returns (bool) {
        return registredCATApps[CATApps[index]];
    }

    /**
    * @notice Returns application status from the CAT registry.
    * @notice Shows whether an application is registered or not.
    * @param app Application address
    */
    function getCATAppStatusByAddress(address app) public view returns (bool) {
        return registredCATApps[app];
    }

    /**
    * @notice Returns all applications in the "CAT registry"
    */
    function getCATApplications() public view returns (address[] memory) {
        return CATApps;
    }
    
    /**
    * @notice Returns application index from the "CAT registry"
    * @param app Application address
    */
    function getCATAppIndex(address app) public view returns (uint) {
        return CATAppsIndexes[app];
    }

    /**
    * @notice Returns applications length
    */
    function getCATAppsLength() public view returns (uint) {
        return CATApps.length;
    }

    /**
    * @notice Returns application by index
    * @param index Application index
    */
    function getCATAppByIndex(uint index) public view returns (address) {
        return CATApps[index];
    }
}