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

# Create file with private key (use this only for tests):
$ touch privateKey && echo "77818cb7cde7c16a79759cc9198a307cdbe7f2de19cb8c9ad976225581806846" >> privateKey

# Create file with mnemonic (use this only for tests):
$ touch cli/mnemonic && echo "rather off gold okay liar bless law dawn cross topic job sorry" >> cli/mnemonic

# Run ganache with predefined accounts:
$ ganache-cli --account="0x77818cb7cde7c16a79759cc9198a307cdbe7f2de19cb8c9ad976225581806846, 1000000000000000000000" --account="0x37da9b70f33a72a65ae3b78d0e207934cd7c82a82f666e31b5e5b4fe286c7105, 1000000000000000000000" --account="0x75beebe6f939348b51a4b8d2d7666c420207d9762df9bcd4921a8908629a8bcb, 1000000000000000000000" --account="0x66d41b24420fc8dea6b1cc69ab5871879f544901cc2be98350f87a86eb5a2279, 1000000000000000000000" --account="0x7adcce00cde56bf5eeda14768d9f4d1d83737bafddf7f7aef28a3da8830c92c0, 1000000000000000000000" --account="0x3986b091e57bd33114c622d8263ebc976c19fdb4b8c9f86bc70db46214e4e8ad, 1000000000000000000000" --account="0xbad67ff3ba031285314a9dcbfdac1560470fa8187b26547fba44caffa0a33209, 1000000000000000000000" --account="0x665da31db90516eee55d596cce01c704dfed84b76b4047892aa3a2d9c2c7cb39, 1000000000000000000000" --account="0x6c07c5bd7676edbca9575fc265ea324d2ba6a09c6f3498f3cbe5f2f9d7dec633, 1000000000000000000000" --account="0xa128639ebbaef4c9538b293081c03f5e094dad410df3c91d0348c312ae8e20ae, 1000000000000000000000"

# 3. Execute truffle migrations:
$ truffle migrate

# Execute cunfiguration script:
$ node cli/command.js permissionMatrixSetup localhost
```

After that, you can interact with smart contracts throughout CLI applications.