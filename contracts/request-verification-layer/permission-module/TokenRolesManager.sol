pragma solidity ^0.5.0;

import "../../registry-layer/tokens-factory/interfaces/ITokensFactory.sol";
import "./interfaces/ITokenRolesManager.sol";
import "./RolesManager.sol";
import "../../common/libraries/SafeMath8.sol";
import "../../registry-layer/components-registry/instances/TokensFactoryInstance.sol";


/**
* @title Token roles manager
*/
contract TokenRolesManager is RolesManager, TokensFactoryInstance, ITokenRolesManager {
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
    */
    function addRoleForSpecificToken(
        address wallet,
        address token,
        bytes32 roleName
    ) 
        public
        validRole(roleName)
        onlyIssuer(token)
    {
        require(token != address(0), "Invalid token address.");

        bool walletHasRole = PMStorage().getTokenDependentRoleStatus(wallet, token, roleName); 
        require(!walletHasRole, "Role already added.");

        uint8 index = PMStorage().getTokenDependentRolesIndex(wallet,token);
        require(index <= rolesLimit, "The limit for number of roles has been reached.");

        PMStorage().setTokenDependentRoleStatus(
            wallet,
            token,
            roleName,
            true
        );
        PMStorage().setToTheTokenDependentList(
            wallet,
            token,
            roleName,
            index
        );
        PMStorage().setTokenDependentRoleIndex(
            wallet,
            token,
            roleName,
            index
        );

        PMStorage().setTokenDependentRolesIndex(wallet,token,index.add(1));
        PMStorage().emitTokenDependetRoleAdded(wallet, token, roleName);
    }

    /**
    * @notice Remove role from a specific token
    * @param wallet Wallet address
    * @param token Token address
    * @param roleName Name of the role which will be removed from the wallet
    */
    function removeRoleFromSpecificToken(
        address wallet,
        address token,
        bytes32 roleName
    ) 
        public
        validRole(roleName)
        onlyIssuer(token)
    {
        require(token != address(0), "Invalid token address.");
        
        bool walletHasRole = PMStorage().getTokenDependentRoleStatus(wallet, token, roleName); 
        require(walletHasRole, "The wallet has no this role.");

        PMStorage().setTokenDependentRoleStatus(wallet,token,roleName,false);

        uint8 index = PMStorage().getIndexOfTheTokeDependentRole(wallet,token,roleName);
        uint8 last = PMStorage().getTokenDependentRolesIndex(wallet,token).sub(1);

        if (last > 0) {
            bytes32 roleToUpdate = PMStorage().getTokenDependentRoleByIndex(wallet, token, last);
            PMStorage().setTokenDependentRoleIndex(wallet,token,roleToUpdate,index);
            PMStorage().setToTheTokenDependentList(wallet,token,roleToUpdate,index);
        }

        PMStorage().delTokenDependentRoleIndex(wallet,token,roleName);
        PMStorage().delTokenDependentRole(wallet,token,last);
        PMStorage().setTokenDependentRolesIndex(wallet,token,last);
        PMStorage().emitTokenDependetRoleDeleted(wallet, token, roleName);
    }

    /**
    * @notice Verification of the permissions
    * @param methodId Requested method
    * @param sender An address which will be verified
    * @param token Token address
    */
    function allowedForToken(
        bytes4 methodId,
        address sender,
        address token
    ) 
        public
        view
        returns (bool)
    {
        return PMStorage().checkTokenPermission(methodId, sender, token);
    }

    /**
    * @notice Returns list of all roles of the wallet
    */
    function getWalletRolesForToken(
        address wallet,
        address token
    ) 
        public
        view
        returns (bytes32[20] memory)
    {
        return PMStorage().getWalletRolesForToken(wallet, token);
    }
}