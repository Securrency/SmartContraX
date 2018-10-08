pragma solidity ^0.4.24;

import "./interfaces/IFromChain.sol";

/**
* @title Provide transfer from the chain
*/
contract FromChain is IFromChain {
    // Store cross chain transaction id
    uint public id = 1;

    /**
    * @notice Write info to the log when cross chain transfer was initiated
    * @param tokenAddress Token address
    * @param sender Tokens owner
    * @param chain Target chain
    * @param targetAddress Recipient wallet in the other chain
    * @param value Amount of tokens || token id for the CAT-721 token
    */
    event SendedToOtherChain(
        address indexed tokenAddress,
        address indexed sender,
        uint indexed txId,
        bytes32 chain,
        bytes32 targetAddress,
        uint value
    );

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
        internal
    {
        uint txId = id;

        id++;

        emit SendedToOtherChain(
            tokenAddress,
            sender,
            txId,
            chain,
            targetAddress,
            value
        );
    }
}