pragma solidity 0.4.24;

import "./SecuritiesToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
* @title Securities Standart Token
*/
contract SecuritiesStandardToken is SecuritiesToken, StandardToken {
    /**
    * @notice Allows create rollback transaction for ERC-20 tokens
    * @notice tokens will be send back to the old owner, will be emited "RollbackTransaction" event
    * @param from Address from which we rollback tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be rollbacked
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    function createRollbackTransaction(
        address from,
        address to,
        uint tokens,
        uint checkpointId,
        string originalTxHash
    )
        public
        txRollback(
            from,
            to,
            tokens,
            msg.sender,
            checkpointId,
            originalTxHash
        )
        returns (bool)
    {
        balances[from] -= tokens;
        balances[to] += tokens;

        return true;
    }

    /**
    * @notice Allows create transaction for cancelling ERC-20 tokens transfer
    * @notice tokens will be send back to the old owner, will be emited "CancelTransaction" event
    * @param from Address from which we write off tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be transfered in "cancel transaction"
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    function createCancellationTransaction(
        address from,
        address to,
        uint tokens,
        uint checkpointId,
        string originalTxHash
    ) 
        public
        txCancellation(
            from,
            to,
            tokens,
            msg.sender,
            checkpointId,
            originalTxHash
        )
        returns (bool)
    {
        balances[from] -= tokens;
        balances[to] += tokens;

        return true;
    }

    /**
    * @notice Redefinition of the ERC-20 standard transfer function. 
    * @notice Generate addiotional info for rollback and transaction cancellation
    * @param to The address which you want to transfer to
    * @param value the amount of tokens to be transferred
    */
    function transfer(address to, uint256 value) public returns (bool) {
        createCheckpoint(msg.sender, to, value, msg.sender);

        return super.transfer(to, value);
    }
}