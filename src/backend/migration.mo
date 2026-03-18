import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";

module {
  // Old types from previous leaderboard canister
  type Score = {
    playerName : Text;
    escapeTime : Nat;
    levelReached : Nat;
  };

  type OldActor = {
    scores : List.List<Score>;
  };

  type NewActor = {
    products : Map.Map<Nat, { id : Nat; name : Text; description : Text; priceCents : Nat; imageUrl : Text; category : Text; inStock : Bool }>;
    orders : Map.Map<Nat, { id : Nat; customerName : Text; customerPhone : Text; customerAddress : Text; items : [{ productId : Nat; quantity : Nat }]; totalAmount : Nat; status : Text }>;
    nextProductId : Nat;
    nextOrderId : Nat;
  };

  // Migration function explicitly drops the old scores variable
  public func run(_old : OldActor) : NewActor {
    {
      products = Map.empty<Nat, { id : Nat; name : Text; description : Text; priceCents : Nat; imageUrl : Text; category : Text; inStock : Bool }>();
      orders = Map.empty<Nat, { id : Nat; customerName : Text; customerPhone : Text; customerAddress : Text; items : [{ productId : Nat; quantity : Nat }]; totalAmount : Nat; status : Text }>();
      nextProductId = 1;
      nextOrderId = 1;
    };
  };
};
