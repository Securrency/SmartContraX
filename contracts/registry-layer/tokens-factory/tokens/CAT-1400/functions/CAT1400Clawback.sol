pragma solidity >0.4.99 < 0.6.0;

import "./CAT1400Protected.sol";
import "./CAT1400Transfer.sol";
import "./verify-transfer/ICAT1400VerifyTransfer.sol";


/**
* @title CAT-1400 Clawback
*/
contract CAT1400Clawback is CAT1400Protected, CAT1400Transfer {
    /**
    * @notice Write info to the log about clawback in the partition
    * @param fromPartition Partition identifier
    * @param operator Operator address
    * @param from Sender's address
    * @param to Address of the recipient
    * @param value Number of the transferred tokens
    * @param data Additional data
    * @param operatorData Additional data from the operator
    */
    event ClawbackByPartition(
        bytes32 indexed fromPartition,
        address operator,
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bytes operatorData
    );

    /**
    * @notice Allows the transfer agent to move tokens
    * @param from Address from which tokens will be removed
    * @param to The recipient address
    * @param tokens Value which will be transferred
    * @param partition Partition identifier
    */
    function clawbackByPartition(
        address from,
        address to,
        uint tokens,
        bytes32 partition
    )
        public
        verifyPermissionByPartition(msg.sig, msg.sender, partition)
    {
        ICAT1400VerifyTransfer(address(this)).verifyTransfer(
            to,
            to,
            to,
            partition,
            tokens
        );

        _transfer(
            partition,
            address(0x00),
            from,
            to,
            tokens,
            new bytes(0x00),
            new bytes(0x00)
        );

        emit ClawbackByPartition(
            partition,
            address(0x00),
            from,
            to,
            tokens,
            new bytes(0x00),
            new bytes(0x00)
        );
    }
}