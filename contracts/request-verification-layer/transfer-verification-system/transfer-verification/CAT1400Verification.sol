pragma solidity ^0.4.24;

import "../verification-service/WhiteListForTranches.sol";
import "../interfaces/ITrancheTransferVerification.sol";


/**
* @notice CAT-1400 transfer verification
*/
contract CAT1400Verification is ITrancheTransferVerification {
    // Address of the Whitelist service
    WhiteListForTranches public whiteList;
    
    /**
    * @notice Define whitelist address
    */
    constructor(address _whiteList) public {
        whiteList = WhiteListForTranches(_whiteList);
    }

    /**
    * @notice Verify tokens transfer. 
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param tokenAddress Address ot the token
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        address tokenAddress,
        bytes32 tranche,
        uint //tokens
    )
        public
        view
        returns (bool)
    {
        bool fromStatus = whiteList.presentInWhiteList(from, tokenAddress, tranche);
        bool toStatus = whiteList.presentInWhiteList(to, tokenAddress, tranche);
        bool senderStatus = whiteList.presentInWhiteList(sender, tokenAddress, tranche);

        return fromStatus && toStatus && senderStatus;
    }
}