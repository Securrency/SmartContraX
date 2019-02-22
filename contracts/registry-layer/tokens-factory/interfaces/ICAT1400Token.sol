pragma solidity >0.4.99 <0.6.0;


/**
* @title CAT-1400 Partial fungible token
*/
contract ICAT1400Token {
    // Token details
    string public name;
    string public symbol;
    uint8 public decimals;
    // ERC-165
    function supportsInterface(bytes4 interfaceID) public view returns (bool);
    // ERC-20 backward compatibility
    function totalSupply() public view returns (uint);
    function balanceOf(address tokenOwner) public view returns (uint balance);
    function allowance(address tokenOwner, address spender) public view returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    function balanceOfByPartition(bytes32 partition, address tokenHolder) external view returns (uint256);
    function mintByPartition(bytes32 partition, address to, uint256 value) external;

    // Partitions management
    function setDefaultPartition(bytes32 partition) external;

    // System methods
    function initializeToken(address components) public;
    function setImplementations(
        bytes4[] memory sig,
        address[] memory impls
    )
        public;

    // Partition Token Transfers
    function transferByPartition(
        bytes32 partition,
        address to,
        uint256 value,
        bytes calldata data
    )
        external
        returns (bytes32);

    function clawbackByPartition(
        address from,
        address to,
        uint tokens,
        bytes32 partition
    )
        public;

    // Transfer Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event TransferByPartition(
        bytes32 indexed fromPartition,
        address operator,
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bytes operatorData
    );

    event ClawbackByPartition(
        bytes32 indexed fromPartition,
        address operator,
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bytes operatorData
    );

    event Approval(address indexed owner, address indexed spender, uint tokens);
    event DefaultPartitionUpdated(bytes32 indexed partition);
    event PartitionCreated(bytes32 indexed partition);
}