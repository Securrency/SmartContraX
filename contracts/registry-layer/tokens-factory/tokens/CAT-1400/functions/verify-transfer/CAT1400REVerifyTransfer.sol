pragma solidity >0.4.99 <0.6.0;

import "./ICAT1400VerifyTransfer.sol";
import "../../CAT1400TokenStorage.sol";
import "../../../../../../transfer-layer/transfer-module/interfaces/ITransferModule.sol";


/**
* @notice  CAT-1400 transfer verification with a rules engine
*/
contract CAT1400REVerifyTransfer is CAT1400TokenStorage, ICAT1400VerifyTransfer {
    /**
    * @notice Verifies tokens transfer
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Transaction initiator
    * @param partition Partition identifier
    * @param amount The number of tokens to be transferred
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        bytes32 partition,
        uint amount
    )
        external
    {
        // Send request to the transfer module and verify transfer
        bool allowed = ITransferModule(transferModuleAddress).checkCAT1400TransferThroughRE(
            from,
            to,
            sender,
            partition,
            amount
        );
        
        require(allowed, "Transfer was declined by Rules Engine");
    }
}