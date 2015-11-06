# Magic escrow button

This Dapp uses [this simple escrow contract](https://gist.github.com/chriseth/b16e8e76a423b7671e99) to make a button itself the escro service.

Simple change the contract address of the `{{> buyButton}}` in the index.html to a newly deployed contract.

Then visit [this](http://ethereum-escrow-dapp.meteor.com) page in Mist or use your local ethereum node with RPC enabled (`geth --rpc --rpccorsdomain "http://ethereum-escrow-dapp.meteor.com"`).

If you visit and you have the seller account in `web3.eth.accounts` (The creator of the contract) you will interact with the button as the seller.
If you are a buyer you can buy the product and interact with the button as the buyer.