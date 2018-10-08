pragma solidity ^0.4.24;

/**
* @notice Token which can be transfered to the other chains
*/
contract IMultiChainToken {
    /**
    * @notice Transfer tokens from chain
    * @param value Tokens to be transfered
    * @param chain Target chain name
    * @param recipient Target address 
    */
    function crossChainTransfer(uint value, bytes32 chain, bytes32 recipient) external;

    /**
    * @notice Receive tokens from other chaine
    * @param value Tokens to receive
    * @param chain From chain
    * @param recipient Tokens recipient
    */
    function acceptFromOtherChain(
        uint value,
        bytes32 chain, 
        address recipient, 
        bytes32 sender
    ) 
        public;
}