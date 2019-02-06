pragma solidity ^0.5.0;

import "../../../interfaces/IPolicyParser.sol";
import "../../../interfaces/IRulesEngine.sol";
import "../../../interfaces/ICAT20TransferAction.sol";
import "../../../../../common/libraries/BytesHelper.sol";
import "../../../../../registry-layer/tokens-policy-registry/interfaces/ITokensPolicyRegistry.sol";
import "../../../../permission-module/Protected.sol";


/**
* @title CAT-20 transfer action
*/
contract CAT20TransferAction is Protected, ICAT20TransferAction {
    // Define libraries
    using BytesHelper for bytes;

    // Declare storage for a whitelisted addresses
    mapping(address => mapping(address => bool)) cache;

    // Declare storage for a policy hashes
    mapping(address => mapping(address => bytes32)) cachedFor;

    // Transfer action identifier
    bytes4 constant ACTION = 0xa9059cbb;

    // Tokens policy registry instance
    ITokensPolicyRegistry public policyRegistry;
    // Policy parser instance
    IPolicyParser public policyParser;

    /**
    * @notice Write info to the log when someone was added to the whitelist (cache)
    * @param who An address which was added to the Whitelist
    * @param tokenAddress Address of the token
    */
    event Added(address indexed who, address indexed tokenAddress);

    // initialize contract
    constructor(
        address _policy,
        address _policyParser,
        address _componentsRegistry
    )
        public
        WithComponentsRegistry(_componentsRegistry)
    {
        policyRegistry = ITokensPolicyRegistry(_policy);
        policyParser = IPolicyParser(_policyParser);
    }

    /**
    * @notice Verify whether is it possible to execute a method or not
    * @param token Token address
    * @param msgSender Sender of the message (for a call that must be verified)
    * @param data Complete calldata
    * @return status, an array of the errors if present
    */
    function canExecute(
        address token,
        address msgSender,
        bytes memory data
    )
        public
        view
        returns (bool result, bytes32[10] memory errorCodes)
    {
        uint16 offset = 16;
        address to = data.cutAddress(offset);

        bytes32[10] memory txDetailsAttributes;
        bytes32[10] memory txDetailsValues;

        (result, errorCodes) = policyParser.canExecute(
            policyRegistry.getPolicy(token, ACTION),
            [msgSender, to, msgSender],
            txDetailsAttributes,
            txDetailsValues
        );
        
        return (result, errorCodes);
    }

    /**
    * @notice Verify tokens transfer and cache result
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param tokenAddress Address of the token
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        address tokenAddress,
        uint// tokens
    )
        public
        returns (bool)
    {
        bool result;
        bytes memory policy = policyRegistry.getPolicy(tokenAddress, ACTION); 
        bytes32 policyHash = policyRegistry.getPolicyHash(tokenAddress, ACTION);

        result = verifyAndCache(
            from,
            tokenAddress,
            policyHash,
            policy
        );
        if (!result) {
            return false;
        }

        result = result && verifyAndCache(
            to,
            tokenAddress,
            policyHash,
            policy
        );
        if (!result) {
            return false;
        }

        if (from != sender) {
            result = result && verifyAndCache(
                sender,
                tokenAddress,
                policyHash,
                policy
            );
        }

        return result;
    }

    /**
    * @notice Verify tokens transfer
    * @notice Selecting verification logic depending on the token standard.
    * @param from The address transfer from
    * @param to The address transfer to
    * @param tokenAddress Address of the token
    */
    function verifyTransferWithoutCaching(
        address from,
        address to,
        address sender,
        address tokenAddress,
        uint// tokens
    )
        public
        view
        returns (bool)
    {
        bool result;
        bytes memory policy = policyRegistry.getPolicy(tokenAddress, ACTION); 
        bytes32 policyHash = policyRegistry.getPolicyHash(tokenAddress, ACTION);

        result = verify(
            from,
            tokenAddress,
            policyHash,
            policy
        );
        if (!result) {
            return false;
        }

        result = result && verify(
            to,
            tokenAddress,
            policyHash,
            policy
        );
        if (!result) {
            return false;
        }

        if (from != sender) {
            result = result && verify(
                sender,
                tokenAddress,
                policyHash,
                policy
            );
        }

        return result;
    }

    /**
    * @notice Add an address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    */
    function addToWhiteList(address who, address tokenAddress)
        public
        verifyPermissionForToken(msg.sig, msg.sender, tokenAddress)
    {
        require(who != address(0), "Invalid customer address.");

        bytes memory policy = policyRegistry.getPolicy(tokenAddress, ACTION); 
        bytes32 policyHash = policyRegistry.getPolicyHash(tokenAddress, ACTION);

        verifyAndCache(who, tokenAddress, policyHash, policy);
    }

    /**
    * @notice Verify address in the whitelist
    * @param who Address to be verified
    * @param token Address of the token
    */
    function presentInWhiteList(address who, address token) public view returns (bool) {
        bytes32 policyHash = policyRegistry.getPolicyHash(token, ACTION);

        return cache[who][token] && cachedFor[who][token] == policyHash;
    }

    /**
    * @notice Provides address verification
    * @param addr Address to be verified
    * @param token Token address
    * @param policyHash Hash of the token policy
    * @param policy Token policy
    */
    function verify(
        address addr,
        address token,
        bytes32 policyHash,
        bytes memory policy
    ) 
        internal
        view
        returns (bool result)
    {
        if (cache[addr][token] && cachedFor[addr][token] == policyHash) {
            return true;
        }

        return _verify(
            addr,
            policy
        );
    }

    /**
    * @notice Provides address verification and cache result
    * @param addr Address to be verified
    * @param token Token address
    * @param policyHash Hash of the token policy
    * @param policy Token policy
    */
    function verifyAndCache(
        address addr,
        address token,
        bytes32 policyHash,
        bytes memory policy
    ) 
        internal
        returns (bool result)
    {
        if (cache[addr][token] && cachedFor[addr][token] == policyHash) {
            return true;
        }

        result = _verify(
            addr,
            policy
        );

        // cache result
        if (result) {
            cache[addr][token] = true;
            cachedFor[addr][token] = policyHash;

            emit Added(addr, token);
        }

        return result;
    }

    /**
    * @notice Provides address verification
    * @param addr Address to be verified
    * @param policy Token policy
    */
    function _verify(
        address addr,
        bytes memory policy
    ) 
        internal
        view
        returns (bool result)
    {
        address[3] memory wallets = [addr, addr, addr];
        bytes32[10] memory txDetailsAttributes;
        bytes32[10] memory txDetailsValues;

        return policyParser.verifyPolicy(
            policy,
            wallets,
            txDetailsAttributes,
            txDetailsValues
        );
    }
}