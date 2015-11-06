# Magic escrow button

This Dapp uses [this simple escrow contract](https://gist.github.com/chriseth/b16e8e76a423b7671e99) to make a button itself the escro service.

Simple change the contract address of the `{{> buyButton}}` in the index.html to a newly deployed contract.

Then visit this page in mist or enable your ethereum nodes RPC at http://localhost:8545 with the seller account (The creator of the contract),
or with a buyers account.