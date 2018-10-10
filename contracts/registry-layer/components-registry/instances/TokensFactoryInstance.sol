pragma solidity ^0.4.24;

import "../../tokens-factory/interfaces/ITokensFactory.sol";
import "../getters/TokensFactoryAddress.sol";


/**
* @title Tokens factory instance
* @dev Create ITokensFactory
*/
contract TokensFactoryInstance is TokensFactoryAddress {
    /**
    * @notice Returns tokens factory instance
    */
    function tfInstance() public view returns (ITokensFactory) {
        return ITokensFactory(getTokensFactoryAddress());
    }
}