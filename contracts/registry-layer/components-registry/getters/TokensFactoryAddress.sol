pragma solidity ^0.5.0;

import "./WithComponentsRegistry.sol";
import "../../tokens-factory/TokensFactoryMetadata.sol";


/**
* @title Tokens Factory address
*/
contract TokensFactoryAddress is WithComponentsRegistry, TokensFactoryMetadata {
    /**
    * @notice Get tokens factory address
    */
    function getTokensFactoryAddress() public view returns (address) {
        return componentsRegistry.getAddressById(TOKENS_FACTORY_ID);
    }
}