pragma solidity 0.4.24;

/**
* @title Symbol Registry interface
*/
contract ISymbolRegistry {
    /**
    * @notice Register new symbol in the registry
    * @param symbol Symbol
    */
    function registerSymbol(bytes symbol) public;

    /**
    * @notice Renew symbol
    * @param symbol Symbol which will be renewed
    */
    function renewSymbol(bytes symbol) public;

    /**
    * @notice Change symbol owner
    * @param newOwner Address of the new symbol owner
    */
    function transferOwnership(bytes symbol, address newOwner) public;

    /**
    * @notice Checks symbol in system 
    * @param symbol Symbol
    */
    function symbolIsAvailable(bytes symbol) public view returns (bool);

    /**
    * @notice Checks owner
    * @param symbol Symbol
    * @param owner Address for verification
    */
    function isSymbolOwner(bytes symbol, address owner) public view returns (bool);

    /**
    * @notice Register token to the symbol
    * @param sender Token issuer address
    * @param symbol Created token symbol
    * @param tokenAddress Address of the registered token
    */
    function registerTokenToTheSymbol(
        address sender, 
        bytes symbol, 
        address tokenAddress
    ) 
        public;

    /**
    * @notice Update symbols expiration interval
    * @param interval New expiration interval
    */
    function updateExpirationInterval(uint interval) public;

    /**
    * @notice Return token registred on the symbol
    */
    function getTokenBySymbol(bytes symbol) public view returns (address);

    /**
    * @notice Return symbol expire date
    */
    function getSymbolExpireDate(bytes symbol) public view returns (uint);
}