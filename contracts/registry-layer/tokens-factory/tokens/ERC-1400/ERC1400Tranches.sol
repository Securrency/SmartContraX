pragma solidity ^0.4.24;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";


/**
* @title ERC-1400. Part fungible token.
* @notice Backward compatible with ERC-777 & ERC-20
* @dev https://github.com/ethereum/EIPs/issues/1410
*/
contract ERC1400Tranches {
    // Define libraries
    using SafeMath for uint;
    
    /// Tranches
    ///
    /// All tranches that are created in the token                                  tranches
    /// Default tranches that will be used in transfer, send methods                defaultTranches
    /// Token holder default tranches that will be used in transfer, send methods   tokenHolderDefaultTranches
    ///
    /// Each token holder or operator of a token holder's full token balance for all 
    /// tranches MAY change the default tranche of the token holder.

    // All tranches that are created in the token
    bytes32[] tranches;
    // trache -> status
    mapping(bytes32 => bool) createdTranches;

    /// Default tranches
    bytes32[] defaultTranches;
    // tranche -> index
    mapping(bytes32 => uint) defaultTranchesIndexes;
    // tranche -> status
    mapping(bytes32 => bool) defaultTranchesStatus;

    // investor -> default tranches []
    mapping(address => bytes32[]) tokenHolderDefaultTranches;

    // Default tranches
    event DefaultTrancheAdded(bytes32 tranche);
    event DefaultTrancheRemoved(bytes32 tranche);

    /**
    * @notice Returns the number of tranches
    */
    function getTranchesLength() public view returns (uint) {
        return tranches.length;
    }

    /**
    * @notice Returns holder tranche by specific index
    * @param _index Tranche index
    */
    function getTrancheByIndex(uint _index) public view returns (bytes32) {
        return tranches[_index];
    }

    /**
    * @notice Returns list of all created tranches
    */
    function getTranches() public view returns (bytes32[]) {
        return tranches;
    }

    /**
    * @notice Set default tranches for all token holders
    * @param _tranches New tranches
    */
    function _setDefaultTranches(bytes32[] _tranches) internal {
        for (uint i = 0; i < _tranches.length; i++) {
            _addDefaultTranche(_tranches[i]);
        }
    }

    /**
    * @notice Set default trache
    * @param _tranche New tranche 
    */
    function _addDefaultTranche(bytes32 _tranche) internal {
        if (!defaultTranchesStatus[_tranche] && createdTranches[_tranche]) {
            uint index = defaultTranches.length;

            defaultTranchesIndexes[_tranche] = index;
            defaultTranchesStatus[_tranche] = true;
            defaultTranches.push(_tranche);

            emit DefaultTrancheAdded(_tranche);        
        }
        
    }

    /**
    * @notice Remove default tranche
    * @param _tranche Tranche to be removed 
    */
    function _removeDefaultTranche(bytes32 _tranche) internal {
        require(defaultTranchesStatus[_tranche], "Tranche has no default status.");

        uint index = defaultTranchesIndexes[_tranche];
        uint last = defaultTranches.length.sub(1);

        if (last > 0) {
            bytes32 toUpdate = defaultTranches[last];
            defaultTranches[index] = toUpdate;
            defaultTranchesIndexes[_tranche] = index;
        }

        delete defaultTranches[last];
        delete defaultTranchesStatus[_tranche];
        defaultTranches.length = last;

        emit DefaultTrancheRemoved(_tranche);
    }

    /**
    * @notice Returns default tranches
    */
    function getDefaultTranches() external view returns (bytes32[]) {
        return defaultTranches;
    }
}