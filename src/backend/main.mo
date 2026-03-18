import Array "mo:core/Array";
import List "mo:core/List";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";

actor {
  type Score = {
    playerName : Text;
    escapeTime : Nat;
    levelReached : Nat;
  };

  module Score {
    public func compare(score1 : Score, score2 : Score) : Order.Order {
      Nat.compare(score1.escapeTime, score2.escapeTime);
    };
  };

  let scores = List.empty<Score>();

  public shared ({ caller }) func submitScore(playerName : Text, escapeTime : Nat, levelReached : Nat) : async () {
    if (playerName == "") {
      Runtime.trap("Player name cannot be empty");
    };

    let score : Score = {
      playerName;
      escapeTime;
      levelReached;
    };

    scores.add(score);
  };

  public query ({ caller }) func getLeaderboard() : async [Score] {
    let sortedScores = scores.toArray().sort();
    let topTenSize = if (sortedScores.size() < 10) {
      sortedScores.size();
    } else { 10 };
    sortedScores.sliceToArray(0, topTenSize);
  };
};
