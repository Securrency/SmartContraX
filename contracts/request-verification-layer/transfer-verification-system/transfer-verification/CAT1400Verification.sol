pragma solidity >0.4.99 <0.6.0;

import "../verification-service/WhiteListWithIds.sol";


/**
* @title CAT-1400 Transfer verification
*/
contract CAT1400Verification {
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
    * @param sender Transaction initiator
    * @param id Additional identifier
    * @param tokenAddress Address ot the token
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        address tokenAddress,
        bytes32 id
    )
        public
        view
        returns (bool)
    {
        bool result = WhiteListWithIds(whiteListAddress).presentInWhiteList(from, tokenAddress, id);
        if (from != to) {
            result = result && WhiteListWithIds(whiteListAddress).presentInWhiteList(to, tokenAddress, id);
        }
        if (from != sender) {
            result = result && WhiteListWithIds(whiteListAddress).presentInWhiteList(sender, tokenAddress, id);
        }
        
        return result;
    }
}