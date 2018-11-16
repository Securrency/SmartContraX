pragma solidity ^0.5.0;


/**
* @title Symbol registry metadata
*/
contract SymbolRegistryMetadata {
    bytes constant SYMBOL_REGISTRY_NAME = "SymbolRegistry";
    bytes4 constant SYMBOL_REGISTRY_ID = bytes4(keccak256(SYMBOL_REGISTRY_NAME));
}