pragma solidity ^0.5.0;


import "../../../registry-layer/applications-registry/interfaces/IApplicationRegistry.sol";
import "../getters/ApplicationRegistryAddress.sol";


/**
* @title Application registry instance
* @dev Create IApplicationRegistry
*/
contract ApplicationRegistryInstance is ApplicationRegistryAddress {
    /**
    * @notice Returns application registry instance
    */
    function arInstance() public view returns (IApplicationRegistry) {
        return IApplicationRegistry(getApplicationRegistryAddress());
    }
}