## Create token
```bash
# Run script:
$ node cli/project-cli.js tokensGenerator

# Press enter to use localhost or select the supported network.

# Create token command:
Enter command: createToken
# Fill token name:
--///-- Enter token name: Test token name
# Specify token symbol (use already registered in the symbols registry)
--///-- Enter token symbol: T1
# Specify total sypply (only for CAT-20, CAT-721, CAT-20-V2 must be 0)
--///-- Enter token total supply: 0
# Enter token standard (CAT-20 || CAT-20-V2 || CAT-721)
--///-- Token standard: CAT-20-V2
# Enter issuer account (must be the same as symbol owner):
--///-- Issuer: 0x0......
# Review token details and confirm transaction
```