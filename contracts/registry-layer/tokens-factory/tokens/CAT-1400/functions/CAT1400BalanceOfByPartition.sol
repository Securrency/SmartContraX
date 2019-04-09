pragma solidity >0.4.99 <0.6.0;

import "../CAT1400TokenStorage.sol";


/**
* @title Balance by the partition
*/
contract CAT1400BalanceOfByPartition is CAT1400TokenStorage {
    /**
    * @notice Returns balance of the provided token holder in the specified partition
    * @param partition Partition identifier
    * @param holder Token holder address
    * @dev sig: 0x30e82803
    */
    function balanceOfByPartition(bytes32 partition, address holder) external view returns (uint result) {
        return balances[partition][holder];
    }
}