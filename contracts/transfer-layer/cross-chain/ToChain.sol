pragma solidity ^0.5.0;

import "./interfaces/IToChain.sol";
import "./interfaces/ITCStorage.sol";

/**
* @title Accept tokens from other chain
*/
contract ToChain is IToChain {
    // To chain tranasctions storage
    address tcStorage;

    // Initialize contract with storage
    constructor(address storageAddress) public {
        tcStorage = storageAddress;
    }

    /**
    * @notice Receipt tokens from the other chain
    * @param fromTokenAddress Token address in the previous chain
    * @param sentFrom Sender address in the previous chain
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
        bytes32 sentFrom,
        bytes32 fromChain,
        bytes32 originalTxHash,
        uint value,
        uint txId
    ) 
        internal
    {
        bool txStatus = TCStorage().getOriginalTxStatus(originalTxHash);
        require(!txStatus, "Transaction already processed.");

        TCStorage().updateOriginalTxStatus(originalTxHash, true);

        TCStorage().emitAcceptedFromOtherChain(
            fromTokenAddress,
            recipient,
            txId,
            tokenAddress,
            sentFrom,
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
        return TCStorage().getOriginalTxStatus(originalTxHash);
    }

    /**
    * @notice Returns instance of the to chain transactions storage
    */
    function TCStorage() internal view returns (ITCStorage) {
        return ITCStorage(tcStorage);
    }
}