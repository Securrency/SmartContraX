pragma solidity ^0.4.24;

import "./TokenDeploymentStrategy.sol";
import "../tokens/CAT721Token.sol";
import "../../../request-verification-layer/permission-module/Protected.sol";

/**
* @title CAT-721 token (NFT) deployment strategy
*/
contract CAT721Strategy is TokenDeploymentStrategy, Protected  {
    // Address of the Transfer module
    address transferModule;

    // Token standard
    bytes32 public constant TOKEN_STANDARD = "CAT-721";

    /**
    * @notice initilaze contract
    */
    constructor(address tokensFactory, address permissionModule) 
        public
        TokenDeploymentStrategy(tokensFactory)
        Protected(permissionModule)
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
        address token = new CAT721Token(
            name,
            symbol,
            tokenOwner,
            transferModule,
            pm
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

    /**
    * @notice Set transfer module to the strategy
    */
    function setTransferModule(address _transferModule) 
        public
        verifyPermission(msg.sig, msg.sender)
    {
        require(transferModule == address(0), "Transfer module already initialized.");
        transferModule = _transferModule;
    }
}