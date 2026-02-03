"use client"

import { useEffect, useState, useCallback } from "react"
import { io, Socket } from "socket.io-client"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { getToken } from "@/lib/api"
import type {
  Discussion,
  DiscussionListItem,
  Message,
  NewMessageEvent,
  DiscussionUpdatedEvent,
  MessagesReadEvent,
  SocketErrorEvent,
} from "@/lib/types/discussions"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
const INACTIVITY_WARNING_MS = 20 * 60 * 1000 // 20 minutes

/**
 * Hook pour gérer les discussions avec WebSocket
 */
export function useDiscussions() {
  const queryClient = useQueryClient()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [currentDiscussionId, setCurrentDiscussionId] = useState<string | null>(null)

  // Initialiser WebSocket
  useEffect(() => {
    const token = getToken()
    if (!token) return

    const newSocket = io(API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    })

    newSocket.on("connect", () => {
      console.log("Connecté au WebSocket")
      setIsConnected(true)
    })

    newSocket.on("disconnect", () => {
      console.log("Déconnecté du WebSocket")
      setIsConnected(false)
    })

    // Écouter les nouveaux messages
    newSocket.on("new-message", (data: NewMessageEvent) => {
      const { message } = data

      // Mettre à jour les messages de la discussion actuelle
      if (currentDiscussionId === message.discussionId) {
        queryClient.setQueryData(
          ["discussion", message.discussionId],
          (old: Discussion | undefined) => {
            if (!old) return old
            return {
              ...old,
              messages: [...(old.messages || []), message],
              lastActivityAt: message.createdAt,
            }
          }
        )
      }

      // Rafraîchir la liste des discussions
      queryClient.invalidateQueries({ queryKey: ["discussions"] })
    })

    // Écouter les mises à jour de discussions
    newSocket.on("discussion-updated", (data: DiscussionUpdatedEvent) => {
      queryClient.invalidateQueries({ queryKey: ["discussions"] })
    })

    // Écouter les messages marqués comme lus
    newSocket.on("messages-read", (data: MessagesReadEvent) => {
      queryClient.invalidateQueries({ queryKey: ["discussion", data.discussionId] })
    })

    // Écouter les erreurs
    newSocket.on("error", (data: SocketErrorEvent) => {
      console.error("Erreur WebSocket:", data.message)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [currentDiscussionId, queryClient])

  // Charger toutes les discussions ouvertes
  const { data: discussions = [], isLoading: isLoadingDiscussions } = useQuery<DiscussionListItem[]>({
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

  // Charger une discussion spécifique
  const {
    data: currentDiscussion,
    isLoading: isLoadingDiscussion,
  } = useQuery({
    queryKey: ["discussion", currentDiscussionId],
    queryFn: async () => {
      if (!currentDiscussionId) return null
      const response = await adminApi.discussions.getDiscussion(currentDiscussionId)
      if (!response.success || !response.data) {
        return null
      }
      return response.data
    },
    enabled: !!currentDiscussionId,
  })

  // Rejoindre une discussion via WebSocket
  const joinDiscussion = useCallback(
    (discussionId: string) => {
      if (!socket) return
      socket.emit("join-discussion", { discussionId })
      setCurrentDiscussionId(discussionId)
    },
    [socket]
  )

  // Quitter une discussion
  const leaveDiscussion = useCallback(
    (discussionId: string) => {
      if (!socket) return
      socket.emit("leave-discussion", { discussionId })
      if (currentDiscussionId === discussionId) {
        setCurrentDiscussionId(null)
      }
    },
    [socket, currentDiscussionId]
  )

  // Envoyer un message via WebSocket
  const sendMessage = useCallback(
    (discussionId: string, content: string) => {
      if (!socket || !content.trim()) return
      socket.emit("send-message", {
        discussionId,
        content: content.trim(),
      })
    },
    [socket]
  )

  // Marquer comme lu
  const markAsRead = useCallback(
    async (discussionId: string) => {
      if (!socket) return

      try {
        await adminApi.discussions.markAsRead(discussionId)
        socket.emit("mark-as-read", { discussionId })
      } catch (error) {
        console.error("Erreur lors du marquage comme lu:", error)
      }
    },
    [socket]
  )

  // Fermer une discussion et notifier l'utilisateur
  const closeDiscussion = useCallback(async (discussionId: string) => {
    try {
      // Récupérer la discussion pour obtenir l'ID de l'utilisateur
      const discussionResponse = await adminApi.discussions.getDiscussion(discussionId)
      if (!discussionResponse.success || !discussionResponse.data) {
        throw new Error("Impossible de récupérer la discussion")
      }

      const discussion = discussionResponse.data
      const userId = discussion.userId

      // Fermer la discussion
      await adminApi.discussions.closeDiscussion(discussionId)

      // Envoyer une notification push à l'utilisateur pour l'informer que sa discussion est fermée
      try {
        await adminApi.users.sendNotification(userId, {
          title: "Discussion fermée",
          body: "Votre discussion avec le service client a été fermée. Merci de nous avoir contactés !",
          data: {
            type: "discussion_closed",
            discussionId: discussionId,
            action: "open_discussion",
          },
        })
      } catch (notificationError) {
        // Ne pas bloquer la fermeture si la notification échoue
        console.warn("Erreur lors de l'envoi de la notification:", notificationError)
      }

      queryClient.invalidateQueries({ queryKey: ["discussions"] })
      if (currentDiscussionId === discussionId) {
        setCurrentDiscussionId(null)
      }
    } catch (error) {
      console.error("Erreur lors de la fermeture:", error)
      throw error
    }
  }, [queryClient, currentDiscussionId])

  // Vérifier si une discussion est inactive
  const isDiscussionInactive = useCallback((discussion: DiscussionListItem | Discussion): boolean => {
    const lastActivity = new Date(discussion.lastActivityAt).getTime()
    const now = Date.now()
    return now - lastActivity >= INACTIVITY_WARNING_MS
  }, [])

  return {
    socket,
    isConnected,
    discussions,
    currentDiscussion,
    currentDiscussionId,
    isLoadingDiscussions,
    isLoadingDiscussion,
    joinDiscussion,
    leaveDiscussion,
    sendMessage,
    markAsRead,
    closeDiscussion,
    isDiscussionInactive,
  }
}

