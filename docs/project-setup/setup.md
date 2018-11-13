## Setup

```bash
# Install nodejs:
$ sudo apt install nodejs

# Install npm:
$ sudo apt install npm

# Install Truffle package globally:
$ npm install -g truffle

# Install ganache-cli:
$ npm install -g ganache-cli

# Install local node dependencies:
$ npm install

# Create file with "privateKey" private key in the root direcory (use this only for tests):
$ echo -n "77818cb7cde7c16a79759cc9198a307cdbe7f2de19cb8c9ad976225581806846" > privateKey

# Create file with mnemonic "mnemonic" in the cli directory 
# be sure that no line feed (LF) character on the second string (use this only for tests):
$ echo -n "rather off gold okay liar bless law dawn cross topic job sorry" > cli/mnemonic

# Run ganache with predefined accounts:
$ ganache-cli -m "rather off gold okay liar bless law dawn cross topic job sorry"

# now you can run tests:
$ truffle test

# Execute truffle migrations:
$ truffle migrate

# Execute cunfiguration script:
$ node cli/command.js permissionMatrixSetup localhost
```

After that, you can interact with smart contracts throughout CLI applications.