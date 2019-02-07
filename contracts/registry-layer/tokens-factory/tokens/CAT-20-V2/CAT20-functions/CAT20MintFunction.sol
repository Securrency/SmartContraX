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
* @title CAT-20 Mint function
*/
contract CAT20MintFunction {
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
    * @notice Function to mint tokens
    * @param to The address that will receive the minted tokens
    * @param tokens The amount of tokens to mint
    */
    function mint(address to, uint tokens)
        public
        verifyPermission(msg.sig, msg.sender)
    {
        bytes32 key = getBalanceKey(to);

        uint totalSupply;
        assembly {
            totalSupply := sload(0x03)
        }

        uint newTotalSupply = totalSupply + tokens;
        assert(newTotalSupply >= totalSupply);

        assembly {
            let recipientBal := sload(key)
            sstore(key, add(recipientBal, tokens))
            
            // update total supply
            sstore(0x03, newTotalSupply)

            let p := mload(0x40)
            mstore(p, tokens)
        
            // Transfer event
            log3(
                p,
                0x20,
                0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef,
                0x00,
                to
            )
            // mint event
            log2(
                p,
                0x20,
                0x0f6798a560793a54c3bcfe86a93cde1e73087d944c0ea20544137d4121396885,
                to
            )
        }
    }
}