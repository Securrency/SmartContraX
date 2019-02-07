pragma solidity >0.4.99 <0.6.0;


/**
* @title Interface of the CAT-20 token (V2)
*/
contract ICAT20Token {
    // Token details
    string public name;
    string public symbol;
    uint8 public decimals;
    
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
    
    // Temporary methods
    function initializeToken(address componentsRegistry) public;

    // System methods
    function setImplementations(bytes4[] memory sig, address[] memory impls) public;
    
    // List of the events
    event Transfer(address indexed from, address indexed to, uint value);
    event Approval(address indexed owner, address indexed spender, uint tokens);
    event Clawback(address indexed from, address indexed to, uint tokens);
    event Mint(address indexed to, uint256 amount);
}