pragma solidity 0.4.24;

import "../../../transfer-layer/transfer-module/interfaces/ITransferModule.sol";
import "../../../request-verification-layer/permission-module/Protected.sol";
import "./SecuritiesToken.sol";
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

/**
* @title Securities Standart Token
*/
contract SecuritiesStandardToken is SecuritiesToken, StandardToken, Protected {
    // // Address of the Transfer module
    address public transferModule;
    
    /**
    * @notice Set Transfer module address to the token
    */
    constructor(address _transferModule) public {
        transferModule = _transferModule;
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
        verifyPermissionForCurrentToken(msg.sig, msg.sender)
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
        bool allowed = ITransferModule(transferModule).verifyTransfer(
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
        bool allowed = ITransferModule(transferModule).verifyTransfer(
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
    * @notice Update token holders balances
    * @param from Address from which we rollback tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be rollbacked
    */
    function updatedBalances(address from, address to, uint tokens) internal {
        require(tokens <= balances[from], "Insufficient funds on balance.");

        balances[from] -= tokens;
        balances[to] += tokens;

        emit Transfer(from, to, tokens);
    }
}