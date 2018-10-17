pragma solidity ^0.4.24;

import "../../../registry-layer/components-registry/getters/TransferModuleAddress.sol";


/**
* @title Base cross chain service storage
*/
contract BaseStorage is TransferModuleAddress {
    /**
    * @notice Verify sender address
    */
    modifier onlyTransferModule(address sender) {
        address transferModule = getTransferModuleAddress();
        require(sender == transferModule, "Allowed only for the transfer module.");
        _;
    }
}