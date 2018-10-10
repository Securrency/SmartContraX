pragma solidity ^0.4.24;

import "../../../transfer-layer/transfer-module/interfaces/ITransferModule.sol";
import "../../../request-verification-layer/permission-module/Protected.sol";
import "../../components-registry/instances/TransferModuleInstance.sol";
import "./MultiChainToken.sol";
import "./SecuritiesToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* @title Securities Standart Token
*/
contract SecuritiesStandardToken is MultiChainToken, SecuritiesToken, StandardToken, Protected, TransferModuleInstance {
    // define libraries
    using SafeMath for uint256;

    /**
    * @notice Transfer tokens from chain
    * @param value Tokens to be transfered
    * @param chain Target chain name
    * @param recipient Target address 
    */
    function crossChainTransfer(uint value, bytes32 chain, bytes32 recipient) external {
        require(balances[msg.sender] >= value, "Insufficient funds.");
        require(value > 0, "Invalid value.");

        ITransferModule transferModule = tmInstance();

        bool allowed = transferModule.verifyTransfer(
            msg.sender,
            msg.sender,
            msg.sender,
            value
        );

        require(allowed, "Transfer was declined.");

        balances[msg.sender] = balances[msg.sender].sub(value);
        totalSupply_ = totalSupply_.sub(value);

        emit Transfer(msg.sender, address(0), value);
        emit FromChain(chain, value, msg.sender, recipient);

        transferModule.sendTokensFromChain(
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
    function transfer(address to, uint256 value) public returns (bool) {
        bool allowed = tmInstance().verifyTransfer(
            msg.sender,
            to,
            msg.sender,
            value
        );

        require(allowed, "Transfer was declined.");
        createCheckpoint(msg.sender, to, value, msg.sender);

        return super.transfer(to, value);
    }

    /**
    * @notice Redefinition of the ERC-20 standard transferFrom function. 
    * @notice Generate addiotional info for rollback
    * @param to The address which you want to transfer to
    * @param value the amount of tokens to be transferred
    */
    function transferFrom(address from, address to, uint256 value) public returns (bool) {
        bool allowed = tmInstance().verifyTransfer(
            from,
            to,
            msg.sender,
            value
        );

        require(allowed, "Transfer was declined.");
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