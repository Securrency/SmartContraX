pragma solidity ^0.4.24;

import "./IERC777.sol";
import "./ERC777TokensRecipient.sol";
import "./ERC777TokensSender.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/AddressUtils.sol";
import "erc820/contracts/ERC820Client.sol";


/**
* @title ERC-777 basic token
*/
contract ERC777Basic is IERC777, ERC820Client {
    // define libraries
    using SafeMath for uint;
    using AddressUtils for address;

    // _granularity
    uint _granularity = 1;

    string _name;
    string _symbol;
    uint _totalSupply;

    // tokens balances
    mapping(address => uint) balances;

    // List of the default operators
    address[] defaultOperatorsList;
    
    // Revoked default operators
    mapping(address => mapping(address => bool)) internal revokedDefaultOperators;

    // Store operator status
    mapping(address => bool) isDefaultOperator;

    // Declare storage for authorized operators
    mapping(address => mapping(address => bool)) authorizedOperators;

    event Sent(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint amount,
        bytes data,
        bytes operatorData
    );
    event Minted(address indexed operator, address indexed to, uint amount, bytes data, bytes operatorData);
    event Burned(address indexed operator, address indexed from, uint amount, bytes operatorData);
    event AuthorizedOperator(address indexed operator, address indexed tokenHolder);
    event RevokedOperator(address indexed operator, address indexed tokenHolder);

    modifier isValidAmout(uint amount) {
        require(amount.div(_granularity).mul(_granularity) == amount);
        _;
    }

    // Initialize contract
    constructor(
        string name,
        string symbol,
        uint granularity, 
        address[] _defaultOperators
    ) 
        public
    {
        require(_granularity >= 1, "Invalid granularity.");

        _name = name;
        _symbol = symbol;
        _totalSupply = 0;
        _granularity = granularity;

        for (uint i = 0; i < _defaultOperators.length; i++) {
            defaultOperatorsList.push(_defaultOperators[i]);
            isDefaultOperator[_defaultOperators[i]] = true;
        }
    }

    function authorizeOperator(address operator) public {
        require(operator != msg.sender, "Invalid operator address.");

        if (isDefaultOperator[operator]) {
            revokedDefaultOperators[operator][msg.sender] = false;
        } else {
            authorizedOperators[operator][msg.sender] = true;
        }

        emit AuthorizedOperator(operator, msg.sender);
    }

    function revokeOperator(address operator) public {
        if (isDefaultOperator[operator]) {
            revokedDefaultOperators[operator][msg.sender] = true;
        } else {
            authorizedOperators[operator][msg.sender] = false;
        }

        emit RevokedOperator(operator, msg.sender);
    }

    function send(address to, uint amount, bytes data) 
        public
        isValidAmout(amount) 
    {
        transferTokens(
            msg.sender,
            msg.sender,
            to,
            amount,
            data,
            "",
            true
        );
    }

    function operatorSend(
        address from,
        address to,
        uint amount,
        bytes data,
        bytes operatorData
    ) 
        public
        isValidAmout(amount) 
    {
        require(authorizedOperators[msg.sender][from], "Not authorized operator");

        transferTokens(
            msg.sender,
            from,
            to,
            amount,
            data,
            operatorData,
            true
        );
    }

    function transferTokens(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData,
        bool preventLocking
    ) 
        internal 
    {
        sendRequestToSender(
            operator,
            from,
            to,
            amount,
            userData,
            operatorData
        );

        require(to != address(0));
        require(balances[from] >= amount);

        balances[from] = balances[from].sub(amount);
        balances[to] = balances[to].add(amount);

        sendRequestToRecipient(
            operator,
            from,
            to,
            amount,
            userData,
            operatorData,
            preventLocking
        );

        emit Sent(operator, from, to, amount, userData, operatorData);
    }

    function burn(uint amount, bytes data) public {
        burnTokens(msg.sender, msg.sender, amount, data, "");
    }

    function operatorBurn(
        address from, 
        uint amount,
        bytes data, 
        bytes operatorData
    ) 
        public 
    {
        burnTokens(msg.sender, from, amount, data, operatorData);
    }

    function name() public view returns (string) {
        return _name;
    }
    
    function symbol() public view returns (string) {
        return _symbol;
    }
    
    function totalSupply() public view returns (uint) {
        return _totalSupply;
    }

    function balanceOf(address owner) public view returns (uint) {
        return balances[owner];
    }

    function granularity() public view returns (uint) {
        return _granularity;
    }

    function defaultOperators() public view returns (address[]) {
        return defaultOperatorsList;
    }

    function isOperatorFor(address operator, address tokenHolder) public view returns (bool) {
        return (operator == tokenHolder
            || authorizedOperators[operator][tokenHolder]
            || (isDefaultOperator[operator] && !revokedDefaultOperators[operator][tokenHolder]));
    }

    function burnTokens(
        address operator, 
        address tokenHolder, 
        uint amount, 
        bytes holderData, 
        bytes operatorData
    ) 
        internal 
        isValidAmout(amount)
    {
        require(balanceOf(tokenHolder) >= amount);

        balances[tokenHolder] = balances[tokenHolder].sub(amount);
        _totalSupply = _totalSupply.sub(amount);

        sendRequestToSender(
            operator,
            tokenHolder,
            0x0,
            amount,
            holderData,
            operatorData
        );

        emit Burned(operator, tokenHolder, amount, operatorData);
    }

    function sendRequestToRecipient(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData,
        bool preventLocking
    )
        internal
    {
        address recipientImplementation =  interfaceAddr(to, "ERC777TokensRecipient");
        if (recipientImplementation != address(0)) {
            ERC777TokensRecipient(recipientImplementation).tokensReceived(
                operator, 
                from, 
                to, 
                amount, 
                userData, 
                operatorData
            );
        } else if (preventLocking) {
            require(!to.isContract(), "Address of the contract not allowed.");
        }
    }

    function sendRequestToSender(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    )
        internal
    {
        address senderImplementation = interfaceAddr(from, "ERC777TokensSender");
        if (senderImplementation != address(0)) {
            ERC777TokensSender(senderImplementation).tokensToSend(
                operator, 
                from, 
                to, 
                amount, 
                userData, 
                operatorData
            );
        }
    }
}