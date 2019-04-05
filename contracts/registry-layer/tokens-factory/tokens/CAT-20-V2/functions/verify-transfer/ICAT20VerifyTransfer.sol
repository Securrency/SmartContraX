pragma solidity >0.4.99 <0.6.0;


interface ICAT20VerifyTransfer {
    /**
    * @notice Verifies tokens transfer
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Transaction initiator
    * @param amount The amount of tokens to be transferred
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        uint amount
    )
        external;
}