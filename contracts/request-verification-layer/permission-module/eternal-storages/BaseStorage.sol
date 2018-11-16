pragma solidity ^0.5.0;

import "../../../registry-layer/components-registry/getters/PermissionModuleAddress.sol";


/**
* @title Describe all base stirages
*/
contract BaseStorage is PermissionModuleAddress {
    /**
    * @notice Verify sender address
    */
    modifier onlyPermissionModule(address sender) {
        address permissionModule = getPermissionModuleAddress();
        require(sender == permissionModule, "Allowed only for the permission module.");
        _;
    }

    // Store address which wants transfer ownership
    address oldOwner;

    // Stores future owner address
    address futureOwner;

    // Predefined name of the owner role
    bytes32 ownerRole = bytes32("Owner");

    // List of the all supported roles
    bytes32[] internal listOfTheRoles;

    // Declare storage for the roles
    mapping(bytes32 => bytes32) internal roles;

    // Declare storage for the role status
    mapping(bytes32 => bool) internal roleStatus;

    // Declare storage for the roles methods indexes
    mapping(bytes32 => mapping(bytes4 => uint256)) internal indexesOfTheRoleMethods;

    // Declare storage for the list of the role methods
    mapping(bytes32 => bytes4[]) internal listOfTheRoleMethods;

    // Declare storage for the role methods
    mapping(bytes32 => mapping(bytes4 => bool)) internal roleMethods;

    // wallet dependet roles
    // Declare storage for the wallet roles
    mapping(address => mapping(bytes32 => bool)) internal walletRoles;

    // Declare storage for the wallet roles indexes
    mapping(address => mapping(bytes32 => uint8)) internal indexesOfTheWalletRoles;

    // Declare storage for the wallet roles
    mapping(address => bytes32[20]) internal listOfTheWalletRoles;

    // Declare storage for the last indexe of the wallet roles array
    mapping(address => uint8) internal walletRolesIndex;

    // token dependet roles
    // Declare storage for the token dependent roles
    mapping(address => mapping(address => mapping(bytes32 => bool))) internal tokenDependentRoles;

    // Declare storage for the token dependent roles indexes
    mapping(address => mapping(address => mapping(bytes32 => uint8))) internal indexesOfTheTokenDependentRoles;

    // Declare storage for the token dependent roles
    mapping(address => mapping(address => bytes32[20])) internal listOfTheTokenDependentRoles;

    // Declare storage for the last index of the token dependent roles
    mapping(address => mapping(address => uint8)) internal tokenDependentRolesIndex;
}