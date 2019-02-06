pragma solidity ^0.5.0;


/**
 * @title BytesHelper
 * @dev Different operations with bytes
 */
library BytesHelper {
    /**
    * @notice Changes a string to upper case
    * @param base String to change
    */
    function toUpper(string memory base) internal pure returns (string memory) {
        bytes memory baseBytes = toUpperBytes(bytes(base));
        
        return string(baseBytes);
    }

    /**
    * @notice Change bytes to upper case
    * @notice baseBytes
    */
    function toUpperBytes(bytes memory baseBytes) internal pure returns (bytes memory) {
        for (uint i = 0; i < baseBytes.length; i++) {
            bytes1 b1 = baseBytes[i];
            if (b1 >= 0x61 && b1 <= 0x7A) {
                b1 = bytes1(uint8(b1)-32);
            }
            baseBytes[i] = b1;
        }
        return baseBytes;
    }

    /**
    * @notice Convert from type "bytes memory" to "bytes6"
    */
    function convertBytesToBytes6(bytes memory inBytes) internal pure returns (bytes6 outBytes) {
        assembly {
            outBytes := mload(add(inBytes, 32))
        }
    }

    /**
    * @notice Convert address type to the bytes type
    * @param a Address to convert
    */
    function addressToBytes(address a) internal pure returns (bytes memory b){
       assembly {
            let m := mload(0x40)
            mstore(add(m, 20), xor(0x140000000000000000000000000000000000000000, a))
            mstore(0x40, add(m, 52))
            b := m
       }
    }
    
    /**
    * @notice Convert uint type to the bytes type
    * @param x Value to convert
    */
    function uintToBytes(uint x) internal pure returns (bytes memory b) {
        b = new bytes(32);
        assembly { 
            mstore(add(b, 32), x)
        }
    }
    
    /**
    * @notice Convert uint type to the bytes32 type
    * @param x Value to convert
    */
    function uintToBytes32(uint x) internal pure returns (bytes32 b) {
        assembly { 
            mstore(add(b, 32), x) 
        }
    }
     
    /**
    * @notice Cut firs 4 bytes
    * @param data Bytes
    */
    function cutFirst4Bytes(bytes memory data) internal pure returns (bytes4 outBytes) {
        bytes memory result = new bytes(4);
        for (uint8 i = 0; i < 4; i++) {
            result[i] = data[i];
        }
        assembly {
            outBytes := mload(add(result, 32))
        }
    }

    /**
    * @notice Cut 32 bytes and returns it as address
    * @param data Bytes
    * @param offset Offset from which bytes will be cut
    */
    function cutAddress(bytes memory data, uint16 offset) internal pure returns (address) {
        require(offset + 20 > offset, "Offset overflow.");

        bytes memory result = new bytes(20);
        uint16 num = 0;
        uint16 max = offset + 20;
        for (uint16 i = offset; i < max; i++) {
            result[num] = data[i];
            num++;
        }
        bytes20 outBytes;
        assembly {
            outBytes := mload(add(result, 32))
        }
        return address(outBytes);
    }
}