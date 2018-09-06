pragma solidity 0.4.24;

/**
* @title Permission Module Storage
*/
contract PermissionModuleStorage {
    // Address of the Tokens Factory;
    address tf;
    
    // List of the all supported roles
    bytes32[] listOfTheRoles;

    // Declare storage for the roles
    mapping(bytes32 => bytes32) roles;

    // Declare storage for the role status
    mapping(bytes32 => bool) public roleStatus;

    // Declare storage for the roles methods indexes
    mapping(bytes32 => mapping(bytes4 => uint256)) indexesOfTheRoleMethods;

    // Declare storage for the list of the role methods
    mapping(bytes32 => bytes4[]) listOfTheRoleMethods;

    // Declare storage for the role methods
    mapping(bytes32 => mapping(bytes4 => bool)) roleMethods;

    // wallet dependet roles
    // Declare storage for the wallet roles
    mapping(address => mapping(bytes32 => bool)) walletRoles;

    // Declare storage for the wallet roles indexes
    mapping(address => mapping(bytes32 => uint8)) indexesOfTheWalletRoles;

    // Declare storage for the wallet roles
    mapping(address => bytes32[20]) listOfTheWalletRoles;

    // Declare storage for the last indexe of the wallet roles array
    mapping(address => uint8) public walletRolesIndex;

    // token dependet roles
    // Declare storage for the token dependent roles
    mapping(address => mapping(address => mapping(bytes32 => bool))) tokenDependentRoles;

    // Declare storage for the token dependent roles indexes
    mapping(address => mapping(address => mapping(bytes32 => uint8))) indexesOfTheTokenDependentRoles;

    // Declare storage for the token dependent roles
    mapping(address => mapping(address => bytes32[20])) listOfTheTokenDependentRoles;

    // Declare storage for the last index of the token dependent roles
    mapping(address => mapping(address => uint8)) public tokenDependentRolesIndex;
}