pragma solidity >0.4.99 <0.6.0;


/**
* @notice Components registry template
*/
contract ICR {
    /**
    * @notice Return component address by component id
    * @param id Component identifier
    */
    function getAddressById(bytes4 id) public view returns (address);
}

/**
* @title Permission module interface
*/
contract IPM {
    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    */
    function allowed(bytes4 methodId, address sender, address token) public view returns (bool);
}

/**
* @notice CAT-20 token setup smart contract
* @dev Configure base token methods after token deploy
*/
contract SetupV1 {
    /**
    * @notice Verify permission for the method and sender wallet
    * @param method Requested method
    * @param sender Transaction sender address
    */
    modifier verifyPermission(bytes4 method, address sender) {
        address pm;
        assembly {
            pm := sload(0x0A)
        }
        require(IPM(pm).allowed(method, sender, address(this)), "Declined by Permission Module 1.");
        _;
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
     * @notice Save method implementation to the storage
     * @param sig Methods signatures
     * @param impls Addresses of the methods implementations
     * @dev method sig: 0xb90caaf5
     */
    function setImplementations(
        bytes4[] memory sig,
        address[] memory impls
    )
        public
        verifyPermission(msg.sig, msg.sender) 
    {
        bytes32 key;
        address impl;
        for (uint i = 0; i < impls.length; i++) {
            key = getImplKey(sig[i]);
            impl = impls[i];
            assembly {
                sstore(key, impl)
            }   
        }
    }

    /**
    * @notice Initialize base token methods
    * @param components Components registry
    * @dev method sig: 0x234a6ed8
    */
    function initializeToken(address components) public {       
        // create storege key for setup method
        // method will be removed after token creation
        bytes32 keySetupFunc = getImplKey(0x234a6ed8);
        bytes32 keyImplFunc = getImplKey(0xb90caaf5);

        address permissionModule = ICR(components).getAddressById(
            bytes4(keccak256("PermissionModule"))
        );
        address transferModule = ICR(components).getAddressById(
            bytes4(keccak256("TransferModule"))
        );  

        assembly {
            // set new method
            sstore(keyImplFunc, sload(keySetupFunc))
            // remove setup method from the token
            sstore(keySetupFunc, 0x00)

            // Setup system components
            sstore(0x0A,permissionModule)
            sstore(0x0B,transferModule)
        }
    }
}