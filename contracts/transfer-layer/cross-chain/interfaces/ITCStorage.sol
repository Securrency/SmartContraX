pragma solidity ^0.4.24;


/**
* @title Interface of the to chain transactions
*/
contract ITCStorage {
    /**
    * @notice Write info to the log when cross chain transfer was accepted
    * @param fromTokenAddress Token address in the previous chain
    * @param sentFrom Sender address in the previous chain
    * @param recipient Recipient address
    * @param tokenAddress Token address in the current chain
    * @param fromChain Original chain
    * @param originalTxHash Tx hash which initiate cross chain transfer
    * @param value Amount of tokens || token id for the CAT-721 token
    */
    function emitAcceptedFromOtherChain(
        address fromTokenAddress,
        address recipient,
        uint txId,
        address tokenAddress,
        bytes32 sentFrom,
        bytes32 fromChain,
        bytes32 originalTxHash,
        uint value
    )
        public;

    /**
    * @notice Set processed tranasction status
    * @param originalTxHash Tx hash which initiate cross chain transfer
    * @param status Process status (true - processed | false - not processed)
    */
    function updateOriginalTxStatus(bytes32 originalTxHash, bool status) public;

    /**
    * @notice Returns status of the transaction
    * @param originalTxHash Tx hash which initiate cross chain transfer
    */
    function getOriginalTxStatus(bytes32 originalTxHash) public view returns (bool);
}