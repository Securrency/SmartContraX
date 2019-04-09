pragma solidity >0.4.99 <0.6.0;


/**
* @title CAT-1400 token storage
*/
contract CAT1400TokenStorage {
    // Stores token name
    string public name;
    // Stores token symbol
    string public symbol;
    // Stores tokens standard
    string public tokenStandard = "CAT-1400";
    // Stores number of the token decimals
    uint8 public decimals;
    // Tokens total supply
    uint _totalSupply;
    // Tokens total supply by partition
    mapping(bytes32=>uint) _totalSupplyByPartition;
    // Stores balances by the partition
    mapping(bytes32=>mapping(address=>uint)) balances;
    // partition => holder => number of tokens on escrow
    mapping(bytes32=>mapping(address=>uint)) tokensOnEscrow;
    // Token approvals
    mapping(address=>mapping(address=>uint)) allowed;
    // Transfer module address
    address public transferModuleAddress;
    // Permission module address
    address public permissionModuleAddress;
    // Components registry address
    address public componentsRegistryAddress;
    // msg.sig => implementation address
    mapping(bytes4=>address) public methodsImplementations;
    // Stores registered partitions statuses
    mapping(bytes32=>bool) registeredPartitions;
    // Stores partition index in the list
    mapping(bytes32=>uint) partitionIndex;
    // Stores partitions list
    bytes32[] partitions;
}