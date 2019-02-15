pragma solidity ^0.5.0;


/**
* @title ITokensPolicyRegistry
*/
contract ITokensPolicyRegistry {
    /**
    * @notice Set policy for the token action
    * @param token Token address
    * @param action Action
    * @param policy Token policy for the specified action
    */
    function setPolicy(address token, bytes32 action, bytes calldata policy) external;

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
        external;

    /**
    * @notice Returns policy for specified action and token
    * @param token Token address
    * @param action Action
    */
    function getPolicy(address token, bytes32 action) public view returns (bytes memory);

    /**
    * @notice Returns policy for specified action and token
    * @param token Token address
    * @param action Action
    * @param id Additional id
    */
    function getPolicyById(address token, bytes32 action, bytes32 id) public view returns (bytes memory);

    /**
    * @notice Returns policy hash for specified action and token
    * @param token Token address
    * @param action Action
    */
    function getPolicyHash(address token, bytes32 action) public view returns (bytes32);

    /**
    * @notice Returns policy hash for specified action and token
    * @param token Token address
    * @param action Action
    * @param id Additional id
    */
    function getPolicyHashById(address token, bytes32 action, bytes32 id) public view returns (bytes32);

    /**
    * @notice Returns policy length
    * @param token Token address
    * @param action Action
    */
    function getPolicyLength(address token, bytes32 action) public view returns (uint);

    /**
    * @notice Returns policy length
    * @param token Token address
    * @param action Action
    * @param id Additional id
    */
    function getPolicyWithIdLength(address token, bytes32 action, bytes32 id) public view returns (uint);
}