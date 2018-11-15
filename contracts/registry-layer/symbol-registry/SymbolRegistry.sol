pragma solidity ^0.4.24;

import "./interfaces/ISRStorage.sol";
import "./interfaces/ISymbolRegistry.sol";
import "./SymbolRegistryMetadata.sol";
import "../../common/libraries/BytesHelper.sol";
import "../../request-verification-layer/permission-module/Protected.sol";
import "../../common/component/SystemComponent.sol";
import "../../registry-layer/components-registry/getters/TokensFactoryAddress.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

/**
* @title Symbol Registry
*/
contract SymbolRegistry is ISymbolRegistry, Protected, SystemComponent, TokensFactoryAddress, SymbolRegistryMetadata {
    // define libraries
    using SafeMath for uint256;
    using BytesHelper for bytes;

    // Eternal storage address
    address srStorage;

    /**
    * @notice Verify symbol
    * @param symbol Symbol
    */
    modifier verifySymbol(bytes symbol) {
        require(
            symbol.length > 0 && symbol.length < 6, 
            "Symbol length should always between 1 & 5"
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
    constructor(address componentsRegistry, address storageAddress) 
        public 
        WithComponentsRegistry(componentsRegistry)
    {
        componentName = SYMBOL_REGISTRY_NAME;
        componentId = SYMBOL_REGISTRY_ID;

        srStorage = storageAddress;
    } 

    /**
    * @notice Register new symbol in the registry
    * @param symbol Symbol
    * @param issuerName Name of the issuer
    */
    function registerSymbol(bytes symbol, bytes issuerName) 
        public 
        verifySymbol(symbol) 
        verifyPermission(msg.sig, msg.sender) 
    {
        symbol = symbol.toUpperBytes();

        address tokenAddress = SRStorage().getSymbolToken(symbol);
        uint expiredAt = SRStorage().getSymbolExpiration(symbol);
        require(
            tokenAddress == address(0),
            "The symbol is busy."
        );
        require(
            expiredAt < now,
            "The symbol is busy. Please wait when it will be available."
        );

        uint exprationInterval = SRStorage().getExpirationInterval();

        SRStorage().saveSymbol(
            symbol,
            msg.sender,
            address(0),
            issuerName,
            now,
            now.add(exprationInterval)
        );

        SRStorage().emitRegisteredSymbol(msg.sender, symbol, issuerName);
    }

    /**
    * @notice Renew symbol
    * @param symbol Symbol which will be renewed
    */
    function renewSymbol(bytes symbol) public onlySymbolOwner(symbol, msg.sender) {
        symbol = symbol.toUpperBytes();

        uint expiredAt = SRStorage().getSymbolExpiration(symbol);
        uint exprationInterval = SRStorage().getExpirationInterval();

        SRStorage().updateSymbolExpiration(symbol, expiredAt.add(exprationInterval));
        SRStorage().emitRenewal(symbol);
    }

    /**
    * @notice Create request on the symbol ownership transferring
    * @param symbol Symbol
    * @param newOwner Address of the new symbol owner
    */
    function transferOwnership(bytes symbol, address newOwner) 
        public
        onlySymbolOwner(symbol, msg.sender)
    {
        require(newOwner != address(0), "Invalid new owner address.");
        symbol = symbol.toUpperBytes();

        SRStorage().createRequestOnOwnershipTransfer(symbol, newOwner);
        SRStorage().emitOwnershipTransferRequest(symbol, newOwner);
    }

    /**
    * @notice Accept symbol ownership
    * @param symbol Symbol
    * @param issuerName Name of the issuer
    */
    function acceptSymbolOwnership(bytes symbol, bytes issuerName) public {
        symbol = symbol.toUpperBytes();

        require(
            SRStorage().getRecipientOfTheSymbolOwnership(symbol) == msg.sender, 
            "The sender has no right on the symbol."
        );
        
        address oldOwner = SRStorage().getSymbolOwner(symbol);
        
        SRStorage().udpateSymbolOwner(symbol, msg.sender);
        SRStorage().updateSymbolIssuerName(symbol, issuerName);
        SRStorage().deleteRequestOnOwnershipTransfer(symbol);
        SRStorage().emitTransferedOwnership(
            oldOwner,
            msg.sender,
            symbol,
            issuerName
        );
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
        address tokensFactory = getTokensFactoryAddress();
        require(tokenAddress != address(0), "Invalid token address");
        require(msg.sender == tokensFactory, "Allowed only for the tokens factory.");

        symbol = symbol.toUpperBytes();

        SRStorage().updateSymbolToken(symbol, tokenAddress);
        SRStorage().emitRegisteredToken(tokenAddress, symbol);
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

        SRStorage().updateExpirationInterval(interval);
        SRStorage().emitExpirationIntervalUpdated(interval);
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
        symbol = symbol.toUpperBytes();

        address tokenAddress = SRStorage().getSymbolToken(symbol);
        uint expiredAt = SRStorage().getSymbolExpiration(symbol);
        return tokenAddress == address(0)
            && expiredAt < now;
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
        symbol = symbol.toUpperBytes();
        address symbolOwner = SRStorage().getSymbolOwner(symbol);

        return symbolOwner == owner;
    }

    /**
    * @notice Returns token registered on the symbol
    */
    function getTokenBySymbol(bytes symbol) public view returns (address) {
        return SRStorage().getSymbolToken(symbol);
    }

    /**
    * @notice Returns symbol expire date
    */
    function getSymbolExpireDate(bytes symbol) public view returns (uint) {
        return SRStorage().getSymbolExpiration(symbol);
    }

    /**
    * @notice Returns issuer name
    */
    function getIssuerNameBySymbol(bytes symbol) public view returns (bytes) {
        return SRStorage().getSymbolIssuerName(symbol);
    }

    /**
    * @notice Returns storage instance
    */
    function SRStorage() internal view returns (ISRStorage) {
        return ISRStorage(srStorage);
    }
}