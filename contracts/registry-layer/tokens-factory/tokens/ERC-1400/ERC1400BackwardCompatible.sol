pragma solidity ^0.4.24;

import "../ERC-20/IERC20.sol";
import "../ERC-777/IERC777.sol";
import "../ERC-777/ERC777TokensRecipient.sol";
import "../ERC-777/ERC777TokensSender.sol";
import "./ERC1400Basic.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";


/**
* @title ERC-1400. Part fungible token.
* @notice Backward compatible with ERC-777 & ERC-20
*
* @notice In order to remain backwards compatible with ERC20 / ERC777 (and other fungible token standards)
* @notice it is necessary to define what tranche or tranches are used when a transfer / send operation is executed 
* @notice (i.e. when not explicitly specifying the tranche).
* @dev https://github.com/ethereum/EIPs/issues/1410
* @dev https://eips.ethereum.org/EIPS/eip-777
* @dev https://eips.ethereum.org/EIPS/eip-20
*/
contract ERC1400BackwardCompatible is IERC777, IERC20, ERC1400Basic {
    // Define libraries
    using AddressUtils for address;

    // ERC-20
    bool internal ERC20Compatible = true;

    // Declare storage for the ERC-20 allowances
    mapping(address => mapping(address => uint256)) internal allowed;

    // ERC-20 Events
    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);

    // ERC-777
    uint _granularity = 1;

    // ERC-777 Events
    event AuthorizedOperator(address indexed operator, address indexed tokenHolder);
    event RevokedOperator(address indexed operator, address indexed tokenHolder);
    event Sent(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint amount,
        bytes data,
        bytes operatorData
    );

    /**
    * @notice Verify if contracts is ERC-20 compatible
    */
    modifier isERC20Compatible() {
        require(ERC20Compatible, "Token is not ERC-20 compatible.");
        _;
    }

    /**
    * @notice Enable/disable ERC-20 backword compability 
    */

    /// ***** ERC-20 ***** ///

    /**
    * @notice ERC-20 allowance function
    * @param tokenOwner Address of the token owner
    * @param spender Spender address
    */
    function allowance(address tokenOwner, address spender) public view returns (uint) {
        return allowed[tokenOwner][spender];
    }

    /**
    * @notice ERC-20 transfer function
    * @param to Recipient address
    * @param tokens Tokens that will be transferred
    */
    function transfer(address to, uint tokens) 
        public
        isERC20Compatible() 
        returns (bool)
    {
        require(hasDefaultTranches(msg.sender), "Default tranches not set.");

        // default transfer
        transferFromDefaultTranches(
            msg.sender,
            to,
            address(0),
            tokens,
            "",
            ""
        );

        emit Transfer(msg.sender, to, tokens);

        return true;
    }

    /**
    * @notice ERC-20 approve function
    * @param spender Address which will be set as a tokens spender
    * @param tokens Amount of the allowed tokens for the spender
    */
    function approve(address spender, uint tokens) 
        public
        isERC20Compatible() 
        returns (bool)
    {
        allowed[msg.sender][spender] = tokens;
        
        emit Approval(msg.sender, spender, tokens);
        
        return true;
    }
    
    /**
    * @notice ERC-20 transferFrom function
    * @param from Address from which tokens will be transferred
    * @param to Recipient address
    * @param tokens Tokens that will be transferred
    */
    function transferFrom(address from, address to, uint tokens) 
        public 
        isERC20Compatible()
        returns (bool) 
    {
        require(tokens <= allowed[from][msg.sender], "Not allowed.");
        require(getDefaultTranches(from).length > 0, "Default tranches not set.");

        allowed[from][msg.sender] = allowed[from][msg.sender].sub(tokens);

        // Default transfer
        transferFromDefaultTranches(
            from,
            to,
            address(0),
            tokens,
            "",
            ""
        );

        emit Transfer(from, to, tokens);

        return true;
    }

    /**
    * @notice Calculate balance for all tranches
    * @param tokenOwner Address of the token holder
    */
    function balanceOf(address tokenOwner) public view returns (uint) {
        uint balance = 0;

        for (uint i = 0; i < tranches.length; i++) {
            balance = balance.add(balances[tokenOwner][tranches[i]]);
        }

        return balance;
    }

    /// ***** ERC-777 ***** ///

    /**
    * @notice Returns token name
    */
    function name() public view returns (string) {
        return _name;
    }
    
    /**
    * @notice Returns token symbol
    */
    function symbol() public view returns (string) {
        return _symbol;
    }

    /**
    * @notice Returns token total supply
    */
    function totalSupply() public view returns (uint) {
        return _totalSupply;
    }

    /**
    * @notice ERC-777 send function
    * @param to Recipient address
    * @param amount Amount of the tokens which will be transfered
    * @param data Data
    */
    function send(address to, uint amount, bytes data) public {
        require(hasDefaultTranches(msg.sender), "Default tranches not set.");

        transferFromDefaultTranches(
            msg.sender,
            to,
            address(0),
            amount,
            data,
            ""
        );

        // Write info to the log
        emit Sent(msg.sender, msg.sender, to, amount, data, "");
    }

    /**
    * @notice ERC-777 operatorSend function. Allow transfer tokens for operators
    * @param from Address from which tokens will be transferred
    * @param to Recipient address
    * @param amount Amount of the tokens which will be transfered
    * @param data Data
    * @param operatorData Operator data
    */
    function operatorSend(
        address from,
        address to,
        uint amount,
        bytes data,
        bytes operatorData
    ) 
        public
    {
        require(hasDefaultTranches(from), "Default tranches not set.");

        transferFromDefaultTranches(
            from,
            to,
            msg.sender,
            amount,
            data,
            operatorData
        );

        // Write info to the log
        emit Sent(msg.sender, from, to, amount, data, operatorData);
    }

    /**
    * @notice ERC-777 authorizeOperator function. Authorize operator
    * @param operator Address which will be authorized
    */
    function authorizeOperator(address operator) public {
        require(operator != address(0), "Invalid operator address.");
        require(!authorizedOpearatorStatus[msg.sender][operator], "Operator already authorized.");

        uint index = authorizedOperators[msg.sender].length;

        authorizedOpearatorIndex[msg.sender][operator] = index;
        authorizedOpearatorStatus[msg.sender][operator] = true;
        authorizedOperators[msg.sender].push(operator);

        emit AuthorizedOperator(operator, msg.sender);
    }

    /**
    * @notice ERC-777 revokeOperator function. Revoke operator
    * @param operator Address which will be revoked
    */
    function revokeOperator(address operator) public {
        require(authorizedOpearatorStatus[msg.sender][operator], "An operator is not authorized.");

        uint index = authorizedOpearatorIndex[msg.sender][operator];
        uint last = authorizedOperators[msg.sender].length.sub(1);

        if (last > 0) {
            address toUpdate = authorizedOperators[msg.sender][last];
            authorizedOperators[msg.sender][index] = toUpdate;
            authorizedOpearatorIndex[msg.sender][toUpdate] = index;
        }

        delete authorizedOperators[msg.sender][last];
        delete authorizedOpearatorStatus[msg.sender][operator];
        authorizedOperators[msg.sender].length = last;

        emit RevokedOperator(operator, msg.sender);
    }

    /**
    * @notice MUST query a list of operators which can operate over all addresses and tranches
    */
    function defaultOperators() public view returns (address[]) {
        return systemOperators;
    }

    /**
    * @notice Checking if an address is operator or not
    */
    function isOperatorFor(address operator, address tokenHolder) public view returns (bool) {
        return super.isOperatorFor(operator, tokenHolder);
    }

    /**
    * @notice ERC-777 burn function. Burn tokens
    * @param amount Number of tokens that will be burned
    * @param data Data
    */
    function burn(uint amount, bytes data) public {
        burnFromDefaultTranches(
            address(0),
            msg.sender,
            amount,
            data,
            ""
        );
    } 

    /**
    * @notice ERC-777 operatorBurn function. Method which allow burn tokens for operator
    * @param tokenHolder Address for which will be burned tokens
    * @param amount Number of tokens that will be burned
    * @param data Data
    * @param operatorData Operator Data
    */
    function operatorBurn(address tokenHolder, uint amount, bytes data, bytes operatorData) public {
        burnFromDefaultTranches(
            msg.sender,
            tokenHolder,
            amount,
            data,
            operatorData
        );
    }

    /**
    * @notice ERC-777 granularity function
    */
    function granularity() public view returns (uint) {
        return _granularity;
    }
}