pragma solidity >0.4.99 <0.6.0;

import "./CAT1400TokenStorage.sol";


/**
* @title Compliance Aware Token (CAT-1400 partial fungible)
*/
contract CAT1400Token is CAT1400TokenStorage {
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

        methodsImplementations[bytes4(keccak256("initializeToken(address)"))] = _setup;
    }

    /**
    * @notice Fallback function allowing to perform a delegatecall.
    * @notice This function will return whatever the implementation call returns
    */
    function () payable external {
        address impl = methodsImplementations[msg.sig];
        require(impl != address(0x00), "Method not found. 404");
        
        assembly {
            let p := mload(0x40)
            calldatacopy(p, 0x00, calldatasize)
            let result := delegatecall(gas, impl, p, calldatasize, 0x00, 0x00)
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
        return interfaceID == 0xffffffff ? false : methodsImplementations[interfaceID] != address(0x00);
    }
}