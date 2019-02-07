pragma solidity >0.4.99 <0.6.0;


/**
 * @title Compliance Aware Token (CAT-20)
 */
contract CAT20TokenV2 {
    // Stores token name
    string public name;
    // Stores token symbol
    string public symbol;
    // Stores number of the token decimals
    uint8 public decimals;
    // Stores total tokens sypply
    uint256 public totalSupply_;
    
    /**
     * @notice Initialize token default parameters
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _decimals Number of the token decimals
     */
    constructor(
        string memory _name, 
        string memory _symbol,
        uint8 _decimals,
        address _setup
    ) 
        public 
    {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        
        bytes32 key = getImplKey(0x234a6ed8);
        assembly {
            sstore(key, _setup)
        }
    }

    /**
    * @notice Fallback function allowing to perform a delegatecall.
    * @notice This function will return whatever the implementation call returns
    */
    function () payable external {
        address _impl = implementation();
        require(_impl != address(0x00), "Method not found. 404 ((");
        
        assembly {
            let p := mload(0x40)
            calldatacopy(p, 0x00, calldatasize)
            let result := delegatecall(gas, _impl, p, calldatasize, 0x00, 0x00)
            let size := returndatasize
            returndatacopy(p, 0x00, size)
            
            switch result
            case 0x00 { revert(p, size) }
            default { return(p, size) }
        }
    }

    /**
     * @notice Query if a contract implements an interface
     * @param interfaceID The interface identifier, as specified in ERC-165
     * @dev Interface identification is specified in ERC-165
     * @dev https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md
     * @return `true` if the contract implements `interfaceID` and `interfaceID` is not 0xffffffff, `false` otherwise
     */
    function supportsInterface(bytes4 interfaceID) public view returns (bool) {
        if (interfaceID == 0xffffffff) {
            return false;
        }
        
        address impl;
        bytes32 key = getImplKey(interfaceID);
        assembly {
            impl := sload(key)
        }
        return impl != address(0x00);
    }
    
    /**
     * @notice Generate storage key for the balances 
     * @dev The positions are found by adding an offset of keccak256(k . p)
     * @dev Balances mapping position in the storage = 0x3E8
     * @dev mapping(address=>uint256)
     * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
     * @param holder Token holder address
     * @return hash which represents storage key
     */
    function getBalanceKey(address holder) internal pure returns (bytes32 key) {
        bytes memory buffer = new bytes(0x40);
        assembly {
            mstore(add(buffer, 0x20), holder)
            mstore(add(buffer, 0x40), 0x3E8)
        }
        
        return keccak256(buffer);
    }
    
    /**
     * @notice Generate storage key for methods implementations
     * @dev The positions are found by adding an offset of keccak256(k . p)
     * @dev Mapping of the methods implementations position in the storage = 0x3E9
     * @dev mapping(bytes4=>address)
     * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
     * @param sig Requested method signature
     * @return hash which represents storage key
     */
    function getImplKey(bytes4 sig) internal pure returns (bytes32) {
        bytes memory buffer = new bytes(0x40);
        assembly {
            mstore(add(buffer, 0x20), sig)
            mstore(add(buffer, 0x40), 0x3E9)
        }
        
        return keccak256(buffer);
    }
    
    /**
    * @notice Returns the address of the implementation where call will be delegated.
    */
    function implementation() internal view returns (address impl) {
        bytes4 sig;
        assembly {
            calldatacopy(0x00, 0x00, 0x04)
            sig := mload(0x00)
        }
        
        bytes32 key = getImplKey(sig);
        assembly {
            impl := sload(key)
        }
    }
}