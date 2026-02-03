"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"

/**
 * Hook pour obtenir le nombre de discussions ouvertes
 * Utilisé pour afficher un badge dans la sidebar
 */
export function useDiscussionsCount() {
  const { data: discussions = [] } = useQuery({
    queryKey: ["discussions"],
    queryFn: async () => {
      const response = await adminApi.discussions.getOpenDiscussions()
      if (!response.success || !response.data) {
        return []
      }
      return response.data
    },
    refetchInterval: 10000, // Rafraîchir toutes les 10 secondes
  })

  // Compter les discussions ouvertes (non fermées)
  const openDiscussionsCount = discussions.filter(
    (discussion) => discussion.status === "OPEN"
  ).length

  return openDiscussionsCount
}

