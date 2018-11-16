pragma solidity ^0.5.0;

/**
* @notice Interface for the contract which allows receipt tokens from the other chain
*/
contract IToChain {
    /**
    * @notice Receipt tokens from the other chain
    * @param fromTokenAddress Token address in the previous chain
    * @param sentFrom Sender address in the previous chain
    * @param recipient Recipient address
    * @param tokenAddress Token address in the current chain
    * @param fromChain Original chain
    * @param originalTxHash Tx hash which initiate cross chain transfer
    * @param value Amount of tokens
    * @param txId Cross chain transaction id (defined by cross chain service in the chain from which tokens were transferred)
    */
    function receivedFromOtherChain(
        address fromTokenAddress,
        address recipient,
        address tokenAddress,
        bytes32 sentFrom,
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