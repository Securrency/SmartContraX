pragma solidity ^0.4.24;


/**
* @notice Tokens recipient
*/
contract ERC777TokensRecipient {
    function tokensReceived(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    ) 
        public;
}