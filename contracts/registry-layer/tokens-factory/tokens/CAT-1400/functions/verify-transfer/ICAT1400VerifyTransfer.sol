pragma solidity >0.4.99 <0.6.0;


interface ICAT1400VerifyTransfer {
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
        external;
}