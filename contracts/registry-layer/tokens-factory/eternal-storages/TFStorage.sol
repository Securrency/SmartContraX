pragma solidity ^0.5.0;

import "../interfaces/ITFStorage.sol";
import "../../components-registry/getters/TokensFactoryAddress.sol";

/**
* @title Tokens factory eternal storage
*/
contract TFStorage is TokensFactoryAddress, ITFStorage {
    // Describe tokens deployment strategy
    struct TokenStrategy {
        address strategyAddress;
        uint index;
    }

    // Initialize the storage which will store supported tokens tandards
    bytes32[] internal supportedStandards;

    // Declare storge for tokens strategies
    mapping(bytes32 => TokenStrategy) internal tokensStrategies;

    // Declare storage for registered tokens
    mapping(address => bytes32) internal registeredTokens;

    // Declare storage for issuers
    mapping(address => address) internal issuers;

    // Emit when added new token strategy
    event StrategyAdded(bytes32 standard, address indexed strategy);

    // Emit when token strategy removed from tokens factory
    event StrategyRemoved(bytes32 standard, address indexed strategy);

    // Emit when strategy was updates
    event StrategyUpdated(
        bytes32 standard,
        address indexed oldStrategy,
        address indexed newStrategy
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

    // Verify address. Compore with Tokens Factory address
    modifier onlyTokensFactory(address sender) {
        address tokensFactory = getTokensFactoryAddress();
        require(sender == tokensFactory, "Allowed only for the Tokens Factory.");
        _;
    }

    /**
    * @notice Initialize contract
    */
    constructor(address componentsRegistry) 
        public 
        WithComponentsRegistry(componentsRegistry)
    {}

    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Tokens Factory.

    // Emit when added new token strategy
    function emitStrategyAdded(bytes32 standard, address strategy) 
        public
        onlyTokensFactory(msg.sender)
    {
        emit StrategyAdded(standard, strategy);
    }

    // Emit when token strategy removed from tokens factory
    function emitStrategyRemoved(bytes32 standard, address strategy) 
        public
        onlyTokensFactory(msg.sender) 
    {
        emit StrategyRemoved(standard, strategy);
    }

    // Emit when strategy was updates
    function emitStrategyUpdated(
        bytes32 standard,
        address oldStrategy,
        address newStrategy
    )
        public
        onlyTokensFactory(msg.sender)
    {
        emit StrategyUpdated(standard, oldStrategy, newStrategy);
    }

    // Emit when created new token
    function emitCreatedToken(
        address tokenAddress,
        address issuer,
        string memory name,
        string memory symbol,
        bytes memory issuerName,
        uint8 decimals,
        uint totalSupply,
        bytes32 standard
    )
        public
        onlyTokensFactory(msg.sender)
    {
        emit CreatedToken(
            tokenAddress,
            issuer,
            name,
            symbol,
            issuerName,
            decimals,
            totalSupply,
            standard 
        );
    }

    /// Methods which updates the storage. Allowed only for the Tokens Factory.

    /**
    * @notice Add token deployment strategy
    * @param strategyAddress Deployment strategy address
    * @param standard Token standard
    * @param index Index in the strategies list
    */
    function saveDeploymentStrategy(
        address strategyAddress,
        bytes32 standard,
        uint index
    ) 
        public
        onlyTokensFactory(msg.sender)
    {
        TokenStrategy memory strategy = TokenStrategy({
            strategyAddress: strategyAddress,
            index: index
        });

        tokensStrategies[standard] = strategy;
    }

    /**
    * @notice Add issuer address
    * @param issuerAddress Address of the token issuer
    * @param tokenAddress Token address
    */
    function setIssuerForToken(
        address issuerAddress, 
        address tokenAddress
    ) 
        public
        onlyTokensFactory(msg.sender)
    {
        issuers[tokenAddress] = issuerAddress;
    }

    /**
    * @notice Save token with token standard
    * @param tokenAddress Token address
    * @param standard Standard of the token
    */
    function setTokenStandard(address tokenAddress, bytes32 standard) 
        public 
        onlyTokensFactory(msg.sender)
    {
        registeredTokens[tokenAddress] = standard;
    }

    /**
    * @notice Add new strategy
    * @param standard Deployment strategy address
    */
    function addDeploymentStrategy(bytes32 standard) 
        public
        onlyTokensFactory(msg.sender)
    {
        supportedStandards.push(standard);
    }

    /**
    * @notice Set deployment strategy on the specific index
    * @param standard Deployment strategy
    * @param index Index which will be updated
    */
    function updateStrategyByindex(bytes32 standard, uint index) 
        public
        onlyTokensFactory(msg.sender)
    {
        supportedStandards[index] = standard;
    }

    /**
    * @notice Update address of the deployment strategy
    * @param standard Deployment strategy
    * @param newAddress Address of the new token deployemnt strategy 
    */
    function updateStrategyAddress(bytes32 standard, address newAddress) 
        public
        onlyTokensFactory(msg.sender)
    {
        tokensStrategies[standard].strategyAddress = newAddress;
    }

    /**
    * @notice Update index of the deployment strategy
    * @param standard Deployment strategy
    * @param index New index
    */
    function updateStrategyIndex(bytes32 standard, uint index) 
        public
        onlyTokensFactory(msg.sender)
    {
        tokensStrategies[standard].index = index;
    }

    /**
    * @notice Update supported standarts length
    * @param newLength New array length
    */
    function updateSupportedStandardsLength(uint newLength) 
        public
        onlyTokensFactory(msg.sender)
    {
        supportedStandards.length = newLength;
    }

    /**
    * @notice Remove deployment strategy from the list
    * @param index Index of the deployment strategy which will be removed
    */
    function removeStandard(uint index) 
        public
        onlyTokensFactory(msg.sender)
    {
        delete supportedStandards[index];
    }

    /**
    * @notice Remove deployment strategy
    * @param standard Standard which will be removed
    */
    function removeDeploymentStrategy(bytes32 standard) 
        public
        onlyTokensFactory(msg.sender)
    {
        delete tokensStrategies[standard];
    }

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns the number of standards supported.
    */
    function supportedStandardsLength() public view returns (uint) {
        return supportedStandards.length;
    }

    /**
    * @notice Get supported standard by index
    * @param index Index of the standard in the array
    */
    function getStandardByIndex(uint index) public view returns (bytes32) {
        return supportedStandards[index];
    }

    /**
    * @notice Returns deployment strategy index
    * @param standard Standard of the deployment strategy
    */
    function getStandardIndex(bytes32 standard) public view returns (uint) {
        return tokensStrategies[standard].index;
    }

    /**
    * @notice Reurns deployment strategy address
    * @param standard Standard of the deployment strategy
    */
    function getStandardAddress(bytes32 standard) public view returns (address) {
        return tokensStrategies[standard].strategyAddress;
    }

    /**
    * @notice Returns standard of the token
    * @param token Address of the token
    */
    function getTokenStandard(address token) public view returns (bytes32) {
        return registeredTokens[token];
    }

    /**
    * @notice Returns address of the token issuer
    * @param token Token address
    */
    function getIssuerAddress(address token) public view returns (address) {
        return issuers[token];
    }
}