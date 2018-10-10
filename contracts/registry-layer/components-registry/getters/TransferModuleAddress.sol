pragma solidity ^0.4.24;

import "./WithComponentsRegistry.sol";
import "../../../transfer-layer/transfer-module/TransferModuleMetadata.sol";


/**
* @title Transfer module address
*/
contract TransferModuleAddress is WithComponentsRegistry, TransferModuleMetadata {
    /**
    * @notice Get transfer module address
    */
    function getTransferModuleAddress() public view returns (address) {
        return componentsRegistry.getAddressById(TRANSFER_MODULE_ID);
    }
}