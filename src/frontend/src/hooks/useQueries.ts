import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Score } from "../backend.d";
import { useActor } from "./useActor";

export function useLeaderboard() {
  const { actor, isFetching } = useActor();
  return useQuery<Score[]>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSubmitScore() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      playerName,
      escapeTime,
      levelReached,
    }: {
      playerName: string;
      escapeTime: bigint;
      levelReached: bigint;
    }) => {
      if (!actor) throw new Error("No actor");
      return actor.submitScore(playerName, escapeTime, levelReached);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
