pragma solidity ^0.4.24;

import "./TokenStrategy.sol";
import "../tokens/SLS20Token.sol";

/**
* @title SLS-20 token strategy
*/
contract SLS20Strategy is TokenStrategy  {
    // Token standard
    bytes32 public constant TOKEN_STANDARD = "SLS-20";

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
        returns (address)
    {
        address token = new SLS20Token(
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