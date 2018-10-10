pragma solidity ^0.4.24;


/**
* @title Permission module metadata
*/
contract PermissionModuleMetadata {
    bytes constant PERMISSION_MODULE_NAME = "PermissionModule";
    bytes4 constant PERMISSION_MODULE_ID = bytes4(keccak256(PERMISSION_MODULE_NAME));
}