## 1. Register symbol

```bash
# Run script:
$ node cli/project-cli.js symbolRegistry

# Press enter to use localhost or select the supported network.
# Available commands:

--transferOwnership (--to) Transfer symbol ownership
--getSymbolExpireDate (--gsed) Get symbol expire date
--registerSymbol (--regS) Register new symbol
--renewSymbol (--renS) Renew symbol
--isSymbolOwner (--iso) Check if address is symbol owner
--getExpirationInterval (--gei) Get expiration interval 
--updateExpirationInterval (--uei) Get expiration interval 
--accounts (--a) Show list of all accounts


--help Show list of all supported commands

# Register symbol:
Enter command: --registerSymbol
# Enter symbol owner account
# (for test use the same account that deployed contracts, for other accounts you must configure permission module):
Owner account: 0x0......
# Enter symbol
Symbol: T1
```

## 2. Create token
```bash
# Run script:
$ node cli/project-cli.js tokensGenerator

# Press enter to use localhost or select the supported network.

# Fill token name:
Enter token name: Test token name
# Specify token symbol (use already registered in the symbols registry)
Enter token symbol: T1
# Specify total sypply (only for CAT-20, CAT-721 must be 0)
Enter token total supply: 1000
# Enter token standard (CAT-20 || CAT-721)
Token standard: CAT-20
# Enter issuer account (must be the same as symbol owner):
Issuer: 0x0......
# Review token details and confirm transaction
```

## 3. Add compliance role for the wallet
```bash
# Run script:
$ node cli/project-cli.js tokensGenerator

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

## 4. Add account to the white list
```bash
# Run script:
$ node cli/project-cli.js whiteList

# Press enter to use localhost or select the supported network.
# Available commands:

--accounts (--a) Show list of all accounts
--add Add account tot he wahitelist
--remove Remove account from the whitelist
--checkAddress (--ca) Check address int the whitelist


--help Show list of all supported commands

# Add wallet to the whitelist
Enter command: --add
# Enter account that will be added to the whitelist
Account: 0x0...
# Specify token
Enter token address: 0x0...
# Specify an account which will send the transaction (account must have compliance role)
Send from: 0x0......

# Repeat for the other accounts and after that, you can transfer tokens between them
```