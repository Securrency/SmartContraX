pragma solidity ^0.5.0;

import "./interfaces/IFromChain.sol";
import "./interfaces/IFCStorage.sol";

/**
* @title Provide transfer from the chain
*/
contract FromChain is IFromChain {
    // Address of the from chain transactions storage
    address fcStorage;

    // Initialize contract with strage address
    constructor(address storageAddress) public {
        fcStorage = storageAddress;
    }

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
        uint txId = FCStorage().getTransactionId();
        uint newId = txId++;

        FCStorage().setTransactionId(newId);

        FCStorage().emitSentToOtherChain(
            tokenAddress,
            sender,
            txId,
            chain,
            targetAddress,
            value
        );
    }

    /**
    * @notice Returns instance of the from chain transactions storage
    */
    function FCStorage() internal view returns (IFCStorage) {
        return IFCStorage(fcStorage);
    }
}