pragma solidity >0.4.99 <0.6.0;


/**
* @title CAT-20 token storage
*/
contract CAT20TokenStorage {
    // Structure that describes checkpoint
    struct Checkpoint {
        bytes32 checkpointKey;
        uint expireDate;
        bool used;
    }
    // Document struct
    struct Document {
        bytes32 documentHash;
        string uri;
        uint lastModified;
        uint index;
    }
    // Stores token name
    string public name;
    // Stores token symbol
    string public symbol;
    // Stores tokens standard
    string public tokenStandard = "CAT-20";
    // Stores number of the token decimals
    uint8 public decimals;
    // Stores token holders balances
    mapping(address => uint256) internal balances;
    // Token total supply
    uint256 internal totalSupply_;
    // Token approvals
    mapping (address => mapping (address => uint256)) internal allowed;
    // Transfer module address
    address public transferModuleAddress;
    // Permission module address
    address public permissionModuleAddress;
    // Components registry address
    address public componentsRegistryAddress;
    // msg.sig => implementation address
    mapping(bytes4 => address) public methodsImplementations;
    // Transfers status (paused || not paused)
    bool public paused;
    // Declares variable that stores expiration interval (seconds)
    uint public txCheckpointexpirationInterval = 2592000;
    // Declares variable that stores checkpoin identifier
    uint txCheckpointId = 1;
    // Declare storage for checkpoints
    mapping(uint => Checkpoint) checkpoints;
    // Rollback status (Enabled/Disabled)
    bool public rollbackEnabled;
    // holder -> number of tokens on escrow
    mapping(address => uint) tokensOnEscrow;
    // Documents ERC-1643
    // documents list
    bytes32[] documents;
    // document name -> document struct
    mapping(bytes32 => Document) documentDetails;
    // document index in the lits -> document name
    mapping(uint => bytes32) documentNameByIndex;
}