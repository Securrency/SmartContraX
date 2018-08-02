pragma solidity ^0.4.24;

import "../interfaces/ISecuritiesToken.sol";
import "../services/TxCheckpoints.sol";

/**
* @title Securities Token
*/
contract SecuritiesToken is TxCheckpoints, ISecuritiesToken {
    // Declare varaible that stores token issuer address
    address issuer;

    constructor(address _issuer) public {
        issuer = _issuer;
    }

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
    * @notice Describe event of the "cancel transaction" and write info to the log
    * @param from Address from which we write off tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be transfered in "cancel transaction"
    * @param checkpointId Checkpoint identifier
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    event CancelTransaction(
        address from,
        address to,
        uint tokens,
        uint checkpointId,
        string originalTxHash

    );

    /**
    * @notice Modifier for securities tokens rollback functions
    * @param from Address from which we rollback tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be rollbacked
    * @param checkpointId Checkpoint identifier
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    modifier txRollback(
        address from,
        address to,
        uint tokens,
        address sender,
        uint checkpointId,
        string originalTxHash
    ) {
        // TODO add verification with system account
        // after permission module implementation
        processCheckpoint(
            from,
            to,
            tokens,
            sender,
            checkpointId,
            originalTxHash
        );

        _;

        emit RollbackTransaction(
            from,
            to,
            tokens,
            checkpointId,
            originalTxHash
        );
    }

    /**
    * @notice Modifier for securities tokens cancellation functions
    * @param from Address from which we write off tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be rollbacked
    * @param checkpointId Checkpoint identifier
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    modifier txCancellation(
        address from,
        address to,
        uint tokens,
        address sender,
        uint checkpointId,
        string originalTxHash
    ) {
         processCheckpoint(
            from,
            to,
            tokens,
            sender,
            checkpointId,
            originalTxHash
        );

        _;

        emit CancelTransaction(
            from,
            to,
            tokens,
            checkpointId,
            originalTxHash
        );
    }

    /**
    * @notice Verify and deactivate transaction checkpoin
    * @param from Address from which we write off tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be rollbacked
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    function processCheckpoint(
        address from,
        address to,
        uint tokens,
        address sender,
        uint checkpointId,
        string originalTxHash
    )
        internal
    {
        bytes32 generatedCheckpointKey = generateCheckpoint(
            to,
            from,
            tokens,
            sender
        );

        bytes32 checkpointKey = getCheckpointKey(checkpointId);

        require(generatedCheckpointKey == checkpointKey, "Invalid input parameters.");

        require(isActiveCheckpoint(checkpointId), "Checkpoint is already used or expired.");

        deactivateCheckpoint(checkpointId, originalTxHash);
    }

    /**
    * Return token issuer address
    */
    function getIssuerAddress() public view returns (address) {
        return issuer;
    }
}