pragma solidity ^0.5.0;

import "./TokenDeploymentStrategy.sol";
import "../tokens/CAT-20/CAT20Token.sol";
import "../../../request-verification-layer/permission-module/Protected.sol";


/**
* @title CAT-20 token deployment strategy
*/
contract CAT20Strategy is TokenDeploymentStrategy, Protected  {
    // Token standard
    bytes32 public constant TOKEN_STANDARD = "CAT-20";

    /**
    * @notice initilaze contract
    */
    constructor(address componentsRegistry) 
        public
        WithComponentsRegistry(componentsRegistry)
    {}

    /**
    * @notice This function create new token depending on his standard
    * @param name Name of the future token
    * @param symbol Symbol of the future token
    * @param decimals The quantity of the future token decimals
    * @param totalSupply The number of coins
    */
    function deploy(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint totalSupply,
        address tokenOwner
    ) 
        public
        onlyTokensFactory(msg.sender)
        returns (address)
    {
        CAT20Token token = new CAT20Token(
            name,
            symbol,
            decimals,
            totalSupply,
            tokenOwner,
            address(componentsRegistry)
        );

        emit CreatedToken(
            name,
            symbol,
            decimals,
            totalSupply,
            address(token)
        );

        return address(token);
    }

    /**
    * @notice This function returns token standard
    */
    function getTokenStandard() public view returns (bytes32) {
        return TOKEN_STANDARD;
    }
}