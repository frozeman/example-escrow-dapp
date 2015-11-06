// This contract can be used to hold money while an item is in transit
// during purchase.
// This protocol is a variation of a protocol by Oleg Andreev which is
// described at
// https://gatecoin.com/blog/2015/10/blockchain2-disrupting-disrutors/
//
// Assume Bob wants to buy an item worth x Ether from Alice.
// Alice creates this contract and and sends 2x Ether to the contract
// together with its creation transaction.
// If Bob does not react, Alice can get her money back.
// Next, Bob sends 2x Ether to the contract.
// From now on, both Alice's and Bob's money is locked in the contract.
// Now, Alice sends the item to Bob.
// Bob receives the item, checks that it is what he expected and confirms
// this with a transaction to the contract. This causes the contract to be
// disabled and both getting their deposits plus/minus the item price back.
//
// If Bob does not receive the item or the item is not what he expected,
// he can negotiate with Alice (off-chain). The contract will keep
// their money until come to an agreement: Either Bob finally confirms
// or Alice fully refunds Bob.
// A more complex version of this contract could include an arbitrator who
// can be called if Alice and Bob cannot resolve their dispute.

contract Purchase
{
    uint public value;
    address public seller;
    address public buyer;
    enum State { Created, Locked, Inactive }
    State public state;

    /// Create a new locked purchase about
    /// `msg.value / 2` Wei.
    function Purchase()
        require(msg.value % 2 == 0)
    {
        seller = msg.sender;
        value = msg.value / 2;
    }

    modifier require(bool _condition)
    {
        if (!_condition) throw;
        _
    }
    modifier onlyBuyer()
    {
        if (msg.sender != buyer) throw;
        _
    }
    modifier onlySeller()
    {
        if (msg.sender != seller) throw;
        _
    }
    modifier inState(State _state)
    {
        if (state != _state) throw;
        _
    }

    event Aborted();
    event PurchaseConfirmed();
    event ItemReceived();
    event Refunded();

    /// Abort the purchase and reclaim the ether.
    /// Can only be called by the seller before
    /// the contract is locked.
    function abort()
        onlySeller
        inState(State.Created)
    {
        seller.send(this.balance);
        state = State.Inactive;
        Aborted();
    }
    /// Confirm the purchase as buyer.
    /// Transaction has to include `2 * value` Wei.
    /// The ether will be locked until either
    /// confirmReceived is called by the buyer
    /// or refund is called by the seller.
    function confirmPurchase()
        inState(State.Created)
        require(msg.value == 2 * value)
    {
        buyer = msg.sender;
        state = State.Locked;
        PurchaseConfirmed();
    }
    /// Confirm that you (the buyer) received the item.
    /// This will send `value` to the buyer and
    /// `3 * value` to the seller.
    function confirmReceived()
        onlyBuyer
        inState(State.Locked)
    {
        buyer.send(value); // We ignore the return value on purpose
        seller.send(this.balance);
        state = State.Inactive;
        ItemReceived();
    }
    /// Fully refund the buyer. This can only be called
    /// by the seller and will send `2 * value` both to
    /// the buyer and the sender.
    function refund()
        onlySeller
        inState(State.Locked)
    {
        buyer.send(2 * value); // We ignore the return value on purpose
        seller.send(this.balance);
        state = State.Inactive;
        Refunded();
    }
    function() { throw; }
}