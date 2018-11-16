pragma solidity ^0.5.0;


/**
* @title Interface of the tokens factory eternal storage
*/
contract ITFStorage {
    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Tokens Factory.

    // Emit when added new token strategy
    function emitStrategyAdded(bytes32 standard, address strategy) public;

    // Emit when token strategy removed from tokens factory
    function emitStrategyRemoved(bytes32 standard, address strategy) public;

    // Emit when strategy was updates
    function emitStrategyUpdated(
        bytes32 standard,
        address oldStrategy,
        address newStrategy
    )
        public;

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
        public;

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
        public;

    /**
    * @notice Add issuer address
    * @param issuerAddress Address of the token issuer
    * @param tokenAddress Token address
    */
    function setIssuerForToken(
        address issuerAddress, 
        address tokenAddress
    ) 
        public;

    /**
    * @notice Save token with token standard
    * @param tokenAddress Token address
    * @param standard Standard of the token
    */
    function setTokenStandard(address tokenAddress, bytes32 standard) public;

    /**
    * @notice Add new strategy
    * @param standard Deployment strategy address
    */
    function addDeploymentStrategy(bytes32 standard) public;

    /**
    * @notice Set deployment strategy on the specific index
    * @param standard Deployment strategy
    * @param index Index which will be updated
    */
    function updateStrategyByindex(bytes32 standard, uint index) public;

    /**
    * @notice Update address of the deployment strategy
    * @param standard Deployment strategy
    * @param newAddress Address of the new token deployemnt strategy 
    */
    function updateStrategyAddress(bytes32 standard, address newAddress) public;

    /**
    * @notice Update index of the deployment strategy
    * @param standard Deployment strategy
    * @param index New index
    */
    function updateStrategyIndex(bytes32 standard, uint index) public;

    /**
    * @notice Update supported standarts length
    * @param newLength New array length
    */
    function updateSupportedStandardsLength(uint newLength) public;

    /**
    * @notice Remove deployment strategy from the list
    * @param index Index of the deployment strategy which will be removed
    */
    function removeStandard(uint index) public;

    /**
    * @notice Remove deployment strategy
    * @param standard Standard which will be removed
    */
    function removeDeploymentStrategy(bytes32 standard) public;

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns the number of standards supported.
    */
    function supportedStandardsLength() public view returns (uint);

    /**
    * @notice Get supported standard by index
    * @param index Index of the standard in the array
    */
    function getStandardByIndex(uint index) public view returns (bytes32);

    /**
    * @notice Returns deployment strategy index
    * @param standard Standard of the deployment strategy
    */
    function getStandardIndex(bytes32 standard) public view returns (uint);

    /**
    * @notice Reurns deployment strategy address
    * @param standard Standard of the deployment strategy
    */
    function getStandardAddress(bytes32 standard) public view returns (address);

    /**
    * @notice Returns standard of the token
    * @param token Address of the token
    */
    function getTokenStandard(address token) public view returns (bytes32);

    /**
    * @notice Returns address of the token issuer
    * @param token Token address
    */
    function getIssuerAddress(address token) public view returns (address);
}