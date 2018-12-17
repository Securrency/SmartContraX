pragma solidity ^0.5.0;

import "../../../../transfer-layer/transfer-module/interfaces/ITransferModule.sol";
import "../../../components-registry/instances/TransferModuleInstance.sol";
import "../_common/MultiChainToken.sol";
import "../_common/SecuritiesToken.sol";
import "../_services/Pausable.sol";
import "../_services/escrow/Escrow.sol";
import "../ERC-20/StandardToken.sol";
import "../../../../common/libraries/SafeMath.sol";


/**
* @title Securities Standart Token
*/
contract SecuritiesStandardToken is MultiChainToken, SecuritiesToken, StandardToken, Pausable, Escrow, TransferModuleInstance {
    // define libraries
    using SafeMath for uint256;

    // Rollback status (Enabled/Disabled)
    bool public rollbackEnabled = false;

    /**
    * @notice Write info to the log about rollbacks status changes
    */
    event RollbacksStatusChanged(bool newStatus);

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
        require(balances[from] >= tokensOnEscrow[from] + tokens, "Insufficient funds.");

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
    * @param checkpointId Transaction checkpoint identifier
    * @param originalTxHash Hash of the original transaction which maked a tokens transfer
    */
    function createRollbackTransaction(
        address from,
        address to,
        address sender,
        uint tokens,
        uint checkpointId,
        string memory originalTxHash
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
        bool result = super.transfer(to, value);

        if (rollbackEnabled && result) {
            createCheckpoint(msg.sender, to, value, msg.sender);
        }
        
        return result;
    }

    /**
    * @notice Redefinition of the ERC-20 standard transferFrom function. 
    * @notice Generate addiotional info for rollback
    * @param to The address which you want to transfer to
    * @param value the amount of tokens to be transferred
    * @param from The address from which will be transferred token
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
        bool result = super.transferFrom(from, to, value);
        
        if (rollbackEnabled && result) {
            createCheckpoint(from, to, value, msg.sender);
        }
        
        return result;
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
    * @notice Process escrow. Provides possibility for move locked token.
    * @notice Provide ability to transfer tokens to another token holder.
    * @param externalId Escrow identifier
    * @param recipient Tokens recipient
    * @param callData Additional data for call
    * @param data Additional data for log
    * @dev If provided escrowAgent must execute external call "CATEscrowProcessed"
    */
    function processEscrow(
        bytes32 externalId,
        address recipient,
        bytes memory callData,
        bytes memory data
    )
        public
    {
        require(externalId.length > 0, "Invalid escrow id.");
        require(recipient != address(0), "Invalid recipient address.");
        
        _processEscrow(
            externalId,
            recipient,
            callData,
            data
        );

        uint escrowId = idsExtIntRelations[externalId];
        updatedBalances(
            escrowList[escrowId].tokenHolder,
            recipient,
            escrowList[escrowId].value
        );
    }

    /**
    * @notice Create new escrow
    * @param tokenHolder Token holder address
    * @param escrowAgent Address (application) on which will be executed call "escrow created"
    * @param value Number of the tokens to lock
    * @param dataForCall Additional data for call
    * @param data Additional data for log
    * @param externalId Transaction initiator can specify external identifier
    * @param canCancel Specifies the type of the lock
    * @param executeCall If equal "true" CAT-20 token send request to the escrow agent
    * @return escrowId Escrow identifier
    */
    function createEscrow(
        address tokenHolder,
        address escrowAgent,
        uint value,
        bytes memory dataForCall,
        bytes memory data,
        bytes32 externalId,
        bool canCancel,
        bool executeCall
    )
        public
        returns (uint)
    {
        require(balances[tokenHolder] >= tokensOnEscrow[tokenHolder] + value, "Insufficient funds on balance.");
        // Verify application
        if (escrowAgent != address(0)) {
            require(arInstance().isRegistredApp(escrowAgent, address(this)), "Escrow agent in not registred in the application registry.");
        }

        return _createEscrow(
            tokenHolder,
            escrowAgent,
            value,
            dataForCall,
            data,
            externalId,
            canCancel,
            executeCall
        );
    }

    /**
    * @notice Enable/Disable rollbacks in the token
    */
    function toggleRollbacksStatus() 
        external
        verifyPermissionForCurrentToken(msg.sig)
    {
        rollbackEnabled = !rollbackEnabled;
        
        emit RollbacksStatusChanged(rollbackEnabled);
    }

    /**
    * @notice Update token holders balances
    * @param from Address from which we rollback tokens
    * @param to Tokens owner
    * @param tokens Quantity of the tokens that will be rollbacked
    */
    function updatedBalances(address from, address to, uint tokens) internal {
        require(balances[from] >= tokensOnEscrow[from] + tokens, "Insufficient funds on balance.");

        balances[from] = balances[from].sub(tokens);
        balances[to] = balances[to].add(tokens);

        emit Transfer(from, to, tokens);
    }
}