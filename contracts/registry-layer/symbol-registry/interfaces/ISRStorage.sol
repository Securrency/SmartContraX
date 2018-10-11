pragma solidity ^0.4.24;


/**
* @title Symbol Registry eternal storge interface
*/
contract ISRStorage {
    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Symbol Registry.

    /**
    * @notice Emit event TransferedOwnership 
    */
    function emitTransferedOwnership(
        address oldOwner,
        address newOwner,
        bytes symbol,
        bytes issuerName
    ) 
        public;

    /**
    * @notice Emit event RegisteredSymbol
    */
    function emitRegisteredSymbol(
        address owner,
        bytes symbol,
        bytes issuerName
    ) 
        public;

    /**
    * @notice Emit event Renewal
    */
    function emitRenewal(bytes symbol) public;

    /**
    * @notice Emit event ExpirationIntervalUpdated
    */
    function emitExpirationIntervalUpdated(uint interval) public;

    /**
    * @notice Emit event RegisteredToken
    */
    function emitRegisteredToken(address tokenAddress, bytes symbol) public;

    /// Methods which updates the storage. Allowed only for the Symbol Registry.

    /**
    * @notice Save symbol info to the storage
    */
    function saveSymbol(
        bytes symbol,
        address owner,
        address tokenAddress,
        bytes issuerName,
        uint registeredAt,
        uint expiredAt
    ) 
        public;

    /**
    * @notice Update address of the symbol owner
    * @param symbol Symbol
    * @param owner New owner address
    */
    function udpateSymbolOwner(bytes symbol, address owner) public;

    /**
    * @notice Updates token address
    * @param symbol Symbol
    * @param token Address of the token
    */
    function updateSymbolToken(bytes symbol, address token) public;

    /**
    * @notice Updating issuer name
    * @param symbol Symbol
    * @param issuerName New issuer address
    */
    function updateSymbolIssuerName(bytes symbol, bytes issuerName) public;

    /**
    * @notice Updating symbols registration date
    * @param symbol Symbol
    * @param registeredAt New registration time
    */
    function updateSymbolRegistration(bytes symbol, uint registeredAt) public;

    /**
    * @notice Updating symbols expiration date
    * @param symbol Symbol
    * @param expiredAt New expiration time
    */
    function updateSymbolExpiration(bytes symbol, uint expiredAt) public;
    
    /**
    * @notice Updating symbol expiration interval
    * @param interval New expiration interval
    */
    function updateExpirationInterval(uint interval) public; 

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns address of the symbol owner
    * @param symbol Symbol
    */
    function getSymbolOwner(bytes symbol) public view returns (address);

    /**
    * @notice Returns address of the symbol token
    * @param symbol Symbol
    */
    function getSymbolToken(bytes symbol) public view returns (address);

    /**
    * @notice Returns symbols issuer name
    * @param symbol Symbol
    */
    function getSymbolIssuerName(bytes symbol) public view returns (bytes);

    /**
    * @notice Returns symbols registration date
    * @param symbol Symbol
    */
    function getSymbolRegistration(bytes symbol) public view returns (uint);

    /**
    * @notice Returns symbols expiration date
    * @param symbol Symbol
    */
    function getSymbolExpiration(bytes symbol) public view returns (uint);

    /**
    * @notice Returns current symbol expiration interval
    */
    function getExpirationInterval() public view returns (uint);
}