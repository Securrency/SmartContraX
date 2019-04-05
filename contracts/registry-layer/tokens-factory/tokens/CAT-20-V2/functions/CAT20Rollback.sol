pragma solidity >0.4.99 <0.6.0;

import "./CAT20Protected.sol";
import "./CAT20Transfer.sol";
import "../../../interfaces/ITxCheckpoints.sol";
import "../../../../../common/libraries/SafeMath.sol";


/**
* @title CAT-20 Rollback
*/
contract CAT20Rollback is CAT20Protected, CAT20Transfer {
    // Define libraries
    using SafeMath for uint;

    // Write info to the log about rollbacks status changes
    event RollbacksStatusChanged(bool newStatus);

    // Write info to the log when the checkpoint was used
    event CheckpointWasUsed(uint indexed checkpointId, string originalTxHash);

    /**
    * @notice Describe event of the "rollback transaction" and write info to the log
    * @param from Address from which we rollback tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be rollbacked
    * @param checkpointId Checkpoint identifier
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    event RollbackTransaction(
        address from,
        address to,
        uint tokens,
        uint checkpointId,
        string originalTxHash
    );

    /**
    * @notice Allows create rollback transaction for ERC-20 tokens
    * @notice tokens will be send back to the old owner, will be emited "RollbackTransaction" event
    * @param from Address from which we rollback tokens
    * @param to Tokens owner
    * @param sender Original transaction sender
    * @param tokens Quantity of the tokens that will be rollbacked
    * @param checkpointId Transaction checkpoint identifier
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    function createRollbackTransaction(
        address from,
        address to,
        address sender,
        uint tokens,
        uint checkpointId,
        string memory originalTxHash
    )
        public
        verifyPermission(msg.sig, msg.sender)
        returns (bool)
    {
        processCheckpoint(
            from,
            to,
            tokens,
            sender,
            checkpointId,
            originalTxHash
        );

        emit RollbackTransaction(
            from,
            to,
            tokens,
            checkpointId,
            originalTxHash
        );

        return _transfer(from, to, tokens);
    }

    /**
    * @notice Enable/Disable rollbacks in the token
    */
    function toggleRollbacksStatus() 
        external
        verifyPermission(msg.sig, msg.sender)
    {
        rollbackEnabled = !rollbackEnabled;
        
        emit RollbacksStatusChanged(rollbackEnabled);
    }

    /**
    * @notice Verify and deactivate transaction checkpoin
    * @param from Address from which we write off tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be rollbacked
    * @param sender Transaction initiator
    * @param checkpointId Transaction checkpoint identifier
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    function processCheckpoint(
        address from,
        address to,
        uint tokens,
        address sender,
        uint checkpointId,
        string memory originalTxHash
    )
        internal
    {
        bytes32 generatedCheckpointKey = ITxCheckpoints(address(this)).generateCheckpoint(
            to,
            from,
            tokens,
            sender
        );

        bytes32 checkpointKey = ITxCheckpoints(address(this)).getCheckpointKey(checkpointId);

        require(generatedCheckpointKey == checkpointKey, "Invalid input parameters");

        require(
            ITxCheckpoints(address(this)).isActiveCheckpoint(checkpointId),
            "Checkpoint is already used or expired"
        );

        deactivateCheckpoint(checkpointId, originalTxHash);
    }

    /**
    * @notice Change checkpoint status to not active
    * @param checkpointId Checkpoint identifier
    * @param originalTxHash The hash of the transaction which was canceled or rollbacked 
    */
    function deactivateCheckpoint(uint checkpointId, string memory originalTxHash) internal {
        require(checkpoints[checkpointId].expireDate != 0, "Invalid checkpoint.");
        require(!checkpoints[checkpointId].used, "Checkpoint is already used.");
        
        checkpoints[checkpointId].used = true;

        emit CheckpointWasUsed(checkpointId, originalTxHash);
    }
}