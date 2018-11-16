pragma solidity ^0.5.0;

import "../../interfaces/IMultiChainToken.sol";


/**
* @title Multi chain token
*/
contract MultiChainToken is IMultiChainToken {
    // Emit when cross chain transfer was processed
    event FromChain(bytes32 chain, uint value, address indexed sender, bytes32 recipient);

    // Emit when tokens was received from other chain
    event ToChain(bytes32 fromChain, uint value, address indexed recipient, bytes32 sender);
}