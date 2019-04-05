pragma solidity >0.4.99 <0.6.0;

import "./CAT20Protected.sol";
import "../../../interfaces/ITxCheckpoints.sol";
import "../../../../../common/libraries/BytesHelper.sol";
import "../../../../../common/libraries/SafeMath.sol";


/**
* @title Transactions checkpoints
*/
contract CAT20TxCheckpoint is CAT20Protected {
    // Define libraries
    using SafeMath for uint256;
    using BytesHelper for address;
    using BytesHelper for uint;

    // Write info to the log when the expire interval was updated
    event CheckointExpireInteravalUpdated(uint oldValue, uint newValue);

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
        pure
        returns (bytes32)
    {
        address[3] memory addresses = [from, to, sender];
        bytes memory b = new bytes(92);
        bytes memory addBytes;
        
        uint8 bytesIndex = 0;
        for (uint8 i = 0; i < addresses.length; i++) {
            addBytes = addresses[i].addressToBytes();
            for (uint8 j = 0; j < 20; j++) {
                b[bytesIndex] = addBytes[j];
                bytesIndex++;
            }
        }
        
        bytes memory bytesValue = value.uintToBytes();
        for (uint8 i = 0; i < 32; i++) {
            b[bytesIndex] = bytesValue[i];
            bytesIndex++;
        }
        
        return keccak256(b);
    }

    /**
    * @notice Update checkpoints expiration time
    * @param newExpirationInterval New expiration interval in seconds
    */
    function updateExpirationTime(uint newExpirationInterval)
        public
        verifyPermission(msg.sig, msg.sender)
    {
        emit CheckointExpireInteravalUpdated(txCheckpointexpirationInterval, newExpirationInterval);

        txCheckpointexpirationInterval = newExpirationInterval;
    }

    /**
    * @notice Check if checkpoint is active
    * @param checkpointId Checkpoint identifier
    */
    function isActiveCheckpoint(uint checkpointId) public view returns (bool) {
        Checkpoint memory c = checkpoints[checkpointId];
        require(c.expireDate != 0, "Invalid checkpoint");

        if (!c.used && c.expireDate > now) {
            return true;
        }

        return false;
    }

    /**
    * @notice Return checkpoint key which was generated in tokens transfer
    * @param checkpointId Checkpoint identifier
    */
    function getCheckpointKey(uint checkpointId) public view returns (bytes32) {
        return checkpoints[checkpointId].checkpointKey;
    }
}