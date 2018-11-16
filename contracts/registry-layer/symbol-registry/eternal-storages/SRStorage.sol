pragma solidity ^0.5.0;

import "../interfaces/ISRStorage.sol";
import "../../components-registry/getters/SymbolRegistryAddress.sol";


/**
* @title Eternal storage for the Symbol Registry
*/
contract SRStorage is SymbolRegistryAddress, ISRStorage {
    // Interval for symbol expiration (seconds)
    uint internal expirationInterval = 604800;

    // Declare storage for symbol ownership transfer
    // symbol -> new owner
    mapping(bytes => address) ownershipTransfer;

    // Write info to the log when was transferred symbol ownership
    event TransferedOwnership(
        address oldOwner,
        address newOwner,
        bytes symbol,
        bytes issuerName
    );

    // Write info to the log when was registered new symbol
    event RegisteredSymbol(
        address owner,
        bytes symbol,
        bytes issuerName
    );

    // Write info to the log about symbol renewal
    event Renewal(bytes symbol);

    // Write info to the log when expiration interval was updated
    event ExpirationIntervalUpdated(uint interval);

    // Write info to the log when token was registered
    event RegisteredToken(address tokenAddress, bytes symbol);

    // Write info to the log about new ownership transfer request
    event OwnershipTransferRequest(bytes symbol, address newOwner);

    // Describe symbol struct
    struct Symbol {
        address owner;
        address tokenAddress;
        bytes issuerName;
        uint registeredAt;
        uint expiredAt;
    }

    // Declare storage for registered tokens symbols
    mapping(bytes => Symbol) internal registeredSymbols;

    // Verify the sender address. Compare with symbol registry address
    modifier onlySymbolRegistry(address sender) {
        address symbolRegistry = getSymbolRegistryAddress();
        require(sender == symbolRegistry, "Method allowed only for the Symbol Registry.");
        _;
    }

    /**
    * @notice Initialize contract
    */
    constructor(address componentsRegistry) 
        public 
        WithComponentsRegistry(componentsRegistry)
    {
        registeredSymbols["ETH"] = Symbol({
            owner: address(0),
            tokenAddress: msg.sender,
            issuerName: "",
            registeredAt: now,
            expiredAt: now + 86400 * 30 * 365 * 1000
        });
    }

    /// Events emmiters. Write info about any state changes to the log.
    /// Allowed only for the Symbol Registry.

    /**
    * @notice Emit event OwnershipTransferRequest
    */
    function emitOwnershipTransferRequest(bytes memory symbol, address newOwner) 
        public
        onlySymbolRegistry(msg.sender)
    {
        emit OwnershipTransferRequest(symbol, newOwner);
    }

    /**
    * @notice Emit event TransferedOwnership 
    */
    function emitTransferedOwnership(
        address oldOwner,
        address newOwner,
        bytes memory symbol,
        bytes memory issuerName
    ) 
        public
        onlySymbolRegistry(msg.sender)
    {
        emit TransferedOwnership(oldOwner, newOwner, symbol, issuerName);
    }

    /**
    * @notice Emit event RegisteredSymbol
    */
    function emitRegisteredSymbol(
        address owner,
        bytes memory symbol,
        bytes memory issuerName
    ) 
        public
        onlySymbolRegistry(msg.sender)
    {
        emit RegisteredSymbol(owner, symbol, issuerName);
    }

    /**
    * @notice Emit event Renewal
    */
    function emitRenewal(bytes memory symbol) 
        public
        onlySymbolRegistry(msg.sender) 
    {
        emit Renewal(symbol);
    }

    /**
    * @notice Emit event ExpirationIntervalUpdated
    */
    function emitExpirationIntervalUpdated(uint interval) 
        public
        onlySymbolRegistry(msg.sender) 
    {
        emit ExpirationIntervalUpdated(interval);
    }

    /**
    * @notice Emit event RegisteredToken
    */
    function emitRegisteredToken(address tokenAddress, bytes memory symbol) 
        public
        onlySymbolRegistry(msg.sender) 
    {
        emit RegisteredToken(tokenAddress, symbol);
    }

    /// Methods which updates the storage. Allowed only for the Symbol Registry.

    /**
    * @notice Save symbol info to the storage
    */
    function saveSymbol(
        bytes memory symbol,
        address owner,
        address tokenAddress,
        bytes memory issuerName,
        uint registeredAt,
        uint expiredAt
    ) 
        public
        onlySymbolRegistry(msg.sender)
    {
        Symbol memory symbolStruct = Symbol({
            owner: owner,
            tokenAddress: tokenAddress,
            issuerName: issuerName,
            registeredAt: registeredAt,
            expiredAt: expiredAt
        });

        registeredSymbols[symbol] = symbolStruct;
    }

    /**
    * @notice Update address of the symbol owner
    * @param symbol Symbol
    * @param owner New owner address
    */
    function udpateSymbolOwner(bytes memory symbol, address owner) 
        public
        onlySymbolRegistry(msg.sender)
    {
        registeredSymbols[symbol].owner = owner;
    }

    /**
    * @notice Updates token address
    * @param symbol Symbol
    * @param token Address of the token
    */
    function updateSymbolToken(bytes memory symbol, address token) 
        public 
        onlySymbolRegistry(msg.sender)
    {
        registeredSymbols[symbol].tokenAddress = token;
    }

    /**
    * @notice Updating issuer name
    * @param symbol Symbol
    * @param issuerName New issuer name
    */
    function updateSymbolIssuerName(bytes memory symbol, bytes memory issuerName) 
        public
        onlySymbolRegistry(msg.sender)
    {
        registeredSymbols[symbol].issuerName = issuerName;
    }

    /**
    * @notice Updating symbols registration date
    * @param symbol Symbol
    * @param registeredAt New registration time
    */
    function updateSymbolRegistration(bytes memory symbol, uint registeredAt) 
        public
        onlySymbolRegistry(msg.sender)
    {
        registeredSymbols[symbol].registeredAt = registeredAt;
    }

    /**
    * @notice Updating symbols expiration date
    * @param symbol Symbol
    * @param expiredAt New expiration time
    */
    function updateSymbolExpiration(bytes memory symbol, uint expiredAt) 
        public
        onlySymbolRegistry(msg.sender) 
    {
        registeredSymbols[symbol].expiredAt = expiredAt;
    }
    
    /**
    * @notice Updating symbol expiration interval
    * @param interval New expiration interval
    */
    function updateExpirationInterval(uint interval) 
        public 
        onlySymbolRegistry(msg.sender)
    {
        expirationInterval = interval;
    }

    /**
    * @notice Create request on the symbol ownership transferring
    * @param symbol Symbol
    * @param newOwner Address of the new symbol owner
    */
    function createRequestOnOwnershipTransfer(bytes memory symbol, address newOwner) 
        public
        onlySymbolRegistry(msg.sender)
    {
        ownershipTransfer[symbol] = newOwner;
    }

    /**
    * @notice Delete request on the symbol ownership transferring
    * @param symbol Symbol
    */
    function deleteRequestOnOwnershipTransfer(bytes memory symbol) 
        public
        onlySymbolRegistry(msg.sender)
    {
        delete ownershipTransfer[symbol];
    }

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns new symbol owner address.
    * @notice If there is no new owner will be returned address(0)
    * @param symbol Symbol
    */
    function getRecipientOfTheSymbolOwnership(bytes memory symbol) public view returns (address) {
        return ownershipTransfer[symbol];
    }

    /**
    * @notice Returns address of the symbol owner
    * @param symbol Symbol
    */
    function getSymbolOwner(bytes memory symbol) public view returns (address) {
        return registeredSymbols[symbol].owner;
    }

    /**
    * @notice Returns address of the symbol token
    * @param symbol Symbol
    */
    function getSymbolToken(bytes memory symbol) public view returns (address) {
        return registeredSymbols[symbol].tokenAddress;
    }

    /**
    * @notice Returns symbols issuer name
    * @param symbol Symbol
    */
    function getSymbolIssuerName(bytes memory symbol) public view returns (bytes memory) {
        return registeredSymbols[symbol].issuerName;
    }

    /**
    * @notice Returns symbols registration date
    * @param symbol Symbol
    */
    function getSymbolRegistration(bytes memory symbol) public view returns (uint) {
        return registeredSymbols[symbol].registeredAt;
    }

    /**
    * @notice Returns symbols expiration date
    * @param symbol Symbol
    */
    function getSymbolExpiration(bytes memory symbol) public view returns (uint) {
        return registeredSymbols[symbol].expiredAt;
    }

    /**
    * @notice Returns current symbol expiration interval
    */
    function getExpirationInterval() public view returns (uint) {
        return expirationInterval;
    }  
}