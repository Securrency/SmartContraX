pragma solidity 0.4.24;

import "./interfaces/IToChain.sol";

/**
* @title Accept tokens from other chain
*/
contract ToChain is IToChain {
    // Declare storage for the used transactions
    mapping(bytes32 => bool) processedTx;

    /**
    * @notice Write info to the log when cross chain transfer was accepted
    * @param fromTokenAddress Token address in the previous chain
    * @param sendedFrom Sender address in the previous chain
    * @param recipient Recipient address
    * @param tokenAddress Token address in the current chain
    * @param fromChain Original chain
    * @param originalTxHash Tx hash which initiate cross chain transfer
    * @param value Amount of tokens || token id for the CAT-721 token
    */
    event AcceptedFromOtherChain(
        address indexed fromTokenAddress,
        address indexed recipient,
        uint indexed txId,
        address tokenAddress,
        bytes32 sendedFrom,
        bytes32 fromChain,
        bytes32 originalTxHash,
        uint value
    );

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
        internal
    {
        require(!processedTx[originalTxHash], "Transaction already processed.");

        processedTx[originalTxHash] = true;

        emit AcceptedFromOtherChain(
            fromTokenAddress,
            recipient,
            txId,
            tokenAddress,
            sendedFrom,
            fromChain,
            originalTxHash,
            value
        );
    }

    /**
    * @notice Verify transaction status
    * @param originalTxHash Transaction hash in the parent blockchain
    */
    function crossChainTxIsProcessed(bytes32 originalTxHash) public view returns (bool) {
        return processedTx[originalTxHash];
    }
}