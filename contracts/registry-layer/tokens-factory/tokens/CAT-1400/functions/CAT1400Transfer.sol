pragma solidity >0.4.99 <0.6.0;

import "../CAT1400TokenStorage.sol";
import "../../../../../common/libraries/SafeMath.sol";


/**
* @title CAT-1400 Tokens transfer
*/
contract CAT1400Transfer is CAT1400TokenStorage {
    // Define libraries
    using SafeMath for uint256;

    // Write info to the log about tokens transfer
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
    * @notice Write info to the log about tokens transfer in the partition
    * @param fromPartition Partition identifier
    * @param operator Operator address
    * @param from Sender's address
    * @param to Address of the recipient
    * @param value  Number of the transferred tokens
    * @param data Additional data
    * @param operatorData Additional data from the operator
    * @dev https://github.com/ethereum/EIPs/issues/1411
    */
    event TransferByPartition(
        bytes32 indexed fromPartition,
        address operator,
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bytes operatorData
    );

    /**
    * @notice Update balances
    * @param partition Partition identifier
    * @param operator Operator address
    * @param from Sender's address
    * @param to Address of the recipient
    * @param tokens  Number of the transferred tokens
    * @param data Additional data
    * @param operatorData Additional data from the operator
    */
    function _transfer(
        bytes32 partition,
        address operator,
        address from,
        address to,
        uint tokens,
        bytes memory data,
        bytes memory operatorData
    )   
        internal 
        returns (bool)
    {
        require(to != address(0x00), "Invalid recipient address");
        require(tokens > 0x00, "Invalid number of the tokens");
        require(partition != bytes32(0x00), "Invalid partition");

        require(
            balances[partition][from] >= tokensOnEscrow[partition][from].add(tokens),
            "Insufficient funds"
        );

        balances[partition][from] = balances[partition][from].sub(tokens);
        balances[partition][to] = balances[partition][to].add(tokens);

        emit Transfer(from, to, tokens);

        emit TransferByPartition(
            partition,
            operator,
            from,
            to,
            tokens,
            data,
            operatorData
        );

        return true;
    }
}