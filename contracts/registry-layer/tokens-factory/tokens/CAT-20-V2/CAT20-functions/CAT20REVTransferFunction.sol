pragma solidity >0.4.99 <0.6.0;


/**
* @title Transfer module interface
*/
contract ITm {
    /**
    * @notice Verify tokens transfer by the rules engine
    * @param from The address transfer from
    * @param to The address transfer to
    * @param sender Transaction initiator
    * @param tokens The amount of tokens to be transferred 
    */
    function checkCAT20TransferThroughRE(
        address from,
        address to,
        address sender,
        uint tokens
    )
        public
        returns (bool);
}

/**
* @title CAT-20 Transfer and transferFrom functions with white list verification
*/
contract CAT20REVTransferFunction {
    /**
    * @notice Verify transfer
    * @param from Address from which tokens will be removed
    * @param to Recipient address
    * @param sender Address of the transaction initiator
    * @param tokens Tokens to transfer
    */
    modifier allowedTx(
        address from,
        address to,
        address sender,
        uint tokens
    ) {
        address tm;
        assembly {
            tm := sload(0x0B)
        }

        // Send request to the transfer module and verify transfer
        bool allowed = ITm(tm).checkCAT20TransferThroughRE(
            from,
            to,
            sender,
            tokens
        );

        require(allowed, "Transfer was declined.");

        _;
    }

    /**
     * @notice Generate storage key for the balances 
     * @dev The positions are found by adding an offset of keccak256(k . p)
     * @dev Balances mapping position in the storage = 0x3E8
     * @dev mapping(address=>uint256)
     * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
     * @param holder Token holder address
     * @return hash which represents storage key
     */
    function getBalanceKey(address holder) internal pure returns (bytes32 key) {
        bytes memory buffer = new bytes(0x40);
        assembly {
            mstore(add(buffer, 0x20), holder)
            mstore(add(buffer, 0x40), 0x3E8)
        }
        
        return keccak256(buffer);
    }
    
    /**
     * @notice Generate storage key for tokens allowance
     * @dev The positions are found by adding an offset of keccak256(k1 . k2 . p)
     * @dev Mapping of the allowances position in the storage = 0x3EA
     * @dev mapping(address=>mapping(address=>uint256))
     * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
     * @param a1 The address which owns the funds
     * @param a2 The address which will spend the funds.
     * @return hash which represents storage key
     */
    function getAllowanceKey(address a1, address a2) public pure returns (bytes32 key) {
        bytes memory buffer = new bytes(0x5C);
        assembly {
            mstore(add(buffer, 0x20), a1)
            mstore(add(buffer, 0x40), a2)
            mstore(add(buffer, 0x5C), 0x3EA)
        }
        
        return keccak256(buffer);
    }

    /**
    * @notice CAT-20 transfer function. 
    * @notice Generate addiotional info for rollback
    * @param to The address which you want to transfer to
    * @param tokens the amount of tokens to be transferred
    */
    function transfer(address to, uint tokens) 
        public
        allowedTx(
            msg.sender,
            to,
            msg.sender,
            tokens
        )
        returns (bool) 
    {
        require(to != address(0x00), "Invalid recipient address.");
        require(tokens > 0x00, "Invalid number of the tokens.");
        
        doTransfer(msg.sender, to, tokens);
    }

    /**
    * @notice CAT-20 transferFrom function.
    * @param to The address which you want to transfer to
    * @param tokens the amount of tokens to be transferred
    * @param from The address from which will be transferred token
    */
    function transferFrom(
        address from,
        address to,
        uint256 tokens
    )
        public
        allowedTx(
            from,
            to,
            msg.sender,
            tokens
        )
        returns (bool)
    {
        require(to != address(0x00), "Invalid recipient address.");
        require(tokens > 0x00, "Invalid number of the tokens.");

        bytes32 allowanceKey = getAllowanceKey(from, msg.sender);
        uint allowedTokens;
        assembly {
            allowedTokens := sload(allowanceKey)
        }
        
        require(allowedTokens >= tokens, "Transfer not allowed.");
        
        doTransfer(from, to, tokens);

        assembly {
            // allowed tokens
            sstore(allowanceKey, sub(allowedTokens, tokens))
        }
        
        return true;
    }

    /**
    * @notice Update balances 
    * @param from Sender address
    * @param to Recipient address
    * @param tokens the amount of tokens to be transferred
    */
    function doTransfer(address from, address to, uint tokens) internal {
        bytes32 storageKeySender = getBalanceKey(from);
        bytes32 storageKeyRecipient = getBalanceKey(to);
        
        uint senderBal;
        assembly {
            senderBal := sload(storageKeySender)    
        }
        require(senderBal >= tokens, "Insufficiency funds on the balance.");

        uint recipientBal;
        assembly {
            recipientBal := sload(storageKeyRecipient)
        }
        
        uint newRecipientBalance = recipientBal + tokens;
        assert(newRecipientBalance >= recipientBal);

        assembly {
            sstore(storageKeySender, sub(senderBal, tokens))
            sstore(storageKeyRecipient, newRecipientBalance)
            
            let p := mload(0x40)
            mstore(p, tokens)
            log3(
                p,
                0x20,
                0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,
                from,
                to
            )
        }
    }
}