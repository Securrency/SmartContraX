pragma solidity ^0.5.0;

import "../interfaces/IWhiteList.sol";
import "../../../registry-layer/components-registry/instances/TokensFactoryInstance.sol";
import "../../permission-module/Protected.sol";


/**
* @title Whitelist service
*/
contract WhiteList is IWhiteList, Protected, TokensFactoryInstance {
    // Declare storage for a whitelisted addresses
    mapping(address => mapping(address => bool)) whitelistedAddresses;

    /**
    * @notice Write info to the log when someone was added to the whitelist
    * @param tokenAddress Address of the token
    * @param who An address which was added to the Whitelist
    */
    event Added(address indexed who, address indexed tokenAddress);

    /**
    * @notice Write info to the log when someone was removed from the whitelist
    * @param tokenAddress Address of the token
    * @param who An address which was removed from the Whitelist
    */
    event Removed(address indexed who, address indexed tokenAddress);

    /**
    * @notice Intialize contract
    * @param _componentsRegistry Address of the components registry
    */
    constructor(address _componentsRegistry) 
        public
        WithComponentsRegistry(_componentsRegistry) 
    {}

    /**
    * @notice Werify address in the whitelist
    * @param who Address to be verified
    * @param tokenAddress Address of the token
    */
    function presentInWhiteList(address who, address tokenAddress) public view returns (bool) {
        return whitelistedAddresses[tokenAddress][who];
    }

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    */
    function addToWhiteList(address who, address tokenAddress) 
        public
        verifyPermissionForToken(msg.sig, msg.sender, tokenAddress) 
    {
        require(who != address(0), "Invalid customer address.");
        require(tfInstance().getTokenStandard(tokenAddress).length != 0, "Token is not registered in the tokens factory.");

        add(who, tokenAddress);
    }

    /**
    * @notice Add multiple addresses to the whitelist
    * @param investors Array of the investors addresses
    * @param tokenAddress Token for address attachment
    */
    function addArrayToWhiteList(address[] memory investors, address tokenAddress)
        public
        verifyPermissionForToken(msg.sig, msg.sender, tokenAddress)
    {
        require(tfInstance().getTokenStandard(tokenAddress).length != 0, "Token is not registered in the tokens factory.");

        for (uint i = 0; i < investors.length; i++) {
            require(investors[i] != address(0), "Invalid investor address.");
            add(investors[i], tokenAddress);
        }
    }

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token address
    */
    function removeFromWhiteList(address who, address tokenAddress) 
        public
        verifyPermissionForToken(msg.sig, msg.sender, tokenAddress) 
    {
        require(who != address(0), "Invalid customer address.");
        require(tfInstance().getTokenStandard(tokenAddress).length != 0, "Token is not registered in the tokens factory.");

        whitelistedAddresses[tokenAddress][who] = false;

        emit Removed(who, tokenAddress);
    }

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    */
    function add(address who, address tokenAddress) internal {
        whitelistedAddresses[tokenAddress][who] = true;

        emit Added(who, tokenAddress);
    }
}