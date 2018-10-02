pragma solidity 0.4.24;

/**
* @notice Interface for the contract which allows receipt tokens from the other chain
*/
contract IToChain {
    /**
    * @notice Receipt tokens from the other chain
    * @param fromTokenAddress Token address in the previous chain
    * @param sendedFrom Sender address in the previous chain
    * @param recipient Recipient address
    * @param tokenAddress Token address in the current chain
    * @param fromChain Original chain
    * @param originalTxHash Tx hash which initiate cross chain transfer
    * @param value Amount of tokens
    */
    function receivedFromOtherChain(
        address fromTokenAddress,
        address recipient,
        address tokenAddress,
        bytes32 sendedFrom,
        bytes32 fromChain,
        bytes32 originalTxHash,
        uint value,
        uint txId
    ) 
        internal;

    /**
    * @notice Verify transaction status
    * @param originalTxHash Transaction hash in the parent blockchain
    */
    function crossChainTxIsProcessed(bytes32 originalTxHash) public view returns (bool);
}