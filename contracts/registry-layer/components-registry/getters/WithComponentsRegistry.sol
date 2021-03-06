pragma solidity ^0.5.0;

import "../interfaces/IComponentsRegistry.sol";


/**
* @title Contract with components registry
*/
contract WithComponentsRegistry {
    // Component registry instance;
    IComponentsRegistry public componentsRegistry;
    
    // Initialize component with components registry
    constructor(address componentsRegistryAddress) public {
        componentsRegistry = IComponentsRegistry(componentsRegistryAddress);
    }
}