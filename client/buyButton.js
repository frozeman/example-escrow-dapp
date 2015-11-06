// initialize web3
if(typeof web3 === 'undefined')
    web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));


// auto update the accounts
EthAccounts.init();


var abi = [{"constant":true,"inputs":[],"name":"seller","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[],"name":"abort","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"value","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[],"name":"refund","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"buyer","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[],"name":"confirmReceived","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"state","outputs":[{"name":"","type":"uint8"}],"type":"function"},{"constant":false,"inputs":[],"name":"confirmPurchase","outputs":[],"type":"function"},{"inputs":[],"type":"constructor"},{"anonymous":false,"inputs":[],"name":"Aborted","type":"event"},{"anonymous":false,"inputs":[],"name":"PurchaseConfirmed","type":"event"},{"anonymous":false,"inputs":[],"name":"ItemReceived","type":"event"},{"anonymous":false,"inputs":[],"name":"Refunded","type":"event"}];

/**
Reads the contracts state

@method checkState
*/
var checkState = function(template) {
    template.contract.seller(function(error, seller) {
        if(!error) {
            TemplateVar.set(template, 'seller', seller);
        }
    });
    template.contract.buyer(function(error, buyer) {
        if(!error) {
            TemplateVar.set(template, 'buyer', buyer);
        }
    });
    template.contract.value(function(error, value) {
        if(!error) {
            TemplateVar.set(template, 'value', web3.fromWei(value,'ether').toString(10));
        }
    });
    template.contract.state(function(error, state) {
        if(!error) {
            TemplateVar.set(template, 'state', +state);
        }
    });
}

/**
Get the current user

@method getUser
*/
var getUser = function(){
    var user = 'unknown';

    // is buyer
    if(EthAccounts.findOne({address: TemplateVar.get('buyer')}))
        user = 'buyer';

    if(EthAccounts.findOne({address: TemplateVar.get('seller')}))
        user = 'seller';

    return user;
};

/**
Get the different states

@method states
*/
var states = function(){
    var value = TemplateVar.get('value') || 0;

    return {
        seller: {
            0: {
                class: 'dapp-error',
                buttonText: 'Cancel sale for '+ value +' ETHER',
                subText: 'Returns your security deposit of '+ value * 2 +' ETHER'
            },
            1: {
                class: 'dapp-error',
                buttonText: 'Refund buyer',
                subText: 'Returns everybodies security deposit of '+ value * 2 +' ETHER'
            },
            2: {
                class: 'dapp-disabled',
                buttonText: 'Item sold',
                subText: ''
            } 
        },
        buyer: {
            0: {
                class: '',
                buttonText: '',
                subText: ''
            },
            1: {
                class: 'dapp-success',
                buttonText: 'Confirm received',
                subText: 'Returns security deposit of '+ value +' ETHER'
            },
            2: {
                class: 'dapp-disabled',
                buttonText: 'Item sold',
                subText: ''
            } 
        },
        unknown: {
            0: {
                class: 'dapp-success',
                buttonText: 'Buy item for '+ value +' ETHER',
                subText: '+ '+ value +' ETHER security deposit'
            },
            1: {
                class: 'dapp-disabled',
                buttonText: 'Item sold',
                subText: ''
            },
            2: {
                class: 'dapp-disabled',
                buttonText: 'Item sold',
                subText: ''
            } 
        }
    };
};

/**
Call a contract method

@method callContractMethod
*/
var callContractMethod = function(template, method, from, value) {
    if(!template.contract || !_.isFunction(template.contract[method]))
        return;

    TemplateVar.set(template, 'processing', true);

    template.contract[method]({
        from: from,
        value: web3.toWei(value, 'ether'),
        gas: 100000
    }, function(error, txHash){
        
        if(!error) {
            console.log('Transaction send: '+ txHash);
        } else {
            TemplateVar.set(template, 'processing', false);
            console.error('Couldn\'t send transaciton', error);
            alert(error);
        }
    });
};



Template['buyButton'].onCreated(function(){
    var template = this;


    // stop here if no contract was given
    if(!template.data || !template.data.contract)
        return;

    // attach contract to the template instance
    template.contract = web3.eth.contract(abi).at(template.data.contract);

    // Load the current contract state
    checkState(template);


    // look for events
    template.events = template.contract.allEvents({fromBlock: 'latest', toBlock: 'latest'}, function(error, log){
        if(!error) {

            TemplateVar.set(template, 'processing', false);

            // check the state on each new event
            checkState(template);
        }
    });

});

Template['buyButton'].onDestroyed(function(){
    // stop listening to events when the template gets destroyed
    if(this.events)
        this.events.stopWatching();
});


Template['buyButton'].helpers({
    /**
    Returns the correct state
    
    @method (getState)
    */
    'getState': function(type) {
        return states()
            [getUser()]
            [TemplateVar.get('state') || 0]
            [type];
    }
});


Template['buyButton'].events({
    /**
    Act on the button click
    
    @event click button
    */
    'click button': function(e, template) {
        var buyer = TemplateVar.get('buyer'),
            seller = TemplateVar.get('seller'),
            state = TemplateVar.get('state'),
            value = TemplateVar.get('value');


        // is buyer
        if(EthAccounts.findOne({address: buyer})) {

            if(state === 1)
                callContractMethod(template, 'confirmReceived', buyer);

        // is seller
        } else if(EthAccounts.findOne({address: seller})) {

            if(state === 0)
                callContractMethod(template, 'abort', seller);

            if(state === 1)
                callContractMethod(template, 'refund', seller);

        // is unknown
        } else {
            if(state === 0)
                callContractMethod(template, 'confirmPurchase', EthAccounts.findOne().address, value*2);
        }
    }
});