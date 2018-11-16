pragma solidity ^0.5.0;

import "./WithComponentsRegistry.sol";
import "../../symbol-registry/SymbolRegistryMetadata.sol";


/**
* @title Symbol registry address
*/
contract SymbolRegistryAddress is WithComponentsRegistry, SymbolRegistryMetadata {
    /**
    * @notice Get symbol registry address
    */
    function getSymbolRegistryAddress() public view returns (address) {
        return componentsRegistry.getAddressById(SYMBOL_REGISTRY_ID);
    }
}