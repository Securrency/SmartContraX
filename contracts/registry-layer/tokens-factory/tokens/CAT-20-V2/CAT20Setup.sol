pragma solidity >0.4.99 <0.6.0;

import "./functions/CAT20Protected.sol";
import "../../../components-registry/interfaces/IComponentsRegistry.sol";


/**
* @notice CAT-20 token setup smart contract
* @dev Configure base token methods after token deploy
*/
contract CAT20Setup is CAT20Protected {
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
        for (uint i = 0; i < impls.length; i++) {
            methodsImplementations[sig[i]] = impls[i];
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
        componentsRegistryAddress = components;
        permissionModuleAddress = IComponentsRegistry(components).getAddressById(
            bytes4(keccak256("PermissionModule"))
        );
        transferModuleAddress = IComponentsRegistry(components).getAddressById(
            bytes4(keccak256("TransferModule"))
        );

        bytes4 initialize = bytes4(keccak256("initializeToken(address)"));
        bytes4 setImplementation = bytes4(keccak256("setImplementations(bytes4[],address[])"));

        methodsImplementations[setImplementation] = methodsImplementations[initialize];
        methodsImplementations[initialize] = address(0x00);
    }
}