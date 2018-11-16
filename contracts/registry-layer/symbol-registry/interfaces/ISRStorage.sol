pragma solidity ^0.5.0;


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
        bytes memory symbol,
        bytes memory issuerName
    ) 
        public;

    /**
    * @notice Emit event RegisteredSymbol
    */
    function emitRegisteredSymbol(
        address owner,
        bytes memory symbol,
        bytes memory issuerName
    ) 
        public;

    /**
    * @notice Emit event Renewal
    */
    function emitRenewal(bytes memory symbol) public;

    /**
    * @notice Emit event ExpirationIntervalUpdated
    */
    function emitExpirationIntervalUpdated(uint interval) public;

    /**
    * @notice Emit event RegisteredToken
    */
    function emitRegisteredToken(address tokenAddress, bytes memory symbol) public;

    /**
    * @notice Emit event OwnershipTransferRequest
    */
    function emitOwnershipTransferRequest(bytes memory symbol, address newOwner) public;

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
        public;

    /**
    * @notice Update address of the symbol owner
    * @param symbol Symbol
    * @param owner New owner address
    */
    function udpateSymbolOwner(bytes memory symbol, address owner) public;

    /**
    * @notice Updates token address
    * @param symbol Symbol
    * @param token Address of the token
    */
    function updateSymbolToken(bytes memory symbol, address token) public;

    /**
    * @notice Updating issuer name
    * @param symbol Symbol
    * @param issuerName New issuer address
    */
    function updateSymbolIssuerName(bytes memory symbol, bytes memory issuerName) public;

    /**
    * @notice Updating symbols registration date
    * @param symbol Symbol
    * @param registeredAt New registration time
    */
    function updateSymbolRegistration(bytes memory symbol, uint registeredAt) public;

    /**
    * @notice Updating symbols expiration date
    * @param symbol Symbol
    * @param expiredAt New expiration time
    */
    function updateSymbolExpiration(bytes memory symbol, uint expiredAt) public;
    
    /**
    * @notice Updating symbol expiration interval
    * @param interval New expiration interval
    */
    function updateExpirationInterval(uint interval) public; 

    /**
    * @notice Create request on the symbol ownership transferring
    * @param symbol Symbol
    * @param newOwner Address of the new symbol owner
    */
    function createRequestOnOwnershipTransfer(bytes memory symbol, address newOwner) public;

    /**
    * @notice Delete request on the symbol ownership transferring
    * @param symbol Symbol
    */
    function deleteRequestOnOwnershipTransfer(bytes memory symbol) public;

    /// Getters. Public methods which are allowed for anyone.

    /**
    * @notice Returns new symbol owner address.
    * @notice If there is no new owner will be returned address(0)
    * @param symbol Symbol
    */
    function getRecipientOfTheSymbolOwnership(bytes memory symbol) public view returns (address);

    /**
    * @notice Returns address of the symbol owner
    * @param symbol Symbol
    */
    function getSymbolOwner(bytes memory symbol) public view returns (address);

    /**
    * @notice Returns address of the symbol token
    * @param symbol Symbol
    */
    function getSymbolToken(bytes memory symbol) public view returns (address);

    /**
    * @notice Returns symbols issuer name
    * @param symbol Symbol
    */
    function getSymbolIssuerName(bytes memory symbol) public view returns (bytes memory);

    /**
    * @notice Returns symbols registration date
    * @param symbol Symbol
    */
    function getSymbolRegistration(bytes memory symbol) public view returns (uint);

    /**
    * @notice Returns symbols expiration date
    * @param symbol Symbol
    */
    function getSymbolExpiration(bytes memory symbol) public view returns (uint);

    /**
    * @notice Returns current symbol expiration interval
    */
    function getExpirationInterval() public view returns (uint);
}