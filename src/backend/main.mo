import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import List "mo:core/List";
import Migration "migration";

(with migration = Migration.run)
actor {
  public type Product = {
    id : Nat;
    name : Text;
    description : Text;
    priceCents : Nat;
    imageUrl : Text;
    category : Text;
    inStock : Bool;
  };

  public type OrderItem = {
    productId : Nat;
    quantity : Nat;
  };

  public type Order = {
    id : Nat;
    customerName : Text;
    customerPhone : Text;
    customerAddress : Text;
    items : [OrderItem];
    totalAmount : Nat;
    status : Text;
  };

  var nextProductId = 1;
  var nextOrderId = 1;

  let products = Map.empty<Nat, Product>();
  let orders = Map.empty<Nat, Order>();

  // Seed initial products
  public shared ({ caller }) func deploy() : async () {
    let initialProducts : [Product] = [
      {
        id = 0;
        name = "Whole Milk";
        description = "Fresh whole milk from local farms";
        priceCents = 299;
        imageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1840&auto=format&fit=crop";
        category = "Milk";
        inStock = true;
      },
      {
        id = 0;
        name = "Greek Yogurt";
        description = "Creamy Greek-style yogurt";
        priceCents = 399;
        imageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1840&auto=format&fit=crop";
        category = "Yogurt";
        inStock = true;
      },
      {
        id = 0;
        name = "Cheddar Cheese";
        description = "Sharp cheddar cheese blocks";
        priceCents = 599;
        imageUrl = "https://images.unsplash.com/photo-1452195100486-9cc805987862?q=80&w=1840&auto=format&fit=crop";
        category = "Cheese";
        inStock = true;
      },
      {
        id = 0;
        name = "Unsalted Butter";
        description = "Pure unsalted butter sticks";
        priceCents = 349;
        imageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1840&auto=format&fit=crop";
        category = "Butter";
        inStock = true;
      },
      {
        id = 0;
        name = "Low-Fat Milk";
        description = "Low-fat milk for healthy living";
        priceCents = 279;
        imageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1840&auto=format&fit=crop";
        category = "Milk";
        inStock = true;
      },
      {
        id = 0;
        name = "Vanilla Yogurt";
        description = "Smooth vanilla yogurt";
        priceCents = 359;
        imageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1840&auto=format&fit=crop";
        category = "Yogurt";
        inStock = true;
      },
      {
        id = 0;
        name = "Swiss Cheese";
        description = "Sliced Swiss cheese";
        priceCents = 649;
        imageUrl = "https://images.unsplash.com/photo-1452195100486-9cc805987862?q=80&w=1840&auto=format&fit=crop";
        category = "Cheese";
        inStock = true;
      },
      {
        id = 0;
        name = "Salted Butter";
        description = "Classic salted butter";
        priceCents = 329;
        imageUrl = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=1840&auto=format&fit=crop";
        category = "Butter";
        inStock = true;
      },
    ];

    for (product in initialProducts.values()) {
      let productWithId = { product with id = nextProductId };
      products.add(nextProductId, productWithId);
      nextProductId += 1;
    };
  };

  // Product Management
  public shared ({ caller }) func addProduct(name : Text, description : Text, priceCents : Nat, imageUrl : Text, category : Text, inStock : Bool) : async Nat {
    let product : Product = {
      id = nextProductId;
      name;
      description;
      priceCents;
      imageUrl;
      category;
      inStock;
    };
    products.add(nextProductId, product);
    nextProductId += 1;
    product.id;
  };

  public shared ({ caller }) func updateProduct(id : Nat, name : Text, description : Text, priceCents : Nat, imageUrl : Text, category : Text, inStock : Bool) : async () {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        let updatedProduct : Product = {
          id;
          name;
          description;
          priceCents;
          imageUrl;
          category;
          inStock;
        };
        products.add(id, updatedProduct);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (products.containsKey(id)) {
      products.remove(id);
    } else {
      Runtime.trap("Product not found");
    };
  };

  public query ({ caller }) func getProducts() : async [Product] {
    products.values().toArray();
  };

  public query ({ caller }) func getProduct(id : Nat) : async ?Product {
    products.get(id);
  };

  // Order Management
  public shared ({ caller }) func placeOrder(customerName : Text, customerPhone : Text, customerAddress : Text, items : [OrderItem], totalAmount : Nat) : async Nat {
    let order : Order = {
      id = nextOrderId;
      customerName;
      customerPhone;
      customerAddress;
      items;
      totalAmount;
      status = "Pending";
    };
    orders.add(nextOrderId, order);
    nextOrderId += 1;
    order.id;
  };

  public shared ({ caller }) func updateOrderStatus(orderId : Nat, newStatus : Text) : async () {
    switch (orders.get(orderId)) {
      case (null) { Runtime.trap("Order not found") };
      case (?order) {
        let updatedOrder = { order with status = newStatus };
        orders.add(orderId, updatedOrder);
      };
    };
  };

  public query ({ caller }) func getOrders() : async [Order] {
    orders.values().toArray();
  };

  public query ({ caller }) func getOrder(id : Nat) : async ?Order {
    orders.get(id);
  };
};
