Add account to the white list
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