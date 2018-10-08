pragma solidity ^0.4.24;

import "./interfaces/ICrossChainService.sol";
import "./FromChain.sol";
import "./ToChain.sol";
import "../../helpers/Utils.sol";
import "../../request-verification-layer/permission-module/Protected.sol";

/**
* @title Cross chain transfer service
*/
contract CrossChainService is ICrossChainService, Protected, FromChain, ToChain {
    // chain identifier
    uint chainIdentifier = 0;

    // Declare storage for chains
    mapping(bytes32 => bool) supportedChains;

    // Declare storage for chains ids
    mapping(bytes32 => uint) chainsIds;

    // Declare storage for the chains indexes
    mapping(bytes32 => uint) chainsIndexes;

    // Chains list
    bytes32[] chains;

    // Write info to the log about new chain
    event ChainAdded(bytes32 chain, uint chainId);

    // Write info to the log when chain was removed
    event ChainRemoved(bytes32 chain, uint chainId);

    /**
    * @notice Add new supported chain for cross chain transfers
    * @param chain Chain name
    */
    function addNewChain(bytes32 chain)
        external
        verifyPermission(msg.sig, msg.sender)
    {
        require(chain.length > 0, "Invalid chain.");
        require(!supportedChains[chain], "Chain already added.");

        uint chainIndex = chains.length;
        chains.push(chain);
        chainsIndexes[chain] = chainIndex;
        chainsIds[chain] = chainIdentifier;
        chainIdentifier++;
        supportedChains[chain] = true;

        emit ChainAdded(chain, chainsIds[chain]);
    }

    /**
    * @notice Remove chain
    * @param chain Chain name
    */
    function removeChain(bytes32 chain) 
        external
        verifyPermission(msg.sig, msg.sender) 
    {
        require(chain.length > 0, "Invalid chain.");
        require(supportedChains[chain], "Chain is not supported.");

        uint chainIndex = chainsIndexes[chain];
        uint lastIndex = chains.length - 1;
        bytes32 lastChain = chains[lastIndex];

        chains[chainIndex] = lastChain;
        chainsIndexes[lastChain] = chainIndex;
        
        delete supportedChains[chain];
        delete chains[lastIndex];
        chains.length--;

        emit ChainRemoved(chain, chainsIds[chain]);
    }

    /**
    * @notice Return list of the suppored chains
    */
    function getSupportedChains() external view returns (bytes32[]) {
        return chains;
    }

    /**
    * @notice Return chain identifier in the network
    * @param chain Chain name
    */
    function getChainId(bytes32 chain) public view returns (uint) {
        return chainsIds[chain];
    }

    /**
    * @notice Return chain name
    * @param chainId Chain identifier
    */
    function getChainById(uint chainId) public view returns (bytes32) {
        return chains[chainId];
    }

    /**
    * @notice Verify if chain is supported
    * @param chain Chain name
    */
    function isSupported(bytes32 chain) public view returns (bool) {
        return supportedChains[chain];
    }
}