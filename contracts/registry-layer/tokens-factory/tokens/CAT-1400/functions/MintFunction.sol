pragma solidity >0.4.99 <0.6.0;


/**
* @title Permission module interface
*/
contract IPM {
    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    * @param subId Additional role identifier
    */
    function allowedForTokenWithSubId(
        bytes4 methodId,
        address sender,
        address token,
        bytes32 subId
    ) 
        public
        view
        returns (bool);
}

/**
* @title CAT-1400 mint function
*/
contract MintFunction {
    /**
    * @notice Verify permission for the method and sender wallet
    * @param method Requested method
    * @param sender Transaction sender address
    * @param partition Partition identitfier
    */
    modifier verifyPermission(bytes4 method, address sender, bytes32 partition) {
        address pm;
        assembly {
            pm := sload(0x0A)
        }
        require(
            IPM(pm).allowedForTokenWithSubId(
                method,
                sender,
                address(this),
                partition
            ),
            "Declined by Permission Module"
        );

        _;
    }

    /**
    * @notice Write info the log about tokens transfer
    * @param from Sender address
    * @param to A recipient address
    * @param value Number of the transferred tokens
    * @dev Implemented for backward compatibility with ERC-20
    * @dev https://theethereum.wiki/w/index.php/ERC20_Token_Standard
    */
    event Transfer(address indexed from, address indexed to, uint256 value);
    
    /**
    * @notice Write info to the log about tokens transfer in the partition
    * @param fromPartition Partition identifier
    * @param operator Operator address
    * @param from Sender's address
    * @param to Address of the recipient
    * @param value Number of the transferred tokens
    * @param data Additional data
    * @param operatorData Additional data from the operator
    * @dev https://github.com/ethereum/EIPs/issues/1411
    */
    event TransferByPartition(
        bytes32 indexed fromPartition,
        address operator,
        address indexed from,
        address indexed to,
        uint256 value,
        bytes data,
        bytes operatorData
    );

    /**
    * @notice Write info to the log about new partition
    * @param partition Partition identifier
    */
    event PartitionCreated(bytes32 indexed partition);

    /**
    * @notice Mint tokens to the partition
    * @param partition Partition identifier
    * @param to A recipient address
    * @param value Number of the tokens to mint
    * @dev sig: 0x06a69bfc
    */
    function mintByPartition(bytes32 partition, address to, uint256 value) 
        external
        verifyPermission(msg.sig, msg.sender, partition)
    {
        require(partition != bytes32(0x00), "Invalid partition");
        require(to != address(0x00), "Invalid recipient address");
        require(value != 0x00, "Invalid number of the tokens");

        bytes32 recipientKey = getBalanceKey(partition, to);

        uint recipientBal;
        assembly {
            recipientBal := sload(recipientKey)
        }
        assert(recipientBal + value > recipientBal);

        assembly{
            sstore(recipientKey, add(recipientBal, value))
        }

        writeInfoToTheLog(partition, to, value);
        registerPartitionIfNotRegistred(partition);
        updateTotalSupply(value);
        updatePartitionTotalSupply(partition, value);
    }

    /**
    * @notice Generate storage key for the balances 
    * @dev The positions are found by adding an offset of keccak256(k1 . k2 . p)
    * @dev Balances mapping position in the storage = 0x3EB
    * @dev mapping(bytes32=>mapping(address=>uint256))
    * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
    * @param holder Token holder address
    * @param partition Partition identifier
    * @return hash which represents storage key
    */
    function getBalanceKey(bytes32 partition, address holder) internal pure returns (bytes32 key) {
        bytes memory buffer = new bytes(0x5C);
        assembly {
            mstore(add(buffer, 0x20), partition)
            mstore(add(buffer, 0x40), holder)
            mstore(add(buffer, 0x5C), 0x3EB)
        }
        
        return keccak256(buffer);
    }

    /**
    * @notice Generate storage key for the partition registration status
    * @dev The positions are found by adding an offset of keccak256(k . p)
    * @dev Partitions list position in the storage = 0x3EE
    * @dev mapping(bytes32=>bool)
    * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
    * @param partition Partition identifier
    * @return hash which represents storage key
    */
    function getPartitionStatusKey(bytes32 partition) internal pure returns (bytes32) {
        bytes memory buffer = new bytes(0x40);
        assembly {
            mstore(add(buffer, 0x20), partition)
            mstore(add(buffer, 0x40), 0x3EE)
        }
        return keccak256(buffer);
    }

    /**
    * @notice Generate storage key for the partitions list
    * @dev The positions are found by adding an offset of keccak256(k . p)
    * @dev Partitions list position in the storage = 0x3EC
    * @dev bytes32[]
    * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage s
    * @param index Partition index in the list
    * @return hash which represents storage key
    */
    function getPartitionsListKey(uint index) internal pure returns (bytes32) {
        bytes memory buffer = new bytes(0x040);
        assembly {
            mstore(add(buffer, 0x20), index)
            mstore(add(buffer, 0x40), 0x3EC)
        }
        return keccak256(buffer);
    }

    /**
    * @notice Generate storage key for the partition index in the list
    * @dev The positions are found by adding an offset of keccak256(k . p)
    * @dev Partitions list position in the storage = 0x3ED
    * @dev mapping(bytes32=>uint)
    * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
    * @param partition Partition identifier
    * @return hash which represents storage key
    */
    function getPartitionIndexKey(bytes32 partition) internal pure returns (bytes32) {
        bytes memory buffer = new bytes(0x040);
        assembly {
            mstore(add(buffer, 0x20), partition)
            mstore(add(buffer, 0x40), 0x3ED)
        }
        return keccak256(buffer);
    }

    /**
    * @notice Generate storage key for the partition total supply key
    * @dev The positions are found by adding an offset of keccak256(k . p)
    * @dev Partitions list position in the storage = 0x3EF
    * @dev mapping(bytes32=>uint)
    * @dev https://solidity.readthedocs.io/en/v0.5.0/miscellaneous.html#layout-of-state-variables-in-storage
    * @param partition Partition identifier
    * @return hash which represents storage key
    */
    function getPartitionTotalSupplyKey(bytes32 partition) internal pure returns (bytes32) {
        bytes memory buffer = new bytes(0x040);
        assembly {
            mstore(add(buffer, 0x20), partition)
            mstore(add(buffer, 0x40), 0x3EF)
        }
        return keccak256(buffer);
    }

    /**
    * @notice Register partition in the partitions list
    * @param partition Partition identifier
    */
    function registerPartitionIfNotRegistred(bytes32 partition) internal returns (bool) {
        bool isRegistered;
        bytes32 statusKey = getPartitionStatusKey(partition);
        assembly {
            isRegistered := sload(statusKey) 
        }
        if (isRegistered) {
            return false;
        }
        uint length;
        assembly {
            length := sload(0x3EC)
        }
        uint index = length + 1;
        assert(index > length);

        isRegistered = true;
        bytes32 indexKey = getPartitionIndexKey(partition);
        bytes32 listKey = getPartitionsListKey(length);
        assembly{
            sstore(statusKey, isRegistered)
            sstore(0x3EC, index)
            sstore(indexKey, index)
            sstore(listKey, partition)
        }

        emit PartitionCreated(partition);

        return true;
    }

    /**
    * @notice Update token total supply (all partitions)
    * @param value Number of the tokens to be added
    */
    function updateTotalSupply(uint value) internal {
        uint current;
        assembly {
            current := sload(0x03)
        }
        uint newSupply = current + value;
        assert(newSupply > current);

        assembly {
            sstore(0x03, newSupply)
        }
    }

    /**
    * @notice Update partition total supply
    * @param partition Partition identifier
    * @param value Number of the tokens to add
    */
    function updatePartitionTotalSupply(bytes32 partition, uint value) internal {
        uint currentSupply;
        bytes32 totalSupplyKey = getPartitionTotalSupplyKey(partition);
        assembly {
            currentSupply := sload(totalSupplyKey)
        }
        uint newSupply = currentSupply + value;
        assert(newSupply > currentSupply);

        assembly{
            sstore(totalSupplyKey, newSupply)
        }
    }

    /**
    * @notice Write info to the log about transfer
    * @param partition Partition identifier
    * @param to A recipient address
    * @param value Number of the tokens
    */
    function writeInfoToTheLog(bytes32 partition, address to, uint256 value) internal {
        // ERC-20 transfer event
        emit Transfer(address(0x00), to, value);

        bytes memory data = new bytes(0x00);
        bytes memory operatorData = new bytes(0x00);

        // ERC-14000 transfer event
        emit TransferByPartition(
            partition,
            address(0x00),
            address(0x00),
            to,
            value,
            data,
            operatorData
        );
    }
}