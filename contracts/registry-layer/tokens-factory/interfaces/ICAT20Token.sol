pragma solidity >0.4.99 <0.6.0;


/**
* @title Interface of the CAT-20 token (V2)
*/
contract ICAT20Token {
    // Token details
    string public name;
    string public symbol;
    string public tokenStandard;
    uint8 public decimals;

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
    // Stores number of the tokens that are on escrow
    uint public totalOnEscrow;
    // Declares variable that stores expiration interval (seconds)
    uint public txCheckpointexpirationInterval;
    // Rollback status (Enabled/Disabled)
    bool public rollbackEnabled;
    
    // ERC-20 backward compatibility
    function totalSupply() public view returns (uint);
    function balanceOf(address tokenOwner) public view returns (uint balance);
    function allowance(address tokenOwner, address spender) public view returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);
    
    // ERC-165
    function supportsInterface(bytes4 interfaceID) public view returns (bool);

    // CAT-20 Methods
    function mint(address to, uint tokens) public;
    function clawback(address from, address to, uint tokens) public;   
    function pause() external;
    function unpause() external;
    function burn(uint value) public;
    function transferAgentBurn(address from, uint value, bytes32 data) external;
    function toggleRollbacksStatus() external;
    function getCheckpointKey(uint checkpointId) public view returns (bytes32);
    function updateExpirationTime(uint newExpirationInterval) public;
    function isActiveCheckpoint(uint checkpointId) public view returns (bool);
    function generateCheckpoint(address from, address to, uint value, address sender) public pure returns (bytes32);
    function createRollbackTransaction(address from, address to, address sender, uint tokens, uint checkpointId, string memory originalTxHash) public returns (bool);
    
    // Temporary methods
    function initializeToken(address componentsRegistry) public;

    // System methods
    function setImplementations(bytes4[] memory sig, address[] memory impls) public;

    // Document Management
    function getDocument(bytes32 _name) external view returns (string memory, bytes32, uint256);
    function setDocument(bytes32 _name, string calldata _uri, bytes32 _documentHash) external;
    function removeDocument(bytes32 _name) external;
    function getAllDocuments() external view returns (bytes32[] memory);
    
    // List of the events
    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint tokens);
    event Clawback(address indexed from, address indexed to, uint tokens);
    event Mint(address indexed to, uint256 amount);
    event Pause();
    event Unpause();
    event Burn(address indexed from, uint256 value);
    event BurnedByTransferAgent(address indexed from, address indexed burnedBy, uint256 value, bytes32 data);
    event RollbacksStatusChanged(bool newStatus);
    event CheckpointWasUsed(uint indexed checkpointId, string originalTxHash);
    event CheckpointCreated(bytes32 indexed checkpointKey, uint indexed checkpointId);
    event CheckointExpireInteravalUpdated(uint oldValue, uint newValue);
    // Document Events
    event DocumentRemoved(bytes32 indexed _name, string _uri, bytes32 _documentHash);
    event DocumentUpdated(bytes32 indexed _name, string _uri, bytes32 _documentHash);
}