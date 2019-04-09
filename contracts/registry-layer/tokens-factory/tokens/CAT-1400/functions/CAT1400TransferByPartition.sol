pragma solidity >0.4.99 <0.6.0;

import "./CAT1400Transfer.sol";
import "./verify-transfer/ICAT1400VerifyTransfer.sol";
import "../CAT1400TokenStorage.sol";


/**
* @title CAT1400 Transfer by partition
*/
contract CAT1400TransferByPartition is CAT1400TokenStorage, CAT1400Transfer {
    /**
    * @notice Partition Token Transfer
    * @param partition Partition identifier
    * @param to A recipient address
    * @param value Number of the tokens to transfer
    * @param data Additional transfer data
    * @dev https://github.com/ethereum/EIPs/issues/1411
    * @dev sig: 0xf3d490db
    */
    function transferByPartition(
        bytes32 partition,
        address to,
        uint256 value,
        bytes calldata data
    )
        external
        returns (bytes32)
    {
        ICAT1400VerifyTransfer(address(this)).verifyTransfer(
            msg.sender,
            to,
            msg.sender,
            partition,
            value
        );

        _transfer(
            partition,
            address(0x00),
            msg.sender,
            to,
            value,
            data,
            new bytes(0x00)
        );
    }
}