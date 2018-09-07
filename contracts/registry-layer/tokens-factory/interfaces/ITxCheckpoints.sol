pragma solidity ^0.4.24;

/**
* @title Transaction checkpoints for rollbacks and transaction cancellations system
*/
contract ITxCheckpoints {
    /**
    * @notice Generate checkpoint
    * @param from Address from
    * @param to Tokens owner
    * @param value Quantity of the tokens in transaction
    * @param sender Transaction initiator
    */
    function generateCheckpoint(
        address from,
        address to, 
        uint value, 
        address sender
    )
        public
        view
        returns (bytes32);

    /**
    * @notice Check if checkpoint is active
    * @param checkpointId Checkpoint identifier
    */
    function isActiveCheckpoint(uint checkpointId) public view returns (bool);

    /**
    * @notice Update checkpoints expiration time
    * @param newExpirationInterval New expiration interval in seconds
    */
    function updateExpirationTime(uint newExpirationInterval) public;

    /**
    * @notice Return checkpoint key which was generated in tokens transfer
    * @param checkpointId Checkpoint identifier
    */
    function getCheckpointKey(uint checkpointId) public view returns (bytes32);

    /**
    * @notice Create checkpoint
    * @param from Address from
    * @param to Tokens owner
    * @param value Quantity of the tokens in transaction
    * @param sender Transaction initiator
    */
    function createCheckpoint(
        address from,
        address to, 
        uint value, 
        address sender
    )
        internal;

    /**
    * @notice Change checkpoint status to not active
    * @param checkpointId Checkpoint identifier
    * @param originalTxHash The hash of the transaction which was canceled or rollbacked 
    */
    function deactivateCheckpoint(uint checkpointId, string originalTxHash) internal;
}