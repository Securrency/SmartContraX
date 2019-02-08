## Register symbol

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