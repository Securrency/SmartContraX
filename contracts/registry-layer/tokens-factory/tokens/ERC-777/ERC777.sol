pragma solidity ^0.4.24;

import "../ERC-20/IERC20.sol";
import "./ERC777Basic.sol";

/**
* @title ERC-777
*/
contract ERC777 is IERC20, ERC777Basic {
    // ERC-20 compatible
    bool internal ERC20Compatible = true;

    // Declare storage for the ERC-20 allowances
    mapping(address => mapping(address => uint256)) internal allowed;

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);

    /**
    * @notice Verify if contracts is ERC-20 compatible
    */
    modifier isERC20Compatible() {
        require(ERC20Compatible, "Token is not ERC-20 compatible.");
        _;
    }

    // initialize contract
    constructor(
        string name,
        string symbol,
        uint256 granularity, 
        address[] defaultOperators
    ) 
        public
        ERC777Basic(
            name,
            symbol,
            granularity,
            defaultOperators
        )
    {}

    function allowance(address tokenOwner, address spender) public view returns (uint) {
        return allowed[tokenOwner][spender];
    }

    function transfer(address to, uint tokens) 
        public
        isERC20Compatible() 
        returns (bool)
    {
        transferTokens(
            msg.sender,
            msg.sender,
            to,
            tokens,
            "",
            "",
            false
        );

        emit Transfer(msg.sender, to, tokens);

        return true;
    }

    function approve(address spender, uint tokens) 
        public
        isERC20Compatible() 
        returns (bool)
    {
        allowed[msg.sender][spender] = tokens;
        
        emit Approval(msg.sender, spender, tokens);
        
        return true;
    }
    
    function transferFrom(address from, address to, uint tokens) 
        public 
        isERC20Compatible()
        returns (bool) 
    {
        require(tokens <= allowed[from][msg.sender], "Not allowed.");

        allowed[from][msg.sender] = allowed[from][msg.sender].sub(tokens);

        transferTokens(
            msg.sender,
            from,
            to,
            tokens,
            "",
            "",
            false
        );

        emit Transfer(from, to, tokens);

        return true;
    }
}