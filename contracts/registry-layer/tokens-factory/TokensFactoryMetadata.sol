pragma solidity ^0.4.24;


/**
* @title Tokens Factory metadata
*/
contract TokensFactoryMetadata {
    bytes constant TOKENS_FACTORY_NAME = "TokensFactory";
    bytes4 constant TOKENS_FACTORY_ID = bytes4(keccak256(TOKENS_FACTORY_NAME));
}