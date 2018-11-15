pragma solidity ^0.4.24;

import "../../../../transfer-layer/transfer-module/interfaces/ITransferModule.sol";
import "../../../components-registry/instances/TransferModuleInstance.sol";
import "../_common/MultiChainToken.sol";
import "../_common/SecuritiesToken.sol";
import "../_services/Pausable.sol";
import "../_services/FungibleTokensHolder.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
* @title Securities Standart Token
*/
contract SecuritiesStandardToken is MultiChainToken, SecuritiesToken, StandardToken, Pausable, FungibleTokensHolder, TransferModuleInstance {
    // define libraries
    using SafeMath for uint256;

    /**
    * @notice Write details about clawback to the log
    * @param from Address from which tokens will be removed
    * @param to Recipient address
    * @param tokens Tokens to transfer
    * @param data Any additional info about transfer
    */
    event Clawback(address indexed from, address indexed to, uint tokens, bytes32 data);

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
        require(balances[from] >= tokensOnHold[from] + tokens, "Insufficient funds.");

        bool allowed = tmInstance().verifyTransfer(
            from,
            to,
            sender,
            tokens
        );

        require(allowed, "Transfer was declined.");

        _;
    }

    /**
    * @notice Transfer tokens from chain
    * @param value Tokens to be transfered
    * @param chain Target chain name
    * @param recipient Target address 
    */
    function crossChainTransfer(uint value, bytes32 chain, bytes32 recipient) 
        external
        notPaused()
        allowedTx(
            msg.sender,
            msg.sender,
            msg.sender,
            value
        )
    {
        require(value > 0, "Invalid value.");

        balances[msg.sender] = balances[msg.sender].sub(value);
        totalSupply_ = totalSupply_.sub(value);

        emit Transfer(msg.sender, address(0), value);
        emit FromChain(chain, value, msg.sender, recipient);

        tmInstance().sendTokensFromChain(
            msg.sender,
            chain,
            recipient,
            value
        );
    }

    /**
    * @notice Allows create rollback transaction for ERC-20 tokens
    * @notice tokens will be send back to the old owner, will be emited "RollbackTransaction" event
    * @param from Address from which we rollback tokens
    * @param to Tokens owner
    * @param sender Original transaction sender
    * @param tokens Quantity of the tokens that will be rollbacked
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    function createRollbackTransaction(
        address from,
        address to,
        address sender,
        uint tokens,
        uint checkpointId,
        string originalTxHash
    )
        public
        verifyPermissionForCurrentToken(msg.sig)
        txRollback(
            from,
            to,
            tokens,
            sender,
            checkpointId,
            originalTxHash
        )
        returns (bool)
    {
        updatedBalances(from, to, tokens);

        return true;
    }

    /**
    * @notice Redefinition of the ERC-20 standard transfer function. 
    * @notice Generate addiotional info for rollback
    * @param to The address which you want to transfer to
    * @param value the amount of tokens to be transferred
    */
    function transfer(address to, uint256 value) 
        public
        notPaused()
        allowedTx(
            msg.sender,
            to,
            msg.sender,
            value
        )
        returns (bool)
    {
        createCheckpoint(msg.sender, to, value, msg.sender);

        return super.transfer(to, value);
    }

    /**
    * @notice Redefinition of the ERC-20 standard transferFrom function. 
    * @notice Generate addiotional info for rollback
    * @param to The address which you want to transfer to
    * @param value the amount of tokens to be transferred
    */
    function transferFrom(address from, address to, uint256 value) 
        public
        notPaused()
        allowedTx(
            from,
            to,
            msg.sender,
            value
        )
        returns (bool) 
    {
        createCheckpoint(from, to, value, msg.sender);

        return super.transferFrom(from, to, value);
    }

    /**
    * @notice Receive tokens from other chaine
    * @param value Tokens to receive
    * @param chain From chain
    * @param recipient Tokens recipient
    * @param sender Sender address
    */
    function acceptFromOtherChain(uint value, bytes32 chain, address recipient, bytes32 sender) public {
        address transferModule = getTransferModuleAddress();
        require(msg.sender == transferModule, "Only transfer module.");

        balances[recipient] = balances[recipient].add(value);
        totalSupply_ = totalSupply_.add(value);

        emit Transfer(address(0), recipient, value);
        emit ToChain(chain, value, recipient, sender);
    }

    /**
    * @notice Clawback method which provides an allowance for the issuer 
    * @notice to move tokens between any accounts
    * @param from Address from which tokens will be removed
    * @param to Recipient address
    * @param tokens Tokens to transfer
    * @param data Any additional info about transfer
    */
    function clawback(
        address from,
        address to,
        uint tokens,
        bytes32 data
    )
        external
        verifyPermissionForCurrentToken(msg.sig)
        allowedTx(
            from,
            to,
            msg.sender,
            tokens
        )
    {
        require(to != address(0), "Invalid recipient address.");

        updatedBalances(from, to, tokens);

        emit Clawback(from, to, tokens, data);
    }

    /**
    * @notice Allows for the issuer account move tokens on hold
    * @param tokenHolder Token holder account
    * @param amount Number of tokens that will be moved on hold
    * @param data Additional info
    */
    function moveTokensOnHold(address tokenHolder, uint amount, bytes32 data) 
        external
        verifyPermissionForCurrentToken(msg.sig) 
    {
        require(balances[tokenHolder] >= amount, "Insufficient funds on balance.");
        _moveTokensOnHold(tokenHolder, amount, data);
    }

    /**
    * @notice Update token holders balances
    * @param from Address from which we rollback tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be rollbacked
    */
    function updatedBalances(address from, address to, uint tokens) internal {
        require(tokens <= balances[from], "Insufficient funds on balance.");

        balances[from] = balances[from].sub(tokens);
        balances[to] = balances[to].add(tokens);

        emit Transfer(from, to, tokens);
    }
}