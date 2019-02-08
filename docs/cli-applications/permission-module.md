## Add compliance role for the wallet
```bash
# Run script:
$ node cli/project-cli.js permissionModule

# Press enter to use localhost or select the supported network.
# Available commands:

--accounts (--a) Show list of all accounts
--createRole (--cr) Craete new role in the permission module
--getWalletRoles (--gwl) Get list of the wallet roles
--addRoleToTheWallet (--arttw) Add role to the wallet
--getRoleMethods (--grm) Get list of the role methods
--addMethodToTheRole (--amttr) Add method to the role
--removeMethodFromTheRole (--rmftr) Remove metod from the role
--addRoleForTheToken (--arftt) Add role for the specific token
--getListOfAllRoles (--gloar) Get list of the all roles
--createId (--ci) Create method id


--help Show list of all supported commands

# Add role to the wallet
Enter command: --addRoleForTheToken
# Role name
Enter role name: Compliance
# Enter wallet address
Account: 0x0......
# Enter token address that was created on the step 2
Enther token: 0x0...
# Specify sender (compliance role can add only token issuer)
Send from: 0x0......
```