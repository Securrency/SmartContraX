pragma solidity >0.4.99 <0.6.0;

import "./ICAT20VerifyTransfer.sol";
import "../../CAT20TokenStorage.sol";
import "../../../../../../transfer-layer/transfer-module/interfaces/ITransferModule.sol";


/**
* @notice CAT-20 transfer verification with white list
*/
contract CAT20WLVerifyTransfer is CAT20TokenStorage, ICAT20VerifyTransfer {
    /**
    * @notice Verifies tokens transfer
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Transaction initiator
    * @param amount The amount of tokens to be transferred
    */
    function verifyTransfer(address from, address to, address sender, uint amount) external {
        // Send request to the transfer module and verify transfer
        bool allowed = ITransferModule(transferModuleAddress).verifyTransfer(
            from,
            to,
            sender,
            amount
        );

        require(allowed, "Transfer was declined by whitelist");
    }
}