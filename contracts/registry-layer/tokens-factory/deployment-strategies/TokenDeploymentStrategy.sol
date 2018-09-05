pragma solidity ^0.4.24;

import "../interfaces/ITokenStrategy.sol";

/**
* @title Token deployment Strategy
*/
contract TokenDeploymentStrategy is ITokenStrategy {
    // Address of the Tokens factory
    address tokensFactory;

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
        require(sender == tokensFactory, "Allowed only for the Tokens factory");
        _;
    }

    /**
    * @notice Initialize contract with tokens factory
    */
    constructor(address _tokensFactory) public {
        tokensFactory = _tokensFactory;
    }
}