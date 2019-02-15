pragma solidity >0.4.99 <0.6.0;

import "../../../interfaces/IPolicyParser.sol";
import "../../../interfaces/IRulesEngine.sol";
import "../../../interfaces/ICAT1400TransferAction.sol";
import "../../../../../common/libraries/BytesHelper.sol";
import "../../../../../registry-layer/tokens-policy-registry/interfaces/ITokensPolicyRegistry.sol";
import "../../../../permission-module/Protected.sol";


/**
* @title CAT-1400 Transfer action
*/
contract CAT1400TransferAction is Protected, ICAT1400TransferAction {
    // Define libraries
    using BytesHelper for bytes;

    // Declare storage for a whitelisted addresses
    mapping(address => mapping(address => mapping(bytes32 => bool))) cache;

    // Declare storage for a policy hashes
    mapping(address => mapping(address => mapping(bytes32 => bytes32))) cachedFor;

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
    * @param partition Partition identifier
    */
    event Added(address indexed who, address indexed tokenAddress, bytes32 indexed partition);

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
    * @param partition Partition identifier
    */
    function verifyTransfer(
        address from,
        address to,
        address sender,
        address tokenAddress,
        uint,// tokens
        bytes32 partition
    )
        public
        returns (bool)
    {
        bool result;
        bytes memory policy = policyRegistry.getPolicyById(tokenAddress, ACTION, partition); 
        bytes32 policyHash = policyRegistry.getPolicyHashById(tokenAddress, ACTION, partition);
        
        result = verifyAndCache(
            from,
            tokenAddress,
            policyHash,
            partition,
            policy
        );
        if (!result) {
            return false;
        }

        result = result && verifyAndCache(
            to,
            tokenAddress,
            policyHash,
            partition,
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
                partition,
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
    * @param partition Partition identifier
    */
    function verifyTransferWithoutCaching(
        address from,
        address to,
        address sender,
        address tokenAddress,
        uint,// tokens
        bytes32 partition
    )
        public
        view
        returns (bool)
    {
        bool result;
        bytes memory policy = policyRegistry.getPolicyById(tokenAddress, ACTION, partition); 
        bytes32 policyHash = policyRegistry.getPolicyHashById(tokenAddress, ACTION, partition);

        result = verify(
            from,
            tokenAddress,
            policyHash,
            partition,
            policy
        );
        if (!result) {
            return false;
        }

        result = result && verify(
            to,
            tokenAddress,
            policyHash,
            partition,
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
                partition,
                policy
            );
        }

        return result;
    }

    /**
    * @notice Add an address to the whitelist
    * @param who Address which will be added
    * @param tokenAddress Token for address attachment
    * @param partition Partition identifier
    */
    function addToWhiteList(address who, address tokenAddress, bytes32 partition)
        public
        verifyPermissionForToken(msg.sig, msg.sender, tokenAddress)
    {
        require(who != address(0), "Invalid customer address.");

        bytes memory policy = policyRegistry.getPolicyById(tokenAddress, ACTION, partition); 
        bytes32 policyHash = policyRegistry.getPolicyHashById(tokenAddress, ACTION, partition);

        verifyAndCache(
            who,
            tokenAddress,
            policyHash,
            partition,
            policy
        );
    }

    /**
    * @notice Verify address in the whitelist
    * @param who Address to be verified
    * @param token Address of the token
    * @param partition Partition identifier
    */
    function presentInWhiteList(address who, address token, bytes32 partition) public view returns (bool) {
        bytes32 policyHash = policyRegistry.getPolicyHashById(token, ACTION, partition);

        return cache[who][token][partition] && cachedFor[who][token][partition] == policyHash;
    }

    /**
    * @notice Provides address verification
    * @param addr Address to be verified
    * @param token Token address
    * @param policyHash Hash of the token policy
    * @param partition Partition identifier
    * @param policy Token policy
    */
    function verify(
        address addr,
        address token,
        bytes32 policyHash,
        bytes32 partition,
        bytes memory policy
    ) 
        internal
        view
        returns (bool result)
    {
        if (cache[addr][token][partition] && cachedFor[addr][token][partition] == policyHash) {
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
    * @param partition Partition identifier
    * @param policy Token policy
    */
    function verifyAndCache(
        address addr,
        address token,
        bytes32 policyHash,
        bytes32 partition,
        bytes memory policy
    ) 
        internal
        returns (bool result)
    {
        if (cache[addr][token][partition] && cachedFor[addr][token][partition] == policyHash) {
            return true;
        }

        result = _verify(
            addr,
            policy
        );

        // cache result
        if (result) {
            cache[addr][token][partition] = true;
            cachedFor[addr][token][partition] = policyHash;

            emit Added(addr, token, partition);
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