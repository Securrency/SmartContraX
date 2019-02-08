## Initialize token
```bash
# Run script:
$ node cli/project-cli.js token

# Press enter to use localhost or select the supported network.

# Enter previously created token address:
Enter token address: 0x0......
# Enter token initialization command:
Enter command: init
# Specify account (wallet must be with compliance role)
Send request from: 0x0......
# Enter address. You can get it on the migration step or from our release notes
Components registry address: 0x0......
```

After initialization in the token will be enabled method that allows attach new methods to the token

## Attach methods to the CAT-20 token
```bash
# Enter the command for method initialization:
Enter command: setI
# Specify account (wallet must be with compliance role)
Send request from: 0x0......
# Select method to be included. You can get it on the migration step or from our release notes
# Link on the supported methods is provided below.
Method id: 0x70a08231
# Method implementation smart contract address.
# You can get it on the migration step or from our release notes
Method implementation: 0x0......
# Repeat these steps for all methods that you want to add to the token
```

[List of the CAT-20 methods](../tokens/CAT-20/methods/list.md)
