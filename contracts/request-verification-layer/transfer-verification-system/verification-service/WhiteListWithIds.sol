pragma solidity ^0.5.0;

import "../interfaces/IWhiteListWithIds.sol";
import "../../../registry-layer/components-registry/instances/TokensFactoryInstance.sol";
import "../../permission-module/Protected.sol";


/**
* @title Whitelist service with additional identifiers
*/
contract WhiteListWithIds is IWhiteListWithIds, Protected, TokensFactoryInstance {
    // Declare storage for a whitelisted addresses
    mapping(address => mapping(address => mapping(bytes32 => bool))) whitelistedAddresses;

    /**
    * @notice Write info to the log when someone was added to the whitelist
    * @param who An address which was added to the Whitelist
    * @param tokenAddress Address of the token
    * @param id Additional identifier
    */
    event Added(address indexed who, address indexed tokenAddress, bytes32 indexed id);

    /**
    * @notice Write info to the log when someone was removed from the whitelist
    * @param who An address which was removed from the Whitelist
    * @param tokenAddress Address of the token
    * @param id Additional identifier
    */
    event Removed(address indexed who, address indexed tokenAddress, bytes32 indexed id);

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
    * @param id Additional identifier
    */
    function presentInWhiteList(address who, address tokenAddress, bytes32 id) public view returns (bool) {
        return whitelistedAddresses[tokenAddress][who][id];
    }

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    * @param id Additional identifier
    */
    function addToWhiteList(address who, address tokenAddress, bytes32 id) 
        public
        allowedForTokenWithSubId(msg.sig, msg.sender, tokenAddress, id) 
    {
        require(who != address(0), "Invalid customer address.");
        require(id != bytes32(0x00), "Invalid id.");
        require(tfInstance().getTokenStandard(tokenAddress).length != 0, "Token is not registered in the tokens factory.");

        add(who, tokenAddress, id);
    }

    /**
    * @notice Add multiple addresses to the whitelist
    * @param investors Array of the investors addresses
    * @param tokenAddress Token for address attachment
    * @param id Additional identifier
    */
    function addArrayToWhiteList(address[] memory investors, address tokenAddress, bytes32 id)
        public
        allowedForTokenWithSubId(msg.sig, msg.sender, tokenAddress, id)
    {
        require(id != bytes32(0x00), "Invalid id.");
        require(tfInstance().getTokenStandard(tokenAddress).length != 0, "Token is not registered in the tokens factory.");

        for (uint i = 0; i < investors.length; i++) {
            require(investors[i] != address(0), "Invalid investor address.");
            add(investors[i], tokenAddress, id);
        }
    }

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token address
    * @param id Additional identifier
    */
    function removeFromWhiteList(address who, address tokenAddress, bytes32 id) 
        public
        allowedForTokenWithSubId(msg.sig, msg.sender, tokenAddress, id)
    {
        require(who != address(0), "Invalid customer address.");
        require(id != bytes32(0x00), "Invalid id.");
        require(tfInstance().getTokenStandard(tokenAddress).length != 0, "Token is not registered in the tokens factory.");

        remove(who, tokenAddress, id);
    }

    /**
    * @notice Remove multiple addresses from the whitelist
    * @param investors Array of the investors which will be removed
    * @param tokenAddress Token address
    * @param id Additional identifier
    */
    function removeArrayFromWhiteList(address[] memory investors, address tokenAddress, bytes32 id) 
        public
        allowedForTokenWithSubId(msg.sig, msg.sender, tokenAddress, id)
    {
        require(id != bytes32(0x00), "Invalid id.");
        require(tfInstance().getTokenStandard(tokenAddress).length != 0, "Token is not registered in the tokens factory.");
        for (uint i = 0; i < investors.length; i++) {
            require(investors[i] != address(0), "Invalid investor address.");
            remove(investors[i], tokenAddress, id);
        }
    }

    /**
    * @notice Add address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    * @param id Additional identifier
    */
    function add(address who, address tokenAddress, bytes32 id) internal {
        whitelistedAddresses[tokenAddress][who][id] = true;

        emit Added(who, tokenAddress, id);
    }

    /**
    * @notice Remove address from whitelist
    * @param investor Address which will be removed
    * @param tokenAddress Token address
    * @param id Additional identifier
    */
    function remove(address investor, address tokenAddress, bytes32 id) internal {
        whitelistedAddresses[tokenAddress][investor][id] = false;

        emit Removed(investor, tokenAddress, id);
    }
}