pragma solidity ^0.5.0;


/**
* @title Transfer module metadata
*/
contract TransferModuleMetadata {
    bytes constant TRANSFER_MODULE_NAME = "TransferModule";
    bytes4 constant TRANSFER_MODULE_ID = bytes4(keccak256(TRANSFER_MODULE_NAME));
}