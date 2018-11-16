pragma solidity ^0.5.0;

import "../../../../transfer-layer/transfer-module/interfaces/ITransferModule.sol";
import "../../../../request-verification-layer/permission-module/Protected.sol";
import "../../../components-registry/instances/TransferModuleInstance.sol";
import "../_common/SecuritiesToken.sol";
import "../ERC-721/ERC721Token.sol";

/**
* @title Securities NFT
*/
contract SecuritiesNFT is SecuritiesToken, Protected, TransferModuleInstance, ERC721Token {
    /**
    * @notice Write details about clawback to the log
    * @param from Address from which tokens will be removed
    * @param to The recipient address
    * @param token Token identifier
    * @param data Any additional info about transfer
    */
    event Clawback(address indexed from, address indexed to, uint token, bytes32 data);

    /**
    * @notice Verify transfer
    * @param from Address from which tokens will be removed
    * @param to The recipient address
    * @param sender Address of the transaction initiator
    * @param token Token identifier
    */
    modifier allowedTx(
        address from,
        address to,
        address sender,
        uint token
    ) {
        bool allowed = tmInstance().verifyTransfer(
            from,
            to,
            sender,
            token
        );

        require(allowed, "Transfer was declined.");

        _;
    }

    /**
    * @notice Allows create rollback transaction for tokens
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
        updateBalances(from, to, tokens);                                     
    }

    /**
    * @notice Redefinition of the transferFrom function. 
    * @notice Generate addiotional info for rollback
    * @param to The address which you want to transfer to
    * @param tokenId NFT id
    */
    function transferFrom(address from, address to, uint256 tokenId) 
        public
        allowedTx(
            from,
            to,
            msg.sender,
            tokenId
        ) 
    {
        createCheckpoint(from, to, tokenId, msg.sender);

        super.transferFrom(from, to, tokenId);
    }

    /**
    * @notice Clawback method which provides an allowance for the issuer 
    * @notice to move tokens between any accounts
    * @param from Address from which tokens will be removed
    * @param to The recipient address
    * @param token Token identifier
    * @param data Any additional info about transfer
    */
    function clawback(
        address from,
        address to,
        uint token,
        bytes32 data
    )
        external
        verifyPermissionForCurrentToken(msg.sig)
        allowedTx(
            from,
            to,
            msg.sender,
            token
        )
    {
        require(to != address(0), "Invalid recipient address.");

        updateBalances(from, to, token);

        emit Clawback(from, to, token, data);
    }

    /**
    * @notice Update token holders balances
    * @param from Address from which we rollback tokens
    * @param to Tokens owner
    * @param tokenId Token identifier
    */
    function updateBalances(address from, address to, uint256 tokenId) internal {
        clearApproval(from, tokenId);
        removeTokenFrom(from, tokenId);
        addTokenTo(to, tokenId);

        emit Transfer(from, to, tokenId);
    }
}