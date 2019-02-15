pragma solidity ^0.5.0;

import "../../registry-layer/tokens-factory/interfaces/ITokensFactory.sol";
import "./interfaces/IETokenRolesManager.sol";
import "./RolesManager.sol";
import "../../common/libraries/SafeMath8.sol";
import "../../registry-layer/components-registry/instances/TokensFactoryInstance.sol";


/**
* @title Token roles manager
*/
contract ETokenRolesManager is RolesManager, TokensFactoryInstance, IETokenRolesManager {
    // define libraries
    using SafeMath8 for uint8;

    /**
    * @notice Verify token issuer
    * @param token Address of the requested token
    */
    modifier onlyIssuer(address token) {
        address tokenIssuer = tfInstance().getIssuerByToken(token);
        require(tokenIssuer == msg.sender, "Allowed only for the issuer.");
        _;
    }

    /**
    * @notice Add role for a specific token
    * @param wallet Wallet address
    * @param token Token address
    * @param roleName Name of the role which will be added to the wallet
    * @param subId Additional role identifier
    */
    function addRoleForSpecificTokenWithSubId(
        address wallet,
        address token,
        bytes32 roleName,
        bytes32 subId
    )
        public
        validRole(roleName)
        onlyIssuer(token)
    {
        require(token != address(0), "Invalid token address.");

        bool walletHasRole = PMStorage2().getTokenDependentRoleStatusWithSubId(
            wallet,
            token,
            roleName,
            subId
        ); 
        require(!walletHasRole, "Role already added.");

        uint8 index = PMStorage2().getTokenDependentRolesIndexWithSubId(wallet,token,subId);
        require(index <= rolesLimit, "The limit for number of roles has been reached.");

        PMStorage2().setTokenDependentRoleStatusWithSubId(
            wallet,
            token,
            roleName,
            true,
            subId
        );
        PMStorage2().setToTheTokenDependentListWithSubId(
            wallet,
            token,
            roleName,
            index,
            subId
        );
        PMStorage2().setTokenDependentRoleIndexWithSubId(
            wallet,
            token,
            roleName,
            index,
            subId
        );

        PMStorage2().setTokenDependentRolesIndexWithSubId(wallet,token,index.add(1),subId);
        PMStorage2().emitTokenDependentRoleAddedWithSubId(wallet, token, roleName, subId);
    }

    /**
    * @notice Remove a role from a specific token
    * @param wallet Wallet address
    * @param token Token address
    * @param roleName Name of the role which will be removed from the wallet
    * @param subId Additional role identifier
    */
    function removeRoleFromSpecificTokenWithSubId(
        address wallet,
        address token,
        bytes32 roleName,
        bytes32 subId
    ) 
        public
        validRole(roleName)
        onlyIssuer(token)
    {
        require(token != address(0), "Invalid token address.");
        
        bool walletHasRole = PMStorage2().getTokenDependentRoleStatusWithSubId(
            wallet,
            token,
            roleName,
            subId
        ); 
        require(walletHasRole, "The wallet has no this role.");

        PMStorage2().removeRoleFromSpecificTokenWithSubId(
            wallet,
            token,
            roleName,
            subId
        );
    }

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
        returns (bool)
    {
        return PMStorage2().checkTokenPermissionWithSubId(methodId, sender, token, subId);
    }

    /**
    * @notice Returns list of all roles of the wallet
    */
    function getWalletRolesForTokenWithSubId(
        address wallet,
        address token,
        bytes32 subId
    ) 
        public
        view
        returns (bytes32[20] memory)
    {
        return PMStorage2().getWalletRolesForTokenWithSubId(wallet, token, subId);
    }
}