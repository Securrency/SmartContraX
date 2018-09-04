pragma solidity 0.4.24;

import "./interfaces/ISymbolRegistry.sol";
import "../../helpers/Utils.sol";
import "../../request-verification-layer/permission-module/Protected.sol";

/**
* @title Symbol Registry
*/
contract SymbolRegistry is ISymbolRegistry, Utils, Protected {
    // Interval for symbol expiration
    uint public exprationInterval = 604800;

    // Write info to the log when was transferred symbol ownership
    event TransferedOwnership(
        address oldOwner,
        address newOwner,
        bytes symbol
    );

    // Write info to the log when was registered new symbol
    event RegisteredSymbol(
        address owner,
        bytes symbol
    );

    // Write info to the log about symbol renewal
    event Renewal(bytes symbol);

    // Write info to the log when expiration interval was updated
    event ExpirationIntervalUpdated(uint interval);

    // Write info to the log when token was registered
    event RegisteredToken(address tokenAddress, bytes symbol);

    // Describe symbol struct
    struct Symbol {
        address owner;
        address tokenAddress;
        uint registeredAt;
        uint expiredAt;
    }

    // Declare storage for registered tokens symbols
    mapping(bytes => Symbol) internal registeredSymbols;

    /**
    * @notice Verify symbol
    * @param symbol Symbol
    */
    modifier verifySymbol(bytes symbol) {
        require(
            symbol.length > 0 && symbol.length < 6, 
            "Symbol length should always between 0 & 6"
        );
        _;
    }

    /**
    * @notice Verify symbol owner
    * @param symbol Symbol
    * @param sender Address to verify
    */
    modifier onlySymbolOwner(bytes symbol, address sender) {
        require(
            isSymbolOwner(symbol, sender), 
            "Allowed only for an owner."
        );
        _;
    }

    /**
    * @notice Initialize contract
    */
    constructor(address permissionModule) public Protected(permissionModule) {} 

    /**
    * @notice Register new symbol in the registry
    * @param symbol Symbol
    */
    function registerSymbol(bytes symbol) 
        public 
        verifySymbol(symbol) 
        verifyPermission(msg.sig, msg.sender) 
    {
        symbol = toUpperBytes(symbol);

        require(
            registeredSymbols[symbol].tokenAddress == address(0),
            "The symbol is busy."
        );
        require(
            registeredSymbols[symbol].expiredAt < now,
            "The symbol is busy. Please wait when it will be available."
        );

        Symbol memory symbolStruct = Symbol({
            owner: msg.sender,
            tokenAddress: address(0),
            registeredAt: now,
            expiredAt: now + exprationInterval
        });

        registeredSymbols[symbol] = symbolStruct;

        emit RegisteredSymbol(msg.sender, symbol);
    }

    /**
    * @notice Renew symbol
    * @param symbol Symbol which will be renewed
    */
    function renewSymbol(bytes symbol) public onlySymbolOwner(symbol, msg.sender) {
        symbol = toUpperBytes(symbol);

        registeredSymbols[symbol].expiredAt += exprationInterval;

        emit Renewal(symbol);
    }

    /**
    * @notice Change symbol owner
    * @param newOwner Address of the new symbol owner
    */
    function transferOwnership(bytes symbol, address newOwner) 
        public
        onlySymbolOwner(symbol, msg.sender)
    {
        symbol = toUpperBytes(symbol);

        emit TransferedOwnership(
            registeredSymbols[symbol].owner,
            newOwner,
            symbol
        );

        registeredSymbols[symbol].owner = newOwner;
    }

    /**
    * @notice Register symbol for the token
    * @param sender Token issuer address
    * @param symbol Created token symbol
    * @param tokenAddress Address of the registered token
    */
    function registerTokenToTheSymbol(
        address sender, 
        bytes symbol, 
        address tokenAddress
    ) 
        public
        onlySymbolOwner(symbol, sender)
    {
        require(tokenAddress != address(0), "Invalid token address");

        symbol = toUpperBytes(symbol);

        registeredSymbols[symbol].tokenAddress = tokenAddress;

        emit RegisteredToken(tokenAddress, symbol);
    }

    /**
    * @notice Update symbols expiration interval
    * @param interval New expiration interval
    */
    function updateExpirationInterval(uint interval) 
        public 
        verifyPermission(msg.sig, msg.sender)
    {
        require(interval != 0, "Invalid expiration interval.");

        exprationInterval = interval;

        emit ExpirationIntervalUpdated(interval);
    }

    /**
    * @notice Checks symbol in system 
    */
    function symbolIsAvailable(bytes symbol)
        public
        verifySymbol(symbol)
        view 
        returns (bool) 
    {
        symbol = toUpperBytes(symbol);

        return registeredSymbols[symbol].owner == address(0)
            || registeredSymbols[symbol].expiredAt < now;
    }

    /**
    * @notice Checks owner
    * @param symbol Symbol
    * @param owner Address for verification
    */
    function isSymbolOwner(bytes symbol, address owner) 
        public 
        view 
        returns (bool) 
    {
        symbol = toUpperBytes(symbol);

        return registeredSymbols[symbol].owner == owner;
    }

    /**
    * @notice Return token registred on the symbol
    */
    function getTokenBySymbol(bytes symbol) public view returns (address) {
        return registeredSymbols[symbol].tokenAddress;
    }

    /**
    * @notice Return symbol expire date
    */
    function getSymbolExpireDate(bytes symbol) public view returns (uint) {
        return registeredSymbols[symbol].expiredAt;
    }
}