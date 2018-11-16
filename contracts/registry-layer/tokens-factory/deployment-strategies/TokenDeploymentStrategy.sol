pragma solidity ^0.5.0;

import "../interfaces/ITokenStrategy.sol";
import "../../components-registry/getters/TokensFactoryAddress.sol";

/**
* @title Token deployment Strategy
*/
contract TokenDeploymentStrategy is TokensFactoryAddress, ITokenStrategy {
    // Emit when created new token
    event CreatedToken(
        string name,
        string symbol,
        uint8 decimals,
        uint totalSupply,
        address tokenAddress
    );

    /**
    * @notice Werify address
    * @param sender Sender address
    */
    modifier onlyTokensFactory(address sender) {
        address tokensFactory = getTokensFactoryAddress();
        require(sender == tokensFactory, "Allowed only for the Tokens factory");
        _;
    }
}