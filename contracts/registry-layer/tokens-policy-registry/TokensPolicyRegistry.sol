pragma solidity ^0.5.0;

import "./interfaces/ITokensPolicyRegistry.sol";
import "../../request-verification-layer/permission-module/Protected.sol";
import "../../registry-layer/components-registry/instances/TokensFactoryInstance.sol";


/**
* @title TokensPolicyRegistry
*/
contract TokensPolicyRegistry is ITokensPolicyRegistry, Protected, TokensFactoryInstance {
    // Declare storage for tokens policies
    // token => action => policy
    mapping(address => mapping(bytes32 => bytes)) policies;

    // Declare storage for policy hash
    // token => action => policy hash
    mapping(address => mapping(bytes32 => bytes32)) policyHash;

    // Declare storage for policies with ids
    // token => action => id => policy
    mapping(address => mapping(bytes32 => mapping(bytes32 => bytes))) policiesWithIds;

    // Declare storage for policy hash
    // token => action => id => policy hash
    mapping(address => mapping(bytes32 => mapping(bytes32 => bytes32))) policyWithIdHash;


    // Write info to the log when a policy was set
    event Policy(address indexed token, bytes32 action, bytes policy);
    
    /**
    * @notice Verify token address
    */
    modifier onlyRegisteredToken(address tokenAddress) {
        require(
            tfInstance().getTokenStandard(tokenAddress) != 0x00, 
            "Token is not registered in the tokens factory."
        );
        _;
    } 

    // Initialize contract
    constructor(address componentsRegistry) 
        public
        WithComponentsRegistry(componentsRegistry)
    {}

    /**
    * @notice Set policy for the token action
    * @param token Token address
    * @param action Action
    * @param policy Token policy for the specified action
    */
    function setPolicy(address token, bytes32 action, bytes calldata policy)
        external
        verifyPermissionForToken(msg.sig, msg.sender, token)
        onlyRegisteredToken(token)
    {
        require(token != address(0), "Invalid token address.");
        require(action != bytes32(0x00), "Invalid action.");

        policies[token][action] = policy;
        policyHash[token][action] = keccak256(policy);

        emit Policy(token, action, policy);
    }

    /**
    * @notice Set policy for the token action
    * @param token Token address
    * @param action Action
    * @param id Additional identifier
    * @param policy Token policy for the specified action
    */
    function setPolicyWithId(
        address token,
        bytes32 action,
        bytes32 id,
        bytes calldata policy
    )
        external
        allowedForTokenWithSubId(msg.sig, msg.sender, token, id)
        onlyRegisteredToken(token)
    {
        require(token != address(0), "Invalid token address");
        require(action != bytes32(0x00), "Invalid action");
        require(id != bytes32(0x00), "Invalid identifier");

        policiesWithIds[token][action][id] = policy;
        policyWithIdHash[token][action][id] = keccak256(policy);

        emit Policy(token, action, policy);
    }

    /**
    * @notice Returns policy for specified action and token
    * @param token Token address
    * @param action Action
    */
    function getPolicy(address token, bytes32 action) public view returns (bytes memory) {
        return policies[token][action];
    }

    /**
    * @notice Returns policy for specified action and token
    * @param token Token address
    * @param action Action
    * @param id Additional id
    */
    function getPolicyById(address token, bytes32 action, bytes32 id) public view returns (bytes memory) {
        return policiesWithIds[token][action][id];
    }

    /**
    * @notice Returns policy hash for specified action and token
    * @param token Token address
    * @param action Action
    */
    function getPolicyHash(address token, bytes32 action) public view returns (bytes32) {
        return policyHash[token][action];
    }

    /**
    * @notice Returns policy hash for specified action and token
    * @param token Token address
    * @param action Action
    * @param id Additional id
    */
    function getPolicyHashById(address token, bytes32 action, bytes32 id) public view returns (bytes32) {
        return policyWithIdHash[token][action][id];
    }

    /**
    * @notice Returns policy length
    * @param token Token address
    * @param action Action
    */
    function getPolicyLength(address token, bytes32 action) public view returns (uint) {
        return policies[token][action].length;
    }

    /**
    * @notice Returns policy length
    * @param token Token address
    * @param action Action
    * @param id Additional id
    */
    function getPolicyWithIdLength(address token, bytes32 action, bytes32 id) public view returns (uint) {
        return policiesWithIds[token][action][id].length;
    }
}