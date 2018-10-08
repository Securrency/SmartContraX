pragma solidity ^0.4.24;

/**
* @notice Interface for the contract which allows move tokens to the other chain
*/
contract IFromChain {
    /**
    * @notice Move tokens from chain
    * @param tokenAddress Token address
    * @param sender Tokens owner
    * @param chain Target chain
    * @param targetAddress Recipient wallet in the other chain
    * @param value Amount of tokens || token id for the CAT-721 token
    */
    function sendToOtherChain(
        address tokenAddress,
        address sender,
        bytes32 chain,
        bytes32 targetAddress,
        uint value
    ) 
        internal;
}