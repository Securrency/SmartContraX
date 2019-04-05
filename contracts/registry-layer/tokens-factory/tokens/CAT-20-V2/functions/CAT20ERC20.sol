pragma solidity >0.4.99 <0.6.0;

import "./CAT20Transfer.sol";
import "./CAT20Paused.sol";
import "./verify-transfer/ICAT20VerifyTransfer.sol";
import "../CAT20TokenStorage.sol";
import "../../../interfaces/ITxCheckpoints.sol";
import "../../../../../common/libraries/SafeMath.sol";


/**
 * @title ERC-20 Token methods
 * @notice Contains all methods for backward compatibility with ERC-20 standard
 * @dev https://theethereum.wiki/w/index.php/ERC20_Token_Standard
 */
contract CAT20ERC20 is CAT20TokenStorage, CAT20Transfer, CAT20Paused {
    // Define libraries
    using SafeMath for uint;
    
    // Write info to the log about tokens transfer
    event Transfer(address indexed from, address indexed to, uint256 value);
    // Write info to the log about approval
    event Approval(address indexed owner, address indexed spender, uint tokens);

    // Write info to the log when the checkpoint was created
    event CheckpointCreated(bytes32 indexed checkpointKey, uint indexed checkpointId);

    /**
    * @return Total number of tokens in existence
    */
    function totalSupply() public view returns (uint256 _totalSupply) {
        return totalSupply_;
    }

    /**
    * @param tokenHolder Token holder address
    * @return Token holder balance
    */
    function balanceOf(address tokenHolder) public view returns (uint256 result) {
        return balances[tokenHolder];
    }
    
    /**
    * @dev Approve the passed address to spend the specified amount of tokens on behalf of msg.sender.
    * @dev Beware that changing an allowance with this method brings the risk that someone may use both the old
    * @dev and the new allowance by unfortunate transaction ordering. One possible solution to mitigate this
    * @dev race condition is to first reduce the spender's allowance to 0 and set the desired value afterwards:
    * @dev https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
    * @param spender The address which will spend the funds.
    * @param tokens The amount of tokens to be spent.
    */
    function approve(address spender, uint256 tokens) public returns (bool) {
        require(spender != address(0x00), "Invalid spender address.");
        
        address sender = msg.sender;
        uint senderBal = balances[sender];
        require(senderBal >= tokens, "Insufficiency funds on the balance.");

        allowed[sender][spender] = tokens;

        emit Approval(sender, spender, tokens);

        return true;
    }
    
    /**
    * @dev Function to check the amount of tokens that an owner allowed to a spender.
    * @param owner address The address which owns the funds.
    * @param spender address The address which will spend the funds.
    * @return A uint256 specifying the amount of tokens still available for the spender.
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
    * @notice CAT-20 transfer function. 
    * @notice Generate addiotional info for rollback
    * @param to The address which you want to transfer to
    * @param tokens the amount of tokens to be transferred
    */
    function transfer(address to, uint tokens) public notPaused() returns (bool) {
        ICAT20VerifyTransfer(address(this)).verifyTransfer(
            msg.sender,
            to,
            msg.sender,
            tokens
        );

        if (rollbackEnabled) {
            createCheckpoint(msg.sender, to, tokens, msg.sender);
        }

        return _transfer(msg.sender, to, tokens);
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
        notPaused()
        returns (bool)
    {
        ICAT20VerifyTransfer(address(this)).verifyTransfer(
            from,
            to,
            msg.sender,
            tokens
        );

        if (rollbackEnabled) {
            createCheckpoint(from, to, tokens, msg.sender);
        }

        return _transferFrom(from, to, tokens);
    }

    /**
    * @notice Batch tokens transfer
    * @param investors Array of the investors
    * @param values Array of the numbers of the tokens for distribution
    */
    function batchTransfer(address[] calldata investors, uint[] calldata values) external {
        for (uint i = 0; i < investors.length; i++) {
            transfer(investors[i], values[i]);
        }
    }

    /**
    * @notice Create checkpoint
    * @param from Address from
    * @param to Tokens owner
    * @param value Quantity of the tokens in transaction
    * @param sender Transaction initiator
    */
    function createCheckpoint(
        address from,
        address to, 
        uint value, 
        address sender
    )
        internal
    {
        bytes32 checkpointKey = ITxCheckpoints(address(this)).generateCheckpoint(
            from,
            to, 
            value, 
            sender
        );

        checkpoints[txCheckpointId] = Checkpoint({
            checkpointKey: checkpointKey,
            expireDate: now.add(txCheckpointexpirationInterval),
            used: false
        });

        emit CheckpointCreated(checkpointKey, txCheckpointId);

        txCheckpointId = txCheckpointId.add(1);
    }
}