pragma solidity >0.4.99 <0.6.0;

import "../CAT20TokenStorage.sol";
import "./verify-transfer/CAT20REVerifyTransfer.sol";
import "../../../../../common/libraries/SafeMath.sol";


/**
* @title CAT-20 Token transfer methods
* @dev ERC-20 transfer methods extended by balance verification with escrow
*/
contract CAT20Transfer is CAT20TokenStorage {
    // Define libraries
    using SafeMath for uint256;

    // Write info to the log about tokens transfer
    event Transfer(address indexed from, address indexed to, uint256 value);

    /**
    * @notice Update balances
    * @param from Sender address
    * @param to Recipient address
    * @param tokens the amount of tokens to be transferred
    */
    function _transfer(address from, address to, uint tokens) internal returns (bool) {
        require(to != address(0x00), "Invalid recipient address");
        require(tokens > 0x00, "Invalid number of the tokens");

        require(
            balances[from] >= tokensOnEscrow[from].add(tokens),
            "Insufficient funds"
        );

        balances[from] = balances[from].sub(tokens);
        balances[to] = balances[to].add(tokens);

        emit Transfer(from, to, tokens);

        return true;
    }

    /**
    * @notice Update balances
    * @param from Sender address
    * @param to Recipient address
    * @param tokens the amount of tokens to be transferred
    */
    function _transferFrom(
        address from,
        address to,
        uint256 tokens
    )
        internal
        returns (bool)
    {
        uint allowedTokens = allowed[from][msg.sender];
        require(allowedTokens >= tokens, "Transfer not allowed");

        allowed[from][msg.sender] = allowedTokens.sub(tokens);
        
        return _transfer(from, to, tokens);
    }
}