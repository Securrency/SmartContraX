pragma solidity ^0.4.24;

import "./SecuritiesNFT.sol";

/**
* @title SLS-721 Token
*/
contract SLS721Token is SecuritiesNFT {
    constructor(
        string _name,
        string _symbol,
        address _issuer,
        address _transferModule,
        address _permissionModule
    ) 
        public
        ERC721Token(_name, _symbol)
        SecuritiesToken(_issuer)
        SecuritiesNFT(_transferModule)
        Protected(_permissionModule)
    { }

    /**
    * @dev Function to mint tokens
    * @param to The address that will receive the minted tokens.
    * @param tokenId The token id to mint.
    * @return A boolean that indicates if the operation was successful.
    */
    function mint(
        address to,
        uint256 tokenId
    )
        public
        verifyPermissionForCurrentToken(msg.sig, msg.sender)
        returns (bool)
    {
        _mint(to, tokenId);
        return true;
    }

    /**
    * @dev Function to mint tokens with token URI
    * @param to The address that will receive the minted tokens.
    * @param tokenId The token id to mint.
    * @param tokenURI URI which be added to the token.
    * @return A boolean that indicates if the operation was successful.
    */
    function mintWithTokenURI(
        address to,
        uint256 tokenId,
        string tokenURI
    )
        public
        returns (bool)
    {
        mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return true;
    }

    /**
    * @dev Function to burn a specific token
    * Reverts if the token does not exist
    * @param owner owner of the token to burn
    * @param tokenId uint256 ID of the token being burned by the msg.sender
    */
    function burn(address owner, uint256 tokenId) 
        public
        verifyPermissionForCurrentToken(msg.sig, msg.sender)
        returns (bool)
    {
        _burn(owner, tokenId);

        return true;
    }
}