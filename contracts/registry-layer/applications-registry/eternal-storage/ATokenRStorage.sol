pragma solidity ^0.5.0;

import "../interfaces/IATokenRStorage.sol";
import "./BaseARStorage.sol";


/**
* @title Application registry storage
*/
contract ATokenRStorage is BaseARStorage, IATokenRStorage {

    // Declare storage for the "Token rgistry" applications indexes
    // token address => application address => index
    mapping(address => mapping(address => uint)) tokenAppsIndexes;

    // Declare storage for the registred applications
    // token address => application address => status (true - registred)
    mapping(address => mapping(address => bool)) registredTokenApps;

    // Desclare storage for the list of the all applications in the "Token registry"
    // token address => applications[]
    mapping(address => address[]) tokenApps;

    // Writes info in the log when an added application in the "Token registry"
    event TokenAppCreated(address indexed app, address indexed token);

    // Writes info in the log when application was removed from the "Token registry"
    event TokenAppRemoved(address indexed app, address indexed token);

    // Writes info to the log when application in the "Token registry" was paused
    event TokenAppStatusUpdated(address indexed app, address indexed token, bool status); 

    /**
    * @notice Write info to the log when added new application
    * @param app Application address
    * @param token Token address
    */
    function emitTokenAppCreated(address app, address token) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        emit TokenAppCreated(app, token);
    }

    /**
    * @notice Write info to the log when application was removed
    * @param app Application to be removed
    * @param token Token address
    */
    function emitTokenAppRemoved(address app, address token) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        emit TokenAppRemoved(app, token);
    }

    /**
    * @notice Write info to the log when application was paused
    * @param app Application to be paused
    * @param token Token address
    * @param status New application status
    */
    function emitTokenAppStatusUpdated(address app, address token, bool status)
        public
        onlyApplicationRegistry(msg.sender)
    {
        emit TokenAppStatusUpdated(app, token, status);
    }

    /// Methods which updates the storage. Allowed only for the Application Registry.

    /**
    * @notice Set application index in the "Token registry"
    * @param app Application address
    * @param token Token address
    * @param index Application index 
    */
    function setTokenAppIndex(address app, address token, uint index) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        tokenAppsIndexes[token][app] = index;
    }

    /**
    * @notice Add application to the index in the registry
    * @param app Application address
    * @param token Token address
    * @param index Application index 
    */
    function addTokenAppToIndex(address app, address token, uint index) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        tokenApps[token][index] = app;
    }

    /**
    * @notice Push new application
    * @param app Application address
    * @param token Token Address
    */
    function pushNewTokenApp(address app, address token) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        tokenApps[token].push(app);
    }

    /**
    * @notice Remove Token application from the list
    * @param index Index of the application that will be removed
    * @param token Token address
    */
    function deleteTokenAppFromTheList(uint index, address token) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        delete tokenApps[token][index];
    }

    /**
    * @notice Remove Token application index
    * @param app Application address
    * @param token Token address
    */
    function deleteTokenAppIndex(address app, address token) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        delete tokenAppsIndexes[token][app];
    }

    /**
    * @notice Update length of the Token applications list
    * @param length New length
    * @param token Token address
    */
    function setTokenAppsLength(uint length, address token) 
        public
        onlyApplicationRegistry(msg.sender)
    {
        tokenApps[token].length = length;
    }

    /**
    * @notice Set Token application status
    * @param index Application index
    * @param token Token address
    * @param status Application statu
    */
    function setTokenAppStatus(uint index, address token, bool status)
        public
        onlyApplicationRegistry(msg.sender)
    {
        registredTokenApps[token][tokenApps[token][index]] = status;
    }

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns application status from the Token registry
    * @param index Application index
    * @param token Token address
    */
    function getTokenAppStatus(uint index, address token) public view returns (bool) {
        return registredTokenApps[token][tokenApps[token][index]];
    }

    /**
    * @notice Returns application status from the Token registry
    * @param app Application address
    * @param token Token address
    */
    function getTokenAppStatusByAddress(address app, address token) public view returns (bool) {
        return registredTokenApps[token][app];
    }

    /**
    * @notice Returns all applications in the "Token registry"
    * @param token Token address
    */
    function getTokenApplications(address token) public view returns (address[] memory) {
        return tokenApps[token];
    }
    
    /**
    * @notice Returns application index from the "Token registry"
    * @param app Application address
    * @param token Token address
    */
    function getTokenAppIndex(address app, address token) public view returns (uint) {
        return tokenAppsIndexes[token][app];
    }

    /**
    * @notice Returns applications length
    * @param token Token address
    */
    function getTokenAppsLength(address token) public view returns (uint) {
        return tokenApps[token].length;
    }

    /**
    * @notice Returns application by index
    * @param index Application index
    * @param token Token address
    */
    function getTokenAppByIndex(uint index, address token) public view returns (address) {
        return tokenApps[token][index];
    }
}