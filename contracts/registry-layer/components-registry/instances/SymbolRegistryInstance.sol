pragma solidity ^0.4.24;

import "../../symbol-registry/interfaces/ISymbolRegistry.sol";
import "../getters/SymbolRegistryAddress.sol";


/**
* @title Symbol registry instance
* @dev Create ISymbolRegistry
*/
contract SymbolRegistryInstance is SymbolRegistryAddress {
    /**
    * @notice Returns symbol registry instance
    */
    function srInstance() public view returns (ISymbolRegistry) {
        return ISymbolRegistry(getSymbolRegistryAddress());
    }
}