pragma solidity 0.4.24;

/**
* @title Transfer verification interface
*/
contract ITransferVerification {
    /**
    * @notice Verify tokens transfer. 
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param tokenAddress Address ot the token
    * @param tokens The amount of tokens to be transferred 
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        address tokenAddress,
        uint tokens
    )
        public
        view
        returns (bool);
}