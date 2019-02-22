pragma solidity >0.4.99 <0.6.0;

/**
* @title Transfer module interface
*/
contract ITm {
    /**
    * @notice Verify tokens transfer. 
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Transaction initiator
    * @param id Additional identifier
    * @param tokenAddress Address of the token
    */
    function verifyTransferWithId(
        address from,
        address to,
        address sender,
        address tokenAddress,
        bytes32 id
    )
        public
        view
        returns (bool);
}

/**
* @title Transfer by partition
*/
contract CAT1400WLTransferByPartition {
    /**
    * @notice Write info the log about tokens transfer
    * @param from  Sender address
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
    * @param value Number of the transferred tokens
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
    * @notice Verify transfer
    * @param sender Sender address
    * @param to Recipient address
    * @param tokens Tokens to transfer
    */
    modifier allowedTx(
        address sender,
        address to,
        uint tokens,
        bytes32 partition
    ) {
        address tm;
        assembly {
            tm := sload(0x0B)
        }

        //Send request to the transfer module and verify transfer
        bool allowed = ITm(tm).verifyTransferWithId(
            sender,
            to,
            sender,
            address(this),
            partition
        );

        require(allowed, "Transfer was declined by WhiteList");

        _;
    }

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
        allowedTx(
            msg.sender,
            to,
            value,
            partition
        )
        returns (bytes32)
    {
        require(partition != bytes32(0x00), "Invalid partition.");
        require(to != address(0x00), "Invalid recipient address.");
        require(value != 0x00, "Invalid number of the tokens.");

        doTransfer(
            partition,
            to,
            value,
            data
        );

        writeInfoToTheLog(partition, to, value);
    }


    /**
    * @notice Update balances
    * @param partition Partition identifier
    * @param to A recipient address
    * @param value Number of the tokens to transfer
    * @dev https://github.com/ethereum/EIPs/issues/1411
    * @dev sig: 0xf3d490db
    */
    function doTransfer(
        bytes32 partition,
        address to,
        uint256 value,
        bytes memory //data
    )
        internal 
    {
        bytes32 senderKey = getBalanceKey(partition, msg.sender);
        bytes32 recipientKey = getBalanceKey(partition, to);

        uint senderBal;
        uint recipientBal;
        assembly {
            senderBal := sload(senderKey)
            recipientBal := sload(recipientKey)
        }
        require(senderBal >= value, "Insufficiency funds on the balance.");
        assert(recipientBal + value > recipientBal);

        assembly{
            sstore(senderKey, sub(senderBal, value))
            sstore(recipientKey, add(recipientBal, value))
        }
    }

    /**
    * @notice Write info to the log about transfer
    * @param partition Partition identifier
    * @param to A recipient address
    * @param value Number of the tokens
    */
    function writeInfoToTheLog(bytes32 partition, address to, uint256 value) internal {
        // ERC-20 transfer event
        emit Transfer(msg.sender, to, value);

        bytes memory data = new bytes(0x00);
        bytes memory operatorData = new bytes(0x00);

        // ERC-14000 transfer event
        emit TransferByPartition(
            partition,
            address(0x00),
            msg.sender,
            to,
            value,
            data,
            operatorData
        );
    }
}