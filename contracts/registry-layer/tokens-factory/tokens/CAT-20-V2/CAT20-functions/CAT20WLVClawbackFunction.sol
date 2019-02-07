pragma solidity >0.4.99 <0.6.0;


/**
* @title Permission module interface
*/
contract IPM {
    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    */
    function allowed(bytes4 methodId, address sender, address token) public view returns (bool);
}

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
    * @param tokens The amount of tokens to be transferred 
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        uint tokens
    )
        public
        view
        returns (bool);
}

/**
* @notice CAT-20 Clawback method
*/
contract CAT20WLVClawbackFunction {
    /**
    * @notice Verify permission for the method and sender wallet
    * @param method Requested method
    * @param sender Transaction sender address
    */
    modifier verifyPermission(bytes4 method, address sender) {
        address pm;
        assembly {
            pm := sload(0x0A)
        }
        require(IPM(pm).allowed(method, sender, address(this)), "Declined by Permission Module.");
        _;
    }

    /**
    * @notice Verify transfer
    * @param to Recipient address
    * @param tokens Tokens to transfer
    */
    modifier allowedTx(
        address to,
        uint tokens
    ) {
        address tm;
        assembly {
            tm := sload(0x0B)
        }

        // Send request to the transfer module and verify transfer
        bool allowed = ITm(tm).verifyTransfer(
            to,
            to,
            to,
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
    * @notice Clawback method which provides an allowance for the issuer 
    * @notice to move tokens between any accounts
    * @param from Address from which tokens will be removed
    * @param to The recipient address
    * @param tokens Value which will be transferred
    */
    function clawback(address from, address to, uint tokens) 
        public
        verifyPermission(msg.sig, msg.sender) 
        allowedTx(to, tokens)
    {
        require(to != address(0x00), "Invalid recipient address.");
        require(tokens > 0x00, "Invalid number of the tokens.");
        
        doTransfer(from, to, tokens);
    }

    /**
    * @notice Transfer tokes
    * @param from Address from which tokens will be removed
    * @param to The recipient address
    * @param tokens Value which will be transferred
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
        uint newRecipientBal = recipientBal + tokens;
        assert(newRecipientBal >= recipientBal);

        assembly {
            sstore(storageKeySender, sub(senderBal, tokens))
            sstore(storageKeyRecipient, add(newRecipientBal, tokens))
            
            let p := mload(0x40)
            mstore(p, tokens)
            log3(
                p,
                0x20,
                0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,
                from,
                to
            )
            log3(
                p,
                0x20,
                0x4145fe9a9b7e548b5f40c159d85370dd1da89ac5c2d7d14cc6c85df3aea812e1,
                from,
                to
            )
        }
    }
}