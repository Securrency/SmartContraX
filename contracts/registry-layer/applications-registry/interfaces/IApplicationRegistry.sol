pragma solidity ^0.5.0;


/**
* @title Application registry
*/
contract IApplicationRegistry {
    /**
    * @notice Create application in the "CAT registry"
    * @param app Application address
    */
    function createCATApp(address app) public;

    /**
    * @notice Remove application from the "CAT registry"
    * @param app Application to be removed
    */
    function removeCATApp(address app) public;

    /**
    * @notice Pause application in the "CAT registry"
    * @param app Application to be paused
    * @param status New application status
    */
    function changeCATAppStatus(address app, bool status) public;

    /**
    * @notice Create application in the "Token registry"
    * @param app Application address
    * @param token Token address
    */
    function createTokenApp(address app, address token) public;

    /**
    * @notice Remove application from the "Token registry"
    * @param app Application to be removed
    * @param token Token address
    */
    function removeTokenApp(address app, address token) public;

    /**
    * @notice Pause application in the "Token registry"
    * @param app Application to be paused
    * @param token Token address
    * @param status New application status
    */
    function changeTokenAppStatus(address app, address token, bool status) public;

    /**
    * @notice Checks whether an application is registered or not
    * @param app Application address
    */
    function isRegistredApp(address app, address token) public view returns (bool);
}