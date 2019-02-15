pragma solidity ^0.5.0;

/**
* @title Transfer verification interface
*/
contract ITransferVerificationWithId {
    /**
    * @notice Verify tokens transfer. 
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param tokenAddress Address of the token
    * @param id Additional identifier
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
        returns (bool);
}