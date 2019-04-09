pragma solidity >0.4.99 <0.6.0;

import "./CAT1400Transfer.sol";
import "./verify-transfer/ICAT1400VerifyTransfer.sol";
import "../CAT1400TokenStorage.sol";


/**
* @title ERC-20 Token methods
* @notice Contains all methods for backward compatibility with ERC-20 standard
* @dev https://theethereum.wiki/w/index.php/ERC20_Token_Standard
*/
contract CAT1400ERC20 is CAT1400TokenStorage, CAT1400Transfer {
    /**
    * @notice Write info the log about tokens transfer
    * @param from  Sender address
    * @param to a Recipient address
    * @param value Number of the transferred tokens
    * @dev Implemented for backward compatibility with ERC-20
    * @dev https://theethereum.wiki/w/index.php/ERC20_Token_Standard
    */
    event Transfer(address indexed from, address indexed to, uint256 value);

    // Write info to the log about approval
    event Approval(address indexed owner, address indexed spender, uint tokens);

    /**
    * @return Total number of tokens in existence
    */
    function totalSupply() public view returns (uint) {
      return _totalSupply;
    }
    
    /**
    * @param tokenHolder Token holder address
    * @return Token holder balance
    */
    function balanceOf(address tokenHolder) public view returns (uint result) {
        uint balanceByPartition = 0;
        for (uint i = 0; i < partitions.length; i++) {
            balanceByPartition = balances[partitions[i]][tokenHolder];
            result = result.add(balanceByPartition);
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
        
        uint senderBal = balanceOf(msg.sender);
        require(senderBal >= tokens, "Insufficiency funds on the balance.");

        allowed[msg.sender][spender] = tokens;

        emit Approval(msg.sender, spender, tokens);

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
        return allowed[owner][spender];
    }
    
    /**
    * @notice ERC-20 transfer function. 
    * @notice Generate additional info for rollback
    * @param to The address which you want to transfer to
    * @param tokens the number of tokens to be transferred
    */
    function transfer(address to, uint tokens) public returns (bool) {
        doTransfer(msg.sender, to, tokens);
    }

    /**
    * @notice ERC-20 transferFrom function.
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
        uint allowedTokens = allowed[from][msg.sender];
        require(allowedTokens >= tokens, "Transfer not allowed");

        allowed[from][msg.sender] = allowedTokens.sub(tokens);

        doTransfer(from, to, tokens);
        
        return true;
    }

    /**
    * @notice Update balances 
    * @param from Sender address
    * @param to A recipient address
    * @param tokens The number of tokens to be transferred
    */
    function doTransfer(address from, address to, uint tokens) internal {
        uint transferred;
        uint balance;
        uint toTransfer;
        for (uint i = 0; i < partitions.length; i++) {
            if (transferred == tokens) {
                break;
            }

            toTransfer = tokens.sub(transferred);
            balance = balances[partitions[i]][from].sub(tokensOnEscrow[partitions[i]][from]);
            if (balance < toTransfer) {
                toTransfer = toTransfer.sub(toTransfer.sub(balance));
            }

            ICAT1400VerifyTransfer(address(this)).verifyTransfer(
                from,
                to,
                msg.sender,
                partitions[i],
                toTransfer
            );

            _transfer(
                partitions[i],
                address(0x00),
                from,
                to,
                toTransfer,
                new bytes(0x00),
                new bytes(0x00)
            );

            transferred = transferred.add(toTransfer);
        }

        require(transferred == tokens, "Insufficient funds");
    }
}