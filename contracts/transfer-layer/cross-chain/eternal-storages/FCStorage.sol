pragma solidity 0.4.24;

import "./BaseStorage.sol";
import "../interfaces/IFCStorage.sol";


/**
* @title From chain transfers storage
*/
contract FCStorage is BaseStorage, IFCStorage {
    // Store cross chain transaction id
    uint internal id = 1;

    /**
    * @notice Write info to the log when cross chain transfer was initiated
    * @param tokenAddress Token address
    * @param sender Tokens owner
    * @param chain Target chain
    * @param targetAddress Recipient wallet in the other chain
    * @param value Amount of tokens || token id for the CAT-721 token
    */
    event SentToOtherChain(
        address indexed tokenAddress,
        address indexed sender,
        uint indexed txId,
        bytes32 chain,
        bytes32 targetAddress,
        uint value
    );

    // Initialize storage
    constructor(address componentsRegistry) 
        public
        WithComponentsRegistry(componentsRegistry) 
    {}

    /**
    * @notice Write info to the log when cross chain transfer was initiated
    * @param tokenAddress Token address
    * @param sender Tokens owner
    * @param chain Target chain
    * @param targetAddress Recipient wallet in the other chain
    * @param value Amount of tokens || token id for the CAT-721 token
    */
    function emitSentToOtherChain(
        address tokenAddress,
        address sender,
        uint txId,
        bytes32 chain,
        bytes32 targetAddress,
        uint value
    )
        public
        onlyTransferModule(msg.sender)
    {
        emit SentToOtherChain(
            tokenAddress,
            sender,
            txId,
            chain,
            targetAddress,
            value
        );
    }

    /**
    * @notice Set transaction id value
    * @param value New transaction id
    */
    function setTransactionId(uint value) 
        public 
        onlyTransferModule(msg.sender)
    {
        id = value;
    }

    /**
    * @notice Returns transaction id
    */
    function getTransactionId() public view returns (uint) {
        return id;
    }
}