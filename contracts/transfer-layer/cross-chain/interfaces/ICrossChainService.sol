pragma solidity ^0.5.0;

/**
* @notice Interface of the cross chain transfers service
*/
contract ICrossChainService {
    /**
    * @notice Add new supported chain for cross chain transfers
    * @param chain Chain name
    */
    function addNewChain(bytes32 chain) external;

    /**
    * @notice Remove chain
    * @param chain Chain name
    */
    function removeChain(bytes32 chain) external;

    /**
    * @notice Return list of the suppored chains
    */
    function getSupportedChains() external view returns (bytes32[] memory);

    /**
    * @notice Return chain identifier in the network
    * @param chain Chain name
    */
    function getChainId(bytes32 chain) public view returns (uint);

    /**
    * @notice Return chain name
    * @param chainId Chain identifier
    */
    function getChainById(uint chainId) public view returns (bytes32);

    /**
    * @notice Verify if chain is supported
    * @param chain Chain name
    */
    function isSupported(bytes32 chain) public view returns (bool);
}