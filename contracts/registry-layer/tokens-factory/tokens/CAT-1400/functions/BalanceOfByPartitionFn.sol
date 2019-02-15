pragma solidity >0.4.99 <0.6.0;


/**
* @title Balance in the partition
*/
contract BalanceOfByPartitionFn {
    /**
     * @notice Generate storage key for the balances 
     * @dev The positions are found by adding an offset of keccak256(k1 . k2 . p)
     * @dev Balances mapping position in the storage = 0x3EB
     * @dev mapping(bytes32=>mapping(address=>uint256))
     * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
     * @param holder Token holder address
     * @param partition Partition identifier
     * @return hash which represents storage key
     */
    function getBalanceKey(bytes32 partition, address holder) internal pure returns (bytes32 key) {
        bytes memory buffer = new bytes(0x5C);
        assembly {
            mstore(add(buffer, 0x20), partition)
            mstore(add(buffer, 0x40), holder)
            mstore(add(buffer, 0x5C), 0x3EB)
        }
        
        return keccak256(buffer);
    }

    /**
    * @notice Returns balance of the provided token holder in the specified partition
    * @param partition Partition identifier
    * @param holder Token holder address
    * @dev sig: 0x30e82803
    */
    function balanceOfByPartition(bytes32 partition, address holder) external view returns (uint256 result) {
        bytes32 key = getBalanceKey(partition, holder);
        assembly {
            result := sload(key)
        }
    }
}