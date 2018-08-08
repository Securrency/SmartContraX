pragma solidity ^0.4.24;

import "./interfaces/ISymbolRegistry.sol";
import "./interfaces/ITokensFactory.sol";
import "./interfaces/ITokenStrategy.sol";
import "./helpers/Utils.sol";

/**
* @title Factory of the tokens
*/
contract TokensFactory is ITokensFactory, Utils {
    // Symbol Registry address
    address symbolRegistry;

    // Initialize the storage which will store supported tokens tandards
    bytes32[] internal supportedStandards;

    // Describe tokens deployment strategy
    struct TokenStrategy {
        address strategyAddress;
        uint index;
    }

    // Declare storge for tokens strategies
    mapping(bytes32 => TokenStrategy) internal tokensStrategies;

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
        string name,
        string symbol,
        uint8 decimals,
        uint totalSupply,
        bytes32 standard,
        address tokenAddress
    );

    /**
    * @notice Add symbol registry
    */
    constructor(address _symbolRegistry) public {
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
    {
        address strategy = tokensStrategies[tokenStandard].strategyAddress;

        require(bytes(name).length > 0, "Name length should always greater 0.");
        require(strategy != address(0), "Token strategy not found.");
        require(totalSupply > 0, "Total supply should always greater 0.");
        
        symbol = toUpper(symbol);
        
        address token = ITokenStrategy(strategy).deploy(
            name,
            symbol,
            decimals,
            totalSupply,
            msg.sender
        );
        
        ISymbolRegistry(symbolRegistry).registerTokenToTheSymbol(
            msg.sender,
            bytes(symbol),
            token
        );

        emit CreatedToken(
            name,
            symbol,
            decimals,
            totalSupply,
            tokenStandard,
            token
        );
    }

    /**
    * @notice This function loads new strategy to the tokens factory
    * @param tokenStrategy Address of the strategy contract
    */
    function addTokenStrategy(address tokenStrategy) public {
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
    function removeTokenStrategy(bytes32 standard) public {
        require(tokensStrategies[standard].strategyAddress != address(0), "Strategy not found.");

        uint index = tokensStrategies[standard].index;
        address removedStrategy = tokensStrategies[standard].strategyAddress;
        
        if (supportedStandards.length > 1) {
            bytes32 standardToUpdate = supportedStandards[supportedStandards.length - 1];

            supportedStandards[index] = standardToUpdate;
            tokensStrategies[standardToUpdate].index = index;
        }

        delete supportedStandards[index];
        supportedStandards.length--;

        delete tokensStrategies[standard];
        
        emit StrategyRemoved(standard, removedStrategy);
    }

    /**
    * @notice Update strategy in tokens factory
    * @param standard Token standard which will be updated on the new strategy
    * @param tokenStrategyNew New strategy
    */
    function updateTokenStrategy(bytes32 standard, address tokenStrategyNew) public {
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
}