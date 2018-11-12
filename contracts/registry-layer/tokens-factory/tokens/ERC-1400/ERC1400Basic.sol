pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./ERC1400Tranches.sol";


/**
* @title ERC-1400. Part fungible token.
* @notice Backward compatible with ERC-777 & ERC-20
* @dev https://github.com/ethereum/EIPs/issues/1410
*/
contract ERC1400Basic is ERC1400Tranches {
    // Define libraries
    using SafeMath for uint;

    // Token details
    uint256 public _totalSupply;

    string public _name;

    string public _symbol;

    // Mapping investor, transche to tranche balance
    mapping(address => mapping(bytes32 => uint)) balances;

    /// Operators
    /// Operators can be authorised for:
    /// - All holders, All tranches         systemOperators
    /// - All holders, tranche              trancheDefaultOperators
    /// - holder, All tranches              authorizedOperators
    /// - holder, tranche                   trancheAuthorizedOperators
    
    address[] systemOperators;
    // operator -> index
    mapping(address => uint) systemOperatorsIndex;
    // operator -> status
    mapping(address => bool) systemOperatorsStatus;

    // tranche -> default operators[]
    mapping(bytes32 => address[]) trancheDefaultOperators;
    // tranche -> operator -> index
    mapping(bytes32 => mapping(address => uint)) trancheDefaultOperatorsIndex;
    // tranche -> operator -> status
    mapping(bytes32 => mapping(address => bool)) trancheDefaultOperatorsStatus;

    // investor -> tranche -> authorized operators[]
    mapping(address => mapping(bytes32 => address[])) trancheAuthorizedOperators;
    // investor -> tranche -> operator -> index
    mapping(address => mapping(bytes32 => mapping(address => uint))) trancheAuthorizedOperatorsIndex;
    // investor -> tranche -> operator -> status
    mapping(address => mapping(bytes32 => mapping(address => bool))) trancheAuthorizedOperatorsStatus;

    // investor -> operators
    mapping(address => address[]) authorizedOperators;
    // investor -> operator -> index
    mapping(address => mapping(address => uint)) authorizedOpearatorIndex;
    // investor -> operator -> status
    mapping(address => mapping(address => bool)) authorizedOpearatorStatus;

    // Transfer Events
    event SentByTranche(
        bytes32 indexed fromTranche,
        address operator,
        address indexed from,
        address indexed to,
        uint256 amount,
        bytes data,
        bytes operatorData
    );

    // Operator Events
    event AuthorizedSystemOperator(address indexed operator);
    event RevokedSystemOperator(address indexed operator);
    
    event AuthorizedDefaultOperator(address indexed operator, bytes32 indexed tranche);
    event RevokedDefaultOperator(address indexed operator, bytes32 indexed tranche);
    
    event AuthorizedOperatorByTranche(bytes32 indexed tranche, address indexed operator, address indexed tokenHolder);
    event RevokedOperatorByTranche(bytes32 indexed tranche, address indexed operator, address indexed tokenHolder);

    // Burn
    event Burned(address indexed operator, address indexed from, uint amount, bytes data, bytes operatorData);
    event BurnedByTranche(bytes32 indexed tranche, address indexed operator, address indexed from, uint amount, bytes data, bytes operatorData);

    // Mint
    event Minted(address indexed operator, address indexed to, uint amount, bytes data, bytes operatorData);
    event MintedByTranche(bytes32 indexed tranche, address indexed operator, address indexed to, uint amount, bytes data, bytes operatorData);

    /**
    * @notice To send tokens from a specific tranche
    * @param _tranche Tranches to be sent
    * @param _to Recipient addresses
    * @param _amount Amounts
    * @param _data Parameter allows the caller to supply any additional authorisation or details associated with the transfer
    */
    function sendByTranche(
        bytes32 _tranche,
        address _to,
        uint256 _amount,
        bytes _data
    ) 
        public 
        returns (bytes32) 
    {
        // TODO implement _data parameter

        _sendByTranche(
            _tranche,
            address(0),
            msg.sender,
            _to,
            _amount,
            _data,
            ""
        );

        return _tranche;
    }

    /**
    * @notice Allows an operator to send security tokens on behalf of a token holder.
    * @param _tranche Tranche to be sent
    * @param _from Token holder address
    * @param _to Recipient addresse
    * @param _amount Amount
    * @param _data Parameter allows the caller to supply any additional authorisation or details associated with the transfer
    * @param _operatorData Parameter allows the caller to supply any additional authorisation or details associated with the transfer
    */
    function operatorSendByTranche(
        bytes32 _tranche,
        address _from,
        address _to,
        uint256 _amount,
        bytes _data,
        bytes _operatorData
    ) 
        public
        returns (bytes32)
    {
        require(isOperatorForTranche(_tranche, msg.sender, _from), "Operation not allowed.");

        _sendByTranche(
            _tranche,
            msg.sender,
            _from,
            _to,
            _amount,
            _data,
            _operatorData
        );

        return _tranche;
    }

    /**
    * @notice Send tokens
    */
    function _sendByTranche(
        bytes32 _tranche,
        address _operator,
        address _from,
        address _to,
        uint256 _amount,
        bytes _data,
        bytes _operatorData
    ) 
        internal 
    {
        require(_to != address(0), "Invalid recipient address.");
        require(balances[_from][_tranche] >= _amount, "Insufficient funds.");

        balances[_from][_tranche] = balances[_from][_tranche].sub(_amount);
        balances[_to][_tranche] = balances[_to][_tranche].add(_amount);

        // Transfer Event
        emit SentByTranche(
            _tranche,
            _operator,
            _from,
            _to,
            _amount,
            _data,
            _operatorData
        );
    }

    /**
    * @notice Add default operator for specific tranche
    * @param _tranche Tranche
    * @param _operator Operator which will be added
    */
    function _setDefaultOperatorForTranche(bytes32 _tranche, address _operator) internal {
        require(createdTranches[_tranche], "Tranche is not created.");

        uint index = trancheDefaultOperators[_tranche].length;

        trancheDefaultOperatorsIndex[_tranche][_operator] = index;
        trancheDefaultOperatorsStatus[_tranche][_operator] = true;
        trancheDefaultOperators[_tranche].push(_operator);

        emit AuthorizedDefaultOperator(_operator, _tranche);
    }

    /**
    * @notice Add default operator for specific tranche
    * @param _operator Operator which will be added
    */
    function _setDefaultOperator(address _operator) internal {
        require(!systemOperatorsStatus[_operator], "System operator allready added.");
        
        uint index = systemOperators.length;

        systemOperatorsIndex[_operator] = index;
        systemOperatorsStatus[_operator] = true;
        systemOperators.push(_operator);

        emit AuthorizedSystemOperator(_operator);
    }

    /**
    * @notice Set default operators
    * @notice all tranches -> all holders
    * @param operators Operators array 
    */
    function _setDefaultOperators(address[] operators) internal {
        for (uint i = 0; i < operators.length; i++) {
            _setDefaultOperator(operators[i]);
        }
    }

    /**
    * @notice Revoke system operator
    * @param _operator Operator address which will be revoked
    */
    function _revokeSystemOperator(address _operator) internal {
        require(systemOperatorsStatus[_operator], "Provided account is not system operator.");

        uint index = systemOperatorsIndex[_operator];
        uint last = systemOperators.length.sub(1);

        if (last > 0) {
            address toUpdate = systemOperators[last];
            systemOperators[index] = toUpdate;
            systemOperatorsIndex[toUpdate] = index;
        }

        delete systemOperators[last];
        delete systemOperatorsStatus[_operator];
        systemOperators.length = last;

        emit RevokedSystemOperator(_operator);
    }

    /**
    * @notice Revoke default operator from the tranche
    * @param _tranche Tranche
    * @param _operator Operator address which will be revoked
    */
    function _revokeDefaultOperator(bytes32 _tranche, address _operator) internal {
        require(trancheDefaultOperatorsStatus[_tranche][_operator], "Provided account is not operator for tranche.");

        uint index = trancheDefaultOperatorsIndex[_tranche][_operator];
        uint last = trancheDefaultOperators[_tranche].length.sub(1);

        if (last > 0) {
            address toUpdate = trancheDefaultOperators[_tranche][last];
            trancheDefaultOperators[_tranche][index] = toUpdate;
            trancheDefaultOperatorsIndex[_tranche][toUpdate] = index;
        }

        delete trancheDefaultOperators[_tranche][last];
        delete trancheDefaultOperatorsStatus[_tranche][_operator];
        trancheDefaultOperators[_tranche].length = last;

        emit RevokedDefaultOperator(_operator, _tranche);
    }

    /**
    * @notice Authorize operator
    * @param _tranche Tranche from which will be authorized operator
    * @param _operator Operator that will be authorized
    */
    function authorizeOperatorByTranche(bytes32 _tranche, address _operator) public {
        require(trancheAuthorizedOperatorsStatus[msg.sender][_tranche][_operator], "The operator already authorized.");
        
        uint index = trancheAuthorizedOperators[msg.sender][_tranche].length;
        
        trancheAuthorizedOperatorsIndex[msg.sender][_tranche][_operator] = index;
        trancheAuthorizedOperatorsStatus[msg.sender][_tranche][_operator] = true;

        trancheAuthorizedOperators[msg.sender][_tranche].push(_operator);

        emit AuthorizedOperatorByTranche(_tranche, _operator, msg.sender);
    }

    /**
    * @notice Returns system operators (All holders, All tranches)
    */
    function getSystemOperators() external view returns (address[]) {
        return systemOperators;
    }

    /**
    * @notice Returns default operators for tranche (All holders, tranche)
    * @param _tranche Tranche
    */
    function getDefaultTrancheOperators(bytes32 _tranche) external view returns (address[]) {
        return trancheDefaultOperators[_tranche];
    }

    /**
    * @notice Verify account if it is operator
    * @param _tranche Tranche
    * @param _operator Operator which will be verified
    * @param _tokenHolder Token holder address
    */
    function isOperatorForTranche(
        bytes32 _tranche, 
        address _operator,
        address _tokenHolder
    ) 
        public 
        view returns (bool)
    {
        bool isDefault = trancheDefaultOperatorsStatus[_tranche][_operator];
        bool isAuthorizedForTranche = trancheAuthorizedOperatorsStatus[_tokenHolder][_tranche][_operator];
        bool isSystemOperator = systemOperatorsStatus[_operator];
        bool isAuthorized = authorizedOpearatorStatus[_tokenHolder][_operator];

        return isDefault || isAuthorizedForTranche || isSystemOperator || isAuthorized; 
    }

    /**
    * @notice MUST query whether _operator is an operator for all tranches of _tokenHolder
    * @param tokenHolder Address to verify
    * @param operator Operator address
    */
    function isOperatorFor(address operator, address tokenHolder) public view returns (bool) {
        return authorizedOpearatorStatus[tokenHolder][operator];
    }

    /**
    * @notice Send tokens by multiple tranches
    * @param _tranches Tranches to be sent
    * @param _from Token holder address
    * @param _to Recipient addresses
    * @param _amounts Amounts
    * @param _data Parameter allows the caller to supply any additional authorisation or details associated with the transfer
    * @param _operatorData Parameter allows the caller to supply any additional authorisation or details associated with the transfer
    */
    function operatorSendByTranches(
        bytes32[] _tranches,
        address _from,
        address _to,
        uint256[] _amounts,
        bytes _data,
        bytes _operatorData
    ) 
        external 
        returns (bytes32[])
    {
        for (uint i = 0; i < _tranches.length; i++) {
            operatorSendByTranche(
                _tranches[i],
                _from,
                _to,
                _amounts[i],
                _data,
                _operatorData
            );
        }

        return _tranches;
    }

    /**
    * @notice Send tokens by multiple tranches
    * @param _tranches Tranches to be sent
    * @param _to Recipient addresses
    * @param _amounts Amounts
    * @param _data Parameter allows the caller to supply any additional authorisation or details associated with the transfer
    */
    function sendByTranches(
        bytes32[] _tranches, 
        address _to, 
        uint256[] _amounts, 
        bytes _data
    ) 
        external 
        returns (bytes32[])
    {
        for (uint i = 0; i < _tranches.length; i++) {
            sendByTranche(
                _tranches[i],
                _to,
                _amounts[i],
                _data
            );
        }

        return _tranches;
    }

    /**
    * @notice Add default operators for specific tranche
    * @param _tranche Tranche
    * @param _operators Operators array
    */
    function _setDefaultOperatorsForTranche(bytes32 _tranche, address[] _operators) internal {
        for (uint i = 0; i < _operators.length; i++) {
            _setDefaultOperatorForTranche(_tranche, _operators[i]);
        }
    }

    /**
    * @notice Authorize operators
    * @param _tranche Tranche from which will be authorized operator
    * @param _operators Operators array
    */
    function authorizeOperatorsByTranche(
        bytes32 _tranche,
        address[] _operators
    ) 
        external 
    {
        for (uint i = 0; i < _operators.length; i++) {
            authorizeOperatorByTranche(_tranche, _operators[i]);
        }
    }

    /**
    * @notice Revoke operator
    * @param _tranche Tranche from which will be revoked operator
    * @param _operator Operator that will be revoked
    */
    function revokeOperatorByTranche(bytes32 _tranche, address _operator) 
        external 
    {
        uint index = trancheAuthorizedOperatorsIndex[msg.sender][_tranche][_operator];
        uint last = trancheAuthorizedOperators[msg.sender][_tranche].length.sub(1);

        if (last > 0) {
            address toUpdate = trancheAuthorizedOperators[msg.sender][_tranche][last];
            trancheAuthorizedOperators[msg.sender][_tranche][index] = toUpdate;
            trancheAuthorizedOperatorsIndex[msg.sender][_tranche][toUpdate] = index;
        }

        delete trancheAuthorizedOperators[msg.sender][_tranche][last];
        delete trancheAuthorizedOperatorsStatus[msg.sender][_tranche][_operator];
        trancheAuthorizedOperators[msg.sender][_tranche].length = last;

        emit RevokedOperatorByTranche(_tranche, _operator, msg.sender);

    }

    /**
    * @notice Set token holder default tranches
    * @param _tranches Tranches array
    * @param _tokenHolder Token holder address
    */
    function setTokenHolderDefaultTranches(address _tokenHolder, bytes32[] _tranches) external {
        require(msg.sender == _tokenHolder || isOperatorFor(msg.sender, _tokenHolder), "Not allowed.");
        tokenHolderDefaultTranches[_tokenHolder] = _tranches;
    }

    /**
    * @notice Returns balance by specified tranche
    * @param _tranche Tranche id
    * @param _tokenHolder Address of the token holder
    */
    function balanceOfByTranche(bytes32 _tranche, address _tokenHolder) public view returns (uint) {        
        return balances[_tokenHolder][_tranche];
    }

    /**
    * @notice Returns list of all token holder tranches
    * @param _tokenHolder Address of the toke holder
    */
    function tranchesOf(address _tokenHolder) external view returns (bytes32[]) {
        uint length = tranches.length;
        bytes32[] memory result;
        bytes32 tranche;

        uint index = 0;
        for (uint i = 0; i < length; i++) {
            tranche = tranches[i];
            if (balances[_tokenHolder][tranche] > 0) {
                result[index] = tranche;
                index++;
            }
        }

        return result;
    }

    /**
    * @notice Returns default operators
    * @param _tranche Tranche
    */
    function defaultOperatorsByTranche(bytes32 _tranche) external view returns (address[]) {
        return trancheDefaultOperators[_tranche];
    }

    /**
    * @notice Returns list of default tranches
    */
    function getDefaultTranches(address _tokenHolder) public view returns (bytes32[]) {
        if (tokenHolderDefaultTranches[_tokenHolder].length > 0) {
            return tokenHolderDefaultTranches[_tokenHolder];
        }

        return defaultTranches;
    }

    /**
    * @notice Checking if default tranches are configured
    * @param _tokenHolder Token holder address to be checked
    */
    function hasDefaultTranches(address _tokenHolder) public view returns (bool) {
        if (tokenHolderDefaultTranches[_tokenHolder].length > 0
            || defaultTranches.length > 0
        ) {
            return true;
        }

        return false;
    }

    /**
    * @notice Returns token holder default tranches
    */
    function getTokenHolderDefaultTranches(address _tokenHolder) external view returns (bytes32[]) {
        return tokenHolderDefaultTranches[_tokenHolder];
    }

    /**
    * @notice Mint tokens
    * @param to Issued tokens recipient
    * @param tranche Identifier of the tranche
    * @param amount Number of the tokens that are issued
    * @param data Data
    */
    function _mint(
        address to, 
        bytes32 tranche, 
        uint amount,
        bytes data
    ) 
        internal
    {
        require(to != address(0), "Invalid token holder address.");
        require(tranche != bytes32(""), "Invalid tranche.");

        if (!createdTranches[tranche]) {
            createdTranches[tranche] = true;
            tranches.push(tranche);
        }

        // Update total supply and token holder balance
        _totalSupply = _totalSupply.add(amount);
        balances[to][tranche] = balances[to][tranche].add(amount);

        // event Minted() and event MintedByTranche() MUST be emited for any increases in token supply
        emit Minted(address(0), to, amount, data, "");
        emit MintedByTranche(tranche, address(0), to, amount, data, "");        
    }

    /**
    * @notice Burn tokens
    * @param tranche Tranche from which tokens will be removed
    * @param operator Operator address
    * @param from Token holder address
    * @param amount Number of the tokens that are burned
    * @param data Data
    * @param operatorData Operator data
    */
    function _burn(
        bytes32 tranche,
        address operator,
        address from, 
        uint amount,
        bytes data,
        bytes operatorData
    ) 
        internal 
    {
        require(balances[from][tranche] >= amount, "Invalid amount.");

        // Update total supply and token holder balance
        _totalSupply = _totalSupply.sub(amount);
        balances[from][tranche] = balances[from][tranche].sub(amount);

        // Write info to the log
        // event Burned() and event BurnedByTranche() MUST be emited for any decreases in token supply
        emit Burned(operator, from, amount, data, operatorData);
        emit BurnedByTranche(tranche, operator, from, amount, data, operatorData);
    }

    /**
    * @notice Burn tokens from default tranches
    * @param operator Operator address
    * @param from Token holder address
    * @param amount Number of the tokens that are burned
    * @param data Data
    * @param operatorData Operator data
    */
    function burnFromDefaultTranches(
        address operator,
        address from, 
        uint amount,
        bytes data,
        bytes operatorData
    ) 
        internal 
    {
        // operatorBurn() MUST obtain default tranche using getDefaultTranche()
        // burn() MUST obtain default tranche using getDefaultTranche()
        bytes32[] memory dTranches = getDefaultTranches(from);
        uint burned;
        uint balance;
        uint toBurn;
        for (uint i = 0; i < dTranches.length; i++) {
            balance = balanceOfByTranche(dTranches[i], from);
            if (balance == 0) {
                continue;
            }

            if (operator != address(0)) {
                require(isOperatorForTranche(dTranches[i], operator, from), "Operation not allowed.");
            }

            toBurn = (balance < amount - burned) ? balance : amount - burned;

            burned = burned.add(toBurn);
            _burn(
                dTranches[i],
                operator,
                from, 
                amount,
                data,
                operatorData
            );
        }

        require(burned == amount, "Insufficient funds.");
    }

    /**
    * @notice Transfer tokens from default tranches
    * @param from Address from which tokens will be transferred
    * @param to Recipient address
    * @param operator Operator address
    * @param amount Amount of the tokens which will be transfered
    * @param data Data
    * @param operatorData Operator data
    */
    function transferFromDefaultTranches(
        address from,
        address to,
        address operator,
        uint amount,
        bytes data,
        bytes operatorData
    )
        internal
    {
        bytes32[] memory dTranches = getDefaultTranches(from);
        uint sended;
        uint balance;
        uint toSend;
        for (uint i = 0; i < dTranches.length; i++) {
            balance = balanceOfByTranche(dTranches[i], from);
            if (balance == 0) {
                continue;
            }

            if (operator != address(0)) {
                require(isOperatorForTranche(dTranches[i], operator, from), "Operation not allowed.");
            }

            toSend = (balance < amount - sended) ? balance : amount - sended;

            sended = sended.add(toSend);
            _sendByTranche(
                dTranches[i],
                operator,
                from,
                to,
                toSend,
                data,
                operatorData
            );
        }

        require(sended == amount, "Insufficient funds.");
    } 

    /**
    * @notice Returns balance for speccfic tranche
    */
    function balanceOfTranche(address _tokenHolder, bytes32 _tranche) external view returns (uint) {
        return balances[_tokenHolder][_tranche];
    }
}