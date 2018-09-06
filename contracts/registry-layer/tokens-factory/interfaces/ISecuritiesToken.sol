pragma solidity ^0.4.24;

/**
* @title Securities token interface
*/
contract ISecuritiesToken {
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
        returns (bool);

    /**
    * @notice Return token issuer address
    */
    function getIssuerAddress() public view returns (address);
}