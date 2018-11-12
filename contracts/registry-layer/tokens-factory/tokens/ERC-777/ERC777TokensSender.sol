pragma solidity ^0.4.24;


/**
* @notice Tokens sender
*/
contract ERC777TokensSender {
    function tokensToSend(
        address operator,
        address from,
        address to,
        uint amount,
        bytes userData,
        bytes operatorData
    ) 
        public;
}