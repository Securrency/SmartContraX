pragma solidity ^0.4.24;

import "../../../transfer-layer/transfer-module/interfaces/ITransferModule.sol";
import "../getters/TransferModuleAddress.sol";


/**
* @title Transfer instance
* @dev Create ITransferModule
*/
contract TransferModuleInstance is TransferModuleAddress {
    /**
    * @notice Returns transfer module instance
    */
    function tmInstance() public view returns (ITransferModule) {
        return ITransferModule(getTransferModuleAddress());
    }
}