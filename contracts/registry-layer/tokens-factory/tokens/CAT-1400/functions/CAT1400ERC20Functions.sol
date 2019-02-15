pragma solidity >0.4.99 <0.6.0;


/**
* @title ERC-20 Token methods
* @notice Contains all methods for backward compatibility with ERC-20 standard
* @dev https://theethereum.wiki/w/index.php/ERC20_Token_Standard
*/
contract CAT1400ERC20Functions {
    /**
    * @notice Write info the log about tokens transfer
    * @param from  Sender address
    * @param to a Recipient address
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
    * @return Total number of tokens in existence
    */
    function totalSupply() public view returns (uint256 _totalSupply) {
      assembly {
          _totalSupply := sload(0x03)
      }
    }
    
    /**
    * @param tokenHolder Token holder address
    * @return Token holder balance
    */
    function balanceOf(address tokenHolder) public view returns (uint256 result) {
        bytes32 partition;
        assembly {
            partition := sload(0x3F0)
        }
        require(
            partition != bytes32(0x00),
            "Backward compatibility with ERC-20 standard is not configured"
        );

        bytes32 storageKey = getBalanceKey(partition, tokenHolder);
        assembly {
            result := sload(storageKey)
        }
    }
    
    /**
    * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
    * @dev Beware that changing an allowance with this method brings the risk that someone may use both the old
    * @dev and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
    * @dev race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
    * @dev https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    * @param spender The address which will spend the funds.
    * @param tokens The number of tokens to be spent.
    */
    function approve(address spender, uint256 tokens) public returns (bool) {
        require(spender != address(0x00), "Invalid spender address.");
        bytes32 partition;
        assembly {
            partition := sload(0x3F0)
        }
        require(
            partition != bytes32(0x00),
            "Backward compatibility with ERC-20 standard is not configured"
        );
        
        address sender = msg.sender;
        bytes32 storageKey = getAllowanceKey(sender, spender);
        bytes32 senderBalanceKey = getBalanceKey(partition, sender);
        
        uint senderBal;
        assembly {
            senderBal := sload(senderBalanceKey)    
        }
        require(senderBal >= tokens, "Insufficiency funds on the balance");
        
        assembly {
            sstore(storageKey, tokens)
            
            let p := mload(0x40)
            mstore(p, tokens)
            // emit Approval(msg.sender, spender, tokens);
            log3(
                p,
                0x20,
                0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925,
                sender,
                spender
            )
        }

        return true;
    }
    
    /**
    * @dev Function to check the number of tokens that an owner allowed to a spender.
    * @param owner address The address which owns the funds.
    * @param spender address The address which will spend the funds.
    * @return A uint256 specifying the number of tokens still available for the spender.
    */
    function allowance(
        address owner,
        address spender
    )
        public
        view
        returns (uint256 tokens)
    {
        bytes32 key = getAllowanceKey(owner, spender);
        assembly {
            tokens := sload(key)   
        }
    }
    
    /**
    * @notice CAT-20 transfer function. 
    * @notice Generate additional info for rollback
    * @param to The address which you want to transfer to
    * @param tokens the number of tokens to be transferred
    */
    function transfer(address to, uint tokens) public returns (bool) {
        require(to != address(0x00), "Invalid recipient address");
        require(tokens > 0x00, "Invalid number of the tokens");
        
        doTransfer(msg.sender, to, tokens);
    }

    /**
    * @notice CAT-20 transferFrom function.
    * @param to The address which you want to transfer to
    * @param tokens The number of tokens to be transferred
    * @param from The address from which will be transferred token
    */
    function transferFrom(
        address from,
        address to,
        uint256 tokens
    )
        public
        returns (bool)
    {
        require(to != address(0x00), "Invalid recipient address");
        require(tokens > 0x00, "Invalid number of the tokens");

        bytes32 allowanceKey = getAllowanceKey(from, msg.sender);
        uint allowedTokens;
        assembly {
            allowedTokens := sload(allowanceKey)
        }
        
        require(allowedTokens >= tokens, "Transfer not allowed");
        
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
    * @param to A recipient address
    * @param tokens The number of tokens to be transferred
    */
    function doTransfer(address from, address to, uint tokens) internal {
        bytes32 partition;
        assembly {
            partition := sload(0x3F0)
        }
        require(
            partition != bytes32(0x00),
            "Backward compatibility with ERC-20 standard is not configured"
        );

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

        writeInfoToTheLog(partition, from, to, tokens);
    }

    /**
    * @notice Write info to the log about transfer
    * @param partition Partition identifier
    * @param from Sender address
    * @param to A recipient address
    * @param value Number of the tokens
    */
    function writeInfoToTheLog(
        bytes32 partition,
        address from,
        address to,
        uint256 value
    )
        internal
    {
        // ERC-20 transfer event
        emit Transfer(from, to, value);

        bytes memory data = new bytes(0x00);
        bytes memory operatorData = new bytes(0x00);

        // ERC-14000 transfer event
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
}