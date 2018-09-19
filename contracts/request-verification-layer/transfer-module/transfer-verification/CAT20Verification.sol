pragma solidity 0.4.24;

import "../interfaces/ITransferVerification.sol";
import "../verification-service/WhiteList.sol";

/**
* @title Transfer verification of the CAT-20 token standard
*/
contract CAT20Verification is ITransferVerification {
    // Address of the Whitelist service
    address public whiteListAddress;
    
    /**
    * @notice Define whitelist address
    */
    constructor(address _whiteList) public {
        whiteListAddress = _whiteList;
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
        uint //tokens
    )
        public
        view
        returns (bool)
    {
        bool fromStatus = WhiteList(whiteListAddress).presentInWhiteList(from, tokenAddress);
        bool toStatus = WhiteList(whiteListAddress).presentInWhiteList(to, tokenAddress);
        bool senderStatus = WhiteList(whiteListAddress).presentInWhiteList(sender, tokenAddress);

        return fromStatus && toStatus && senderStatus;
    }
}