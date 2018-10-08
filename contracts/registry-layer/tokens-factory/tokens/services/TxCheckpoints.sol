pragma solidity ^0.4.24;

import "../../interfaces/ITxCheckpoints.sol";
import "../../../../helpers/Utils.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* @title Transactions checkpoints
*/
contract TxCheckpoints is Utils, ITxCheckpoints {
    // define libraries
    using SafeMath for uint256;

    // Declares variable that stores expiration interval
    uint public expireInterval = 3600;

    // Declares variable that stores checkpoin identifier
    uint id = 1;

    // Structure that describes checkpoint
    struct Checkpoint {
        bytes32 checkpointKey;
        uint expireDate;
        bool used;
    }

    // Declare storage for checkpoints
    mapping(uint => Checkpoint) checkpoints;

    /**
    * @notice Write info to the log when the expire interval was updated
    */
    event ExpireInteravalUpdated(uint oldValue, uint newValue);

    /**
    * @notice Write info to the log when the checkpoint was used
    */
    event CheckpointWasUsed(uint indexed checkpointId, string originalTxHash);

    /**
    * @notice Write info to the log when the checkpoint was created
    */
    event CheckpointCreated(bytes32 indexed checkpointKey, uint indexed checkpointId);

    /**
    * @notice Generate checkpoint key
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
        returns (bytes32)
    {
        address[3] memory addresses = [from, to, sender];
        bytes memory b = new bytes(92);
        bytes memory addBytes;
        
        uint8 bytesIndex = 0;
        for (uint8 i = 0; i < addresses.length; i++) {
            addBytes = addressToBytes(addresses[i]);
            for (uint8 j = 0; j < 20; j++) {
                b[bytesIndex] = addBytes[j];
                bytesIndex++;
            }
        }
        
        bytes memory bytesValue = uintToBytes(value);
        for (i = 0; i < 32; i++) {
            b[bytesIndex] = bytesValue[i];
            bytesIndex++;
        }
        
        return keccak256(b);
    }

    /**
    * @notice Check if checkpoint is active
    * @param checkpointId Checkpoint identifier
    */
    function isActiveCheckpoint(uint checkpointId) public view returns (bool) {
        Checkpoint memory c = checkpoints[checkpointId];
        require(c.expireDate != 0, "Invalid checkpoint.");

        if (!c.used && c.expireDate > now) {
            return true;
        }

        return false;
    }

    /**
    * @notice Update checkpoints expiration time
    * @param newExpirationInterval New expiration interval in seconds
    */
    function updateExpirationTime(uint newExpirationInterval) public {
        emit ExpireInteravalUpdated(expireInterval, newExpirationInterval);

        expireInterval = newExpirationInterval;
    }

    /**
    * @notice Return checkpoint key which was generated in tokens transfer
    * @param checkpointId Checkpoint identifier
    */
    function getCheckpointKey(uint checkpointId) public view returns (bytes32) {
        return checkpoints[checkpointId].checkpointKey;
    }

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
        internal
    {
        bytes32 checkpointKey = generateCheckpoint(
            from,
            to, 
            value, 
            sender
        );

        checkpoints[id] = Checkpoint({
            checkpointKey: checkpointKey,
            expireDate: now.add(expireInterval),
            used: false
        });

        emit CheckpointCreated(checkpointKey, id);

        id++;
    }

    /**
    * @notice Change checkpoint status to not active
    * @param checkpointId Checkpoint identifier
    * @param originalTxHash The hash of the transaction which was canceled or rollbacked 
    */
    function deactivateCheckpoint(uint checkpointId, string originalTxHash) internal {
        require(checkpoints[checkpointId].expireDate != 0, "Invalid checkpoint.");
        require(!checkpoints[checkpointId].used, "Checkpoint is already used.");
        
        checkpoints[checkpointId].used = true;

        emit CheckpointWasUsed(checkpointId, originalTxHash);
    }
}