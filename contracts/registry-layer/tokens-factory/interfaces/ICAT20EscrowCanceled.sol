pragma solidity ^0.5.0;


/**
* @title ICAT20EscrowCanceled
* @notice Described method which allows receipt calls form the CAT-20 Token.
* @notice Escrow agents can implement own business logic for escrow processing 
*/
contract ICAT20EscrowCanceled {
    /**
    * @notice Equals to `bytes4(keccak256("cat20EscrowCanceled(address,uint256,uint256,bytes)"))`,
    * @dev which can be also obtained as `ICAT20EscrowCanceled(0).cat20EscrowCanceled.selector`
    */
    bytes4 internal constant ESCROW_CANCELED = 0x644e2427;

    /**
    * @notice Receipt calls from the CAT-20 token
    * @param tokenHolder Token holder address
    * @param tokensOnEscrow Number of the tokens on the escrow
    * @param escrowId Escrow identifier
    * @param callData Additional data
    */
    function cat20EscrowCanceled(
        address tokenHolder,
        uint tokensOnEscrow,
        bytes32 escrowId,
        bytes memory callData
    ) 
        public
        returns (bool);
}