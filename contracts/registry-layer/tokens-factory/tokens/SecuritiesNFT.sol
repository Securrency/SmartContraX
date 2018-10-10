pragma solidity ^0.4.24;

import "../../../transfer-layer/transfer-module/interfaces/ITransferModule.sol";
import "../../../request-verification-layer/permission-module/Protected.sol";
import "../../components-registry/instances/TransferModuleInstance.sol";
import "./SecuritiesToken.sol";
import "openzeppelin-solidity/contracts/token/ERC721/ERC721Token.sol";

/**
* @title Securities NFT
*/
contract SecuritiesNFT is SecuritiesToken, Protected, TransferModuleInstance, ERC721Token {
    /**
    * @notice Allows create rollback transaction for tokens
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
        updateBalances(from, to, tokens);                                     
    }

    /**
    * @notice Redefinition of the transferFrom function. 
    * @notice Generate addiotional info for rollback
    * @param to The address which you want to transfer to
    * @param tokenId NFT id
    */
    function transferFrom(address from, address to, uint256 tokenId) public {
        bool allowed = tmInstance().verifyTransfer(
            from,
            to,
            msg.sender,
            tokenId
        );

        require(allowed, "Transfer was declined.");
        createCheckpoint(from, to, tokenId, msg.sender);

        super.transferFrom(from, to, tokenId);
    }



    function updateBalances(address from, address to, uint256 tokenId) internal {
        clearApproval(from, tokenId);
        removeTokenFrom(from, tokenId);
        addTokenTo(to, tokenId);

        emit Transfer(from, to, tokenId);
    }
}