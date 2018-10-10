pragma solidity ^0.4.24;

import "./TokenDeploymentStrategy.sol";
import "../tokens/ERC20Token.sol";

/**
* @title ERC-20 token deployment strategy
*/
contract ERC20Strategy is TokenDeploymentStrategy  {
    // Token standard
    bytes32 public constant TOKEN_STANDARD = "ERC-20";
    
    /**
    * @notice initilaze contract
    */
    constructor(address _componentsRegistry) 
        public
        WithComponentsRegistry(_componentsRegistry)
    {}

    /**
    * @notice This function create new token depending on his standard
    * @param name Name of the future token
    * @param symbol Symbol of the future token
    * @param decimals The quantity of the future token decimals
    * @param totalSupply The number of coins
    */
    function deploy(
        string name,
        string symbol,
        uint8 decimals,
        uint totalSupply,
        address tokenOwner
    ) 
        public
        onlyTokensFactory(msg.sender)
        returns (address)
    {
        address token = new ERC20Token(
            name,
            symbol,
            decimals,
            totalSupply,
            tokenOwner
        );

        emit CreatedToken(
            name,
            symbol,
            decimals,
            totalSupply,
            token
        );

        return token;
    }

    /**
    * @notice This function returns token standard
    */
    function getTokenStandard() public view returns (bytes32) {
        return TOKEN_STANDARD;
    }
}