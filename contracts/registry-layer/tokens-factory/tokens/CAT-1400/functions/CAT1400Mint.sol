pragma solidity >0.4.99 <0.6.0;

import "./CAT1400Protected.sol";
import "./verify-transfer/ICAT1400VerifyTransfer.sol";
import "../../../../../common/libraries/SafeMath.sol";


/**
* @title CAT-1400 mint function
*/
contract CAT1400Mint is CAT1400Protected {
    // Define libraries
    using SafeMath for uint;

    /**
    * @notice Write info the log about tokens transfer
    * @param from Sender address
    * @param to A recipient address
    * @param value Number of the transferred tokens
    * @dev Implemented for backward compatibility with ERC-20
    * @dev https://theethereum.wiki/w/index.php/ERC20_Token_Standard
    */
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
    * @notice Write info to the log about new partition
    * @param partition Partition identifier
    */
    event PartitionCreated(bytes32 indexed partition);

    /**
    * @notice Mint tokens to the partition
    * @param partition Partition identifier
    * @param to A recipient address
    * @param value Number of the tokens to mint
    * @dev sig: 0x06a69bfc
    */
    function mintByPartition(bytes32 partition, address to, uint256 value) 
        external
        verifyPermissionByPartition(msg.sig, msg.sender, partition)
    {
        require(partition != bytes32(0x00), "Invalid partition");
        require(to != address(0x00), "Invalid recipient address");
        require(value != 0x00, "Invalid number of the tokens");

        ICAT1400VerifyTransfer(address(this)).verifyTransfer(
            to,
            to,
            to,
            partition,
            value
        );

        balances[partition][to] = balances[partition][to].add(value);

        registerPartitionIfNotRegistred(partition);
        _totalSupply = _totalSupply.add(value);
        _totalSupplyByPartition[partition] = _totalSupplyByPartition[partition].add(value);

        writeInfoToTheLog(partition, to, value);
    }

    /**
    * @notice Register partition in the partitions list
    * @param partition Partition identifier
    */
    function registerPartitionIfNotRegistred(bytes32 partition) internal returns (bool) {
        if (registeredPartitions[partition]) {
            return false;
        }

        uint index = partitions.length.add(1);

        registeredPartitions[partition] = true;
        partitionIndex[partition] = index;
        partitions.push(partition);

        emit PartitionCreated(partition);

        return true;
    }

    /**
    * @notice Write info to the log about transfer
    * @param partition Partition identifier
    * @param to A recipient address
    * @param value Number of the tokens
    * @dev https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
    * @dev https://github.com/ethereum/EIPs/issues/1400
    */
    function writeInfoToTheLog(bytes32 partition, address to, uint256 value) internal {
        // ERC-20 transfer event
        emit Transfer(address(0x00), to, value);

        // ERC-1400 transfer event
        emit TransferByPartition(
            partition,
            address(0x00),
            address(0x00),
            to,
            value,
            new bytes(0x00),
            new bytes(0x00)
        );
    }
}