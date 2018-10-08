pragma solidity ^0.4.24;

import "./interfaces/ITokensFactory.sol";
import "./interfaces/ITokenStrategy.sol";
import "../symbol-registry/interfaces/ISymbolRegistry.sol";
import "../../helpers/Utils.sol";
import "../../request-verification-layer/permission-module/Protected.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* @title Factory of the tokens
*/
contract TokensFactory is ITokensFactory, Utils, Protected {
    // define libraries
    using SafeMath for uint256;

    // Symbol Registry address
    address symbolRegistry;

    // Initialize the storage which will store supported tokens tandards
    bytes32[] supportedStandards;

    // Describe tokens deployment strategy
    struct TokenStrategy {
        address strategyAddress;
        uint index;
    }

    // Declare storge for tokens strategies
    mapping(bytes32 => TokenStrategy) tokensStrategies;

    // Declare storage for registered tokens
    mapping(address => bytes32) registeredTokens;

    // Declare storage for issuers
    mapping(address => address) issuers;

    // Emit when added new token strategy
    event StrategyAdded(bytes32 standard, address strategy);

    // Emit when token strategy removed from tokens factory
    event StrategyRemoved(bytes32 standard, address strategy);

    // Emit when strategy was updates
    event StrategyUpdated(
        bytes32 indexed standard,
        address oldStrategy,
        address newStrategy
    );

    // Emit when created new token
    event CreatedToken(
        address indexed tokenAddress,
        address indexed issuer,
        string name,
        string symbol,
        bytes issuerName,
        uint8 decimals,
        uint totalSupply,
        bytes32 standard
    );

    /**
    * @notice Add symbol registry
    */
    constructor(address _symbolRegistry, address _permissionModule) 
        public 
        Protected(_permissionModule) 
    {
        symbolRegistry = _symbolRegistry;
    }

    /**
    * @notice This function create new token depending on his standard
    * @param name Name of the future token
    * @param symbol Symbol of the future token
    * @param decimals The quantity of the future token decimals
    * @param totalSupply The number of coins
    * @param tokenStandard Identifier of the token standard
    */
    function createToken(
        string name,
        string symbol,
        uint8 decimals,
        uint totalSupply,
        bytes32 tokenStandard
    ) 
        public
        verifyPermission(msg.sig, msg.sender)
    {
        address strategy = tokensStrategies[tokenStandard].strategyAddress;

        require(bytes(name).length > 0, "Name length should always greater 0.");
        require(strategy != address(0), "Token strategy not found.");
        
        symbol = toUpper(symbol);

        bytes memory bytesSymbol = bytes(symbol);
        address token = ISymbolRegistry(symbolRegistry).getTokenBySymbol(bytesSymbol);
        require(token == address(0), "Token with this symbol already registered.");

        token = ITokenStrategy(strategy).deploy(
            name,
            symbol,
            decimals,
            totalSupply,
            msg.sender
        );
        
        ISymbolRegistry(symbolRegistry).registerTokenToTheSymbol(
            msg.sender,
            bytesSymbol,
            token
        );

        registeredTokens[token] = tokenStandard;
        issuers[token] = msg.sender;

        bytes memory issuerName = ISymbolRegistry(symbolRegistry).getIssuerNameBySymbol(bytesSymbol);

        emit CreatedToken(
            token,
            msg.sender,
            name,
            symbol,
            issuerName,
            decimals,
            totalSupply,
            tokenStandard
        );
    }

    /**
    * @notice This function loads new strategy to the tokens factory
    * @param tokenStrategy Address of the strategy contract
    */
    function addTokenStrategy(address tokenStrategy)
        public
        verifyPermission(msg.sig, msg.sender)
    {
        bytes32 standard = ITokenStrategy(tokenStrategy).getTokenStandard();

        require(standard != bytes32(""), "Invalid tokens strategy.");
        require(
            tokensStrategies[standard].strategyAddress == address(0),
            "Strategy already present."
        );
        
        uint index = supportedStandards.length;
        supportedStandards.push(standard);

        tokensStrategies[standard] = TokenStrategy({
            strategyAddress: tokenStrategy,
            index: index
        });

        emit StrategyAdded(standard, tokenStrategy);
    }

    /**
    * @notice Remove strategy from tokens factory
    * @param standard Token standard which will be removed
    */
    function removeTokenStrategy(bytes32 standard) 
        public
        verifyPermission(msg.sig, msg.sender) 
    {
        require(tokensStrategies[standard].strategyAddress != address(0), "Strategy not found.");

        uint index = tokensStrategies[standard].index;
        address removedStrategy = tokensStrategies[standard].strategyAddress;
        
        if (supportedStandards.length > 1) {
            uint last = supportedStandards.length.sub(1);
            bytes32 standardToUpdate = supportedStandards[last];

            supportedStandards[index] = standardToUpdate;
            tokensStrategies[standardToUpdate].index = index;
        }

        delete supportedStandards[index];
        supportedStandards.length = supportedStandards.length.sub(1);

        delete tokensStrategies[standard];
        
        emit StrategyRemoved(standard, removedStrategy);
    }

    /**
    * @notice Update strategy in tokens factory
    * @param standard Token standard which will be updated on the new strategy
    * @param tokenStrategyNew New strategy
    */
    function updateTokenStrategy(bytes32 standard, address tokenStrategyNew) 
        public 
        verifyPermission(msg.sig, msg.sender) 
    {
        require(tokenStrategyNew != address(0), "Invalid address of the new token strategy.");
        require(tokensStrategies[standard].strategyAddress != address(0), "Strategy not found.");
        
        tokensStrategies[standard].strategyAddress = tokenStrategyNew;

        emit StrategyUpdated(standard, tokenStrategyNew, tokenStrategyNew);
    }

    /**
    * @notice Return an array of supported tokens standards
    */
    function getSupportedStandards() public view returns (bytes32[]) {
        return supportedStandards;
    }

    /**
    * @notice Returns standard of the registered token 
    * @param tokenAddress Address of registered token
    */
    function getTokenStandard(address tokenAddress) public view returns (bytes32) {
        return registeredTokens[tokenAddress];
    }

    /**
    * @notice Returns token issuer address
    * @param token Token address
    */
    function getIssuerByToken(address token) public view returns (address) {
        return issuers[token];
    }

    /**
    * @notice Verify if is supported requested standard
    * @param standard A standard for verification
    */
    function isSupported(bytes32 standard) public view returns (bool) {
        return tokensStrategies[standard].strategyAddress != address(0);
    }
}