pragma solidity 0.4.24;

import "../registry-layer/tokens-factory/deployment-strategies/TokenDeploymentStrategy.sol";
import "../request-verification-layer/permission-module/Protected.sol";
import "../registry-layer/tokens-factory/tokens/CAT20Token.sol";

contract TokenStrategyMock is TokenDeploymentStrategy, Protected {
    // Address of the Transfer module
    address transferModule;
    
    // Token standard
    bytes32 public constant TOKEN_STANDARD = "CAT-00";
    
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
        returns (address)
    {
        address token = new CAT20Token(
            name,
            symbol,
            decimals,
            totalSupply,
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
        transferModule = _transferModule;
    }
}