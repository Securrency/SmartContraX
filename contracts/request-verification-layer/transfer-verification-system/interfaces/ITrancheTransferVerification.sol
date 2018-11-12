pragma solidity ^0.4.24;

/**
* @title Tranche transfer verification interface
*/
contract ITrancheTransferVerification {
    /**
    * @notice Verify tokens transfer. 
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param tokenAddress Address ot the token
    * @param tranche Tranche
    * @param tokens The amount of tokens to be transferred 
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        address tokenAddress,
        bytes32 tranche,
        uint tokens
    )
        public
        view
        returns (bool);
}