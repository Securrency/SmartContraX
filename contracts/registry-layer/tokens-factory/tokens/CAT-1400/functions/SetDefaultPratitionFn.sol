pragma solidity >0.4.99 <0.6.0;


/**
* @title Set default partition function
*/
contract SetDefaultPratitionFn {
    /**
    * @notice Write info to the log about default partition update
    * @param partition Partition identitfier
    */
    event DefaultPartitionUpdated(bytes32 indexed partition);

    /**
    * @notice Generate storage key for the partition registration status
    * @dev The positions are found by adding an offset of keccak256(k . p)
    * @dev Partitions status position in the storage = 0x3EE
    * @dev mapping(bytes32=>bool)
    * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
    * @param partition Partition identifier
    * @return hash which represents storage key
    */
    function getPartitionStatusKey(bytes32 partition) internal pure returns (bytes32) {
        bytes memory buffer = new bytes(0x40);
        assembly {
            mstore(add(buffer, 0x20), partition)
            mstore(add(buffer, 0x40), 0x3EE)
        }
        return keccak256(buffer);
    }

    /**
    * @notice Set default partition for backward compatibility with ERC-20 functions
    * @param partition Partition identifier
    * @dev Default partition position in the storage = 0x3F0
    */
    function setDefaultPartition(bytes32 partition) external {
        bool isRegistered;
        bytes32 statusKey = getPartitionStatusKey(partition);
        assembly {
            isRegistered := sload(statusKey)
        }
        require(isRegistered, "Partition is not registered and can't be set as a default.");

        assembly {
            sstore(0x3F0, partition)
        }

        emit DefaultPartitionUpdated(partition);
    }
}