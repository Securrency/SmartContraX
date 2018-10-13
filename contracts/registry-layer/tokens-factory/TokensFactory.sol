pragma solidity ^0.4.24;

import "./interfaces/ITokensFactory.sol";
import "./interfaces/ITokenStrategy.sol";
import "./interfaces/ITFStorage.sol";
import "./TokensFactoryMetadata.sol";
import "../symbol-registry/interfaces/ISymbolRegistry.sol";
import "../../common/libraries/BytesHelper.sol";
import "../../request-verification-layer/permission-module/Protected.sol";
import "../components-registry/instances/SymbolRegistryInstance.sol";
import "../../common/component/SystemComponent.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
* @title Factory of the tokens
*/
contract TokensFactory is ITokensFactory, Protected, SymbolRegistryInstance, SystemComponent, TokensFactoryMetadata {
    // define libraries
    using SafeMath for uint256;
    using BytesHelper for string;
    
    // Tokens factory eternal storage address
    address tfStorage;

    /**
    * @notice Add symbol registry
    */
    constructor(address _componentsRegistry, address storageAddress) 
        public 
        WithComponentsRegistry(_componentsRegistry) 
    {
        componentName = TOKENS_FACTORY_NAME;
        componentId = TOKENS_FACTORY_ID;

        tfStorage = storageAddress;
    }

    /**
    * @notice This function creates new token depending on his standard
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
        address strategy = TFStorage().getStandardAddress(tokenStandard);

        require(bytes(name).length > 0, "Name length should always greater 0.");
        require(strategy != address(0), "Token strategy not found.");
        
        symbol = symbol.toUpper();

        bytes memory bytesSymbol = bytes(symbol);

        ISymbolRegistry symbolRegistry = srInstance(); 

        address token = symbolRegistry.getTokenBySymbol(bytesSymbol);
        require(token == address(0), "Token with this symbol already registered.");

        token = ITokenStrategy(strategy).deploy(
            name,
            symbol,
            decimals,
            totalSupply,
            msg.sender
        );
        
        symbolRegistry.registerTokenToTheSymbol(
            msg.sender,
            bytesSymbol,
            token
        );

        TFStorage().setIssuerForToken(msg.sender, token);
        TFStorage().setTokenStandard(token, tokenStandard);

        TFStorage().emitCreatedToken(
            token,
            msg.sender,
            name,
            symbol,
            symbolRegistry.getIssuerNameBySymbol(bytesSymbol),
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
            TFStorage().getStandardAddress(standard) == address(0),
            "Strategy already present."
        );
        
        uint index = TFStorage().supportedStandardsLength();
        TFStorage().addDeploymentStrategy(standard);

        TFStorage().saveDeploymentStrategy(
            tokenStrategy,
            standard,
            index
        );

        TFStorage().emitStrategyAdded(standard, tokenStrategy);
    }

    /**
    * @notice Remove strategy from tokens factory
    * @param standard Token standard which will be removed
    */
    function removeTokenStrategy(bytes32 standard) 
        public
        verifyPermission(msg.sig, msg.sender) 
    {
        address removedStrategy = TFStorage().getStandardAddress(standard);
        require(removedStrategy != address(0), "Strategy not found.");

        uint index = TFStorage().getStandardIndex(standard);
        uint last = TFStorage().supportedStandardsLength().sub(1);

        if (last > 0) {
            bytes32 standardToUpdate = TFStorage().getStandardByIndex(index);

            TFStorage().updateStrategyByindex(standardToUpdate, index);
            TFStorage().updateStrategyIndex(standardToUpdate, index);
        }

        TFStorage().removeStandard(last);
        TFStorage().updateSupportedStandardsLength(last);
        TFStorage().removeDeploymentStrategy(standard);

        TFStorage().emitStrategyRemoved(standard, removedStrategy);        
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
        address tokenStrategyOld = TFStorage().getStandardAddress(standard);
        require(tokenStrategyNew != address(0), "Invalid address of the new token strategy.");
        require(tokenStrategyOld != address(0), "Strategy not found.");
        
        TFStorage().updateStrategyAddress(standard, tokenStrategyNew);
        TFStorage().emitStrategyUpdated(standard, tokenStrategyOld, tokenStrategyNew);
    }

    /**
    * @notice Return an array of supported tokens standards
    */
    function getSupportedStandardsLength() public view returns (uint) {
        return TFStorage().supportedStandardsLength();
    }

    /**
    * @notice Returns standard of the registered token 
    * @param tokenAddress Address of registered token
    */
    function getTokenStandard(address tokenAddress) public view returns (bytes32) {
        return TFStorage().getTokenStandard(tokenAddress);
    }

    /**
    * @notice Returns token issuer address
    * @param token Token address
    */
    function getIssuerByToken(address token) public view returns (address) {
        return TFStorage().getIssuerAddress(token);
    }

    /**
    * @notice Verify if is supported requested standard
    * @param standard A standard for verification
    */
    function isSupported(bytes32 standard) public view returns (bool) {
        return TFStorage().getStandardAddress(standard) != address(0);
    }

    /**
    * @notice Returns tokens factory eternal storge instance
    */
    function TFStorage() internal view returns (ITFStorage) {
        return ITFStorage(tfStorage);
    }
}