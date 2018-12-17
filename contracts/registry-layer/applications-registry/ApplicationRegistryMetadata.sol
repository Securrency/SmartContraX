pragma solidity ^0.5.0;


/**
* @title Application registry metadata
*/
contract ApplicationRegistryMetadata {
    bytes constant APPLICATION_REGISTRY_NAME = "ApplicationRegistry";
    bytes4 constant APPLICATION_REGISTRY_ID = bytes4(keccak256(APPLICATION_REGISTRY_NAME));
}