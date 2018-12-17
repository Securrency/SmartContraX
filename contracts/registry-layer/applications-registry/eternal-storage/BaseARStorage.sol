pragma solidity ^0.5.0;

import "../../components-registry/getters/ApplicationRegistryAddress.sol";


/**
* @title BaseARStorage
*/
contract BaseARStorage is ApplicationRegistryAddress {
    // Verify the sender address. Compare with application registry address
    modifier onlyApplicationRegistry(address sender) {
        address appRegistry = getApplicationRegistryAddress();
        require(sender == appRegistry, "Method allowed only for the Application Registry.");
        _;
    }
    
    /**
    * @notice Initialize contract
    */
    constructor(address componentsRegistry) 
        public 
        WithComponentsRegistry(componentsRegistry)
    {}
}