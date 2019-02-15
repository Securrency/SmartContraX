pragma solidity ^0.5.0;

import "./TokenDeploymentStrategy.sol";
import "../tokens/CAT-1400/CAT1400Token.sol";
import "../../../request-verification-layer/permission-module/Protected.sol";


/**
* @title CAT-1400 token deployment strategy
*/
contract CAT1400Strategy is TokenDeploymentStrategy, Protected  {
    // Token standard
    bytes32 public constant TOKEN_STANDARD = "CAT-1400";

    // Token setup smart contract
    address setup;

    /**
    * @notice initilaze contract
    */
    constructor(address componentsRegistry, address setupContract)
        public
        WithComponentsRegistry(componentsRegistry)
    {
        setup = setupContract;
    }

    /**
    * @notice This function creates new token depending on his standard
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
        address
    )
        public
        onlyTokensFactory(msg.sender)
        returns (address)
    {
        CAT1400Token token = new CAT1400Token(
            name,
            symbol,
            decimals,
            setup
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
    * @notice This function returns a token standard
    */
    function getTokenStandard() public view returns (bytes32) {
        return TOKEN_STANDARD;
    }
}