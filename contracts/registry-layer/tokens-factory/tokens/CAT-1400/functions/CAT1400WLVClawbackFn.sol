pragma solidity >0.4.99 < 0.6.0;


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
* @title Permission module interface
*/
contract IPM {
    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    * @param subId Additional role identifier
    */
    function allowedForTokenWithSubId(
        bytes4 methodId,
        address sender,
        address token,
        bytes32 subId
    ) 
        public
        view
        returns (bool);
}

/**
* @title CAT-1400 Clawback with whitelist verification
*/
contract CAT1400WLVClawbackFn {
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
    * @notice Verify transfer
    * @param to Recipient address
    * @param tokens Tokens to transfer
    */
    modifier allowedTx(
        address to,
        uint tokens,
        bytes32 partition
    ) {
        address tm;
        assembly {
            tm := sload(0x0B)
        }

        // Send request to the transfer module and verify transfer
        bool allowed = ITm(tm).verifyTransferWithId(
            to,
            to,
            to,
            address(this),
            partition
        );

        require(allowed, "Transfer was declined");

        _;
    }

    /**
    * @notice Verify permission for the method and sender wallet
    * @param method Requested method
    * @param sender Transaction sender address
    * @param partition Partition identitfier
    */
    modifier verifyPermission(bytes4 method, address sender, bytes32 partition) {
        address pm;
        assembly {
            pm := sload(0x0A)
        }
        require(
            IPM(pm).allowedForTokenWithSubId(
                method,
                sender,
                address(this),
                partition
            ),
            "Declined by Permission Module"
        );

        _;
    }

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
        verifyPermission(msg.sig, msg.sender, partition) 
        allowedTx(to, tokens, partition)
    {
        updateBalances(from, to, tokens, partition);
        writeInfoToTheLog(from, to, tokens, partition);
    }

    /**
    * @notice Updates balances
    * @param from Address from which tokens will be removed
    * @param to The recipient address
    * @param tokens Value which will be transferred
    * @param partition Partition identifier
    */
    function updateBalances(
        address from,
        address to,
        uint tokens,
        bytes32 partition
    )
        internal
    {
        bytes32 senderKey = getBalanceKey(partition, from);
        bytes32 recipientKey = getBalanceKey(partition, to);

        uint senderBal;
        uint recipientBal;
        assembly {
            senderBal := sload(senderKey)
            recipientBal := sload(recipientKey)
        }
        require(senderBal >= tokens, "Insufficiency funds on the balance");
        assert(recipientBal + tokens > recipientBal);

        assembly{
            sstore(senderKey, sub(senderBal, tokens))
            sstore(recipientKey, add(recipientBal, tokens))
        }
    }

    /**
    * @notice Write info to the log about transfer
    * @param from Sender address
    * @param to A recipient address
    * @param value Number of the tokens
    * @param partition Partition identifier
    */
    function writeInfoToTheLog(
        address from,
        address to,
        uint256 value,
        bytes32 partition
    )
        internal
    {
        // ERC-20 transfer event
        emit Transfer(from, to, value);

        bytes memory data = new bytes(0x00);
        bytes memory operatorData = new bytes(0x00);

        // ERC-1400 transfer event
        emit TransferByPartition(
            partition,
            address(0x00),
            from,
            to,
            value,
            data,
            operatorData
        );

        // CAT-1400 clawback event
        emit TransferByPartition(
            partition,
            address(0x00),
            from,
            to,
            value,
            data,
            operatorData
        );
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
}