pragma solidity 0.4.24;

import "../registry-layer/tokens-factory/deployment-strategies/TokenDeploymentStrategy.sol";
import "../registry-layer/tokens-factory/tokens/SLS20Token.sol";

contract TokenStrategyMock is TokenDeploymentStrategy {
    // Address of the Transfer module
    address transferModule;
    
    // Token standard
    bytes32 public constant TOKEN_STANDARD = "SLS-00";
    
    /**
    * @notice initilaze contract
    */
    constructor(address tokensFactory) 
        public
        TokenDeploymentStrategy(tokensFactory)
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
        address token = new SLS20Token(
            name,
            symbol,
            decimals,
            totalSupply,
            tokenOwner,
            transferModule
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
    function setTransferModule(address _transferModule) public {
        transferModule = _transferModule;
    }
}