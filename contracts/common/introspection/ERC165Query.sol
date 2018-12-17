pragma solidity ^0.5.0;


/**
* @title ERC165Query
* @dev https://github.com/ethereum/EIPs/blob/master/EIPS/eip-165.md
*/
contract ERC165Query {
    // Predefined ids
    bytes4 constant InvalidID = 0xffffffff;
    bytes4 constant ERC165ID = 0x01ffc9a7;
    string constant Method = "supportsInterface(bytes4)";

    /**
    * @notice Check if contract implement interface
    * @param contractAddr Contract address for verification
    * @param interfaceId Interface identifier
    */
    function implementInterface(
        address contractAddr, 
        bytes4 interfaceId
    ) 
        public 
        view 
        returns (bool) 
    {
        bool success;
        bytes memory result;
        bytes memory isset = new bytes(32);
        assembly { mstore(add(isset, 32), 1) }

        (success, result) = noThrowCall(contractAddr, ERC165ID);
        if ((!success)||(result[31] != isset[31])) {
            return false;
        }

        (success, result) = noThrowCall(contractAddr, InvalidID);
        if ((!success)||(result[31] == isset[31])) {
            return false;
        }

        (success, result) = noThrowCall(contractAddr, interfaceId);
        if ((success)&&(result[31] == isset[31])) {
            return true;
        }
        return false;
    }

    /**
    * @notice Execute call to the smart contract without throw
    * @param contractAddr Contract address for verification
    * @param interfaceId Interface identifier
    */
    function noThrowCall(
        address contractAddr,
        bytes4 interfaceId
    ) 
        internal
        view
        returns (bool, bytes memory) 
    {
        bytes memory payload = abi.encodeWithSignature(Method, interfaceId);

        return address(contractAddr).staticcall(payload);
    }
}