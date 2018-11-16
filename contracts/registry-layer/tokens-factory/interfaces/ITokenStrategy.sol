pragma solidity ^0.5.0;

/**
* @title Interface that any token strategy should implement
*/
contract ITokenStrategy {
    /**
    * @notice This function create new token depending on his standard
    * @param name Name of the future token
    * @param symbol Symbol of the future token
    * @param decimals The quantity of the future token decimals
    * @param totalSupply The number of coins
    * @param tokenOwner Token owner address
    */
    function deploy(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint totalSupply,
        address tokenOwner
    ) 
        public 
        returns (address); // system method

    /**
    * @notice This function returns token standard
    */
    function getTokenStandard() public view returns (bytes32);
}