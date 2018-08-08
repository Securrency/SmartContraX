pragma solidity ^0.4.24;

contract Utils {
    /**
    * @notice Changes a string to upper case
    * @param base String to change
    */
    function toUpper(string base) internal pure returns (string) {
        bytes memory baseBytes = toUpperBytes(bytes(base));
        
        return string(baseBytes);
    }

    /**
    * @notice Change bytes to upper case
    * @notice baseBytes
    */
    function toUpperBytes(bytes baseBytes) internal pure returns (bytes) {
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
    function addressToBytes(address a) internal pure returns (bytes b){
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
    function uintToBytes(uint x) internal pure returns (bytes b) {
        b = new bytes(32);
        assembly { 
            mstore(add(b, 32), x) 
        
        }
    }
    
}