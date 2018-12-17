pragma solidity ^0.5.0;

import "./WithComponentsRegistry.sol";
import "../../applications-registry/ApplicationRegistryMetadata.sol";


/**
* @title Application registry address
*/
contract ApplicationRegistryAddress is WithComponentsRegistry, ApplicationRegistryMetadata {
    /**
    * @notice Get application registry address
    */
    function getApplicationRegistryAddress() public view returns (address) {
        return componentsRegistry.getAddressById(APPLICATION_REGISTRY_ID);
    }
}