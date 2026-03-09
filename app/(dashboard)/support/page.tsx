"use client"

import { useState, useEffect, useRef } from "react"
import { useDiscussions } from "@/hooks/use-discussions"
import { formatDate } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { LoadingButton } from "@/components/ui/loading-button"
import { Badge } from "@/components/ui/badge"
import { Search, MessageCircle, Send, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Discussion, Message } from "@/lib/types/discussions"

/**
 * Page de service client / Chat avec les utilisateurs
 */
export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const {
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
  } = useDiscussions()

  // Filtrer les discussions par recherche
  const filteredDiscussions = discussions.filter((discussion) => {
    if (!searchQuery.trim()) return true
    const query = searchQuery.toLowerCase()
    return (
      discussion.user.username?.toLowerCase().includes(query) ||
      discussion.user.email?.toLowerCase().includes(query) ||
      discussion.user.phone?.includes(query)
    )
  })

  // Rejoindre une discussion quand elle est sélectionnée
  useEffect(() => {
    if (currentDiscussionId) {
      joinDiscussion(currentDiscussionId)
      markAsRead(currentDiscussionId)
    }
    return () => {
      if (currentDiscussionId) {
        leaveDiscussion(currentDiscussionId)
      }
    }
  }, [currentDiscussionId, joinDiscussion, leaveDiscussion, markAsRead])

  // Scroll vers le bas quand on ouvre une nouvelle discussion
  useEffect(() => {
    if (currentDiscussion && messagesContainerRef.current) {
      // Attendre que le DOM soit mis à jour avant de scroller
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      }, 100)
    }
  }, [currentDiscussionId])

  // Scroll vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    if (messagesContainerRef.current && messagesEndRef.current) {
      // Utiliser scrollTop sur le conteneur au lieu de scrollIntoView pour éviter le scroll de la page
      const container = messagesContainerRef.current
      const scrollHeight = container.scrollHeight
      const clientHeight = container.clientHeight
      
      // Scroll uniquement si on est proche du bas (pour ne pas déranger si l'utilisateur scroll vers le haut)
      const isNearBottom = scrollHeight - container.scrollTop - clientHeight < 100
      const messagesCount = currentDiscussion?.messages?.length || 0
      
      if (isNearBottom || messagesCount === 0) {
        // Utiliser requestAnimationFrame pour s'assurer que le DOM est mis à jour
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight
        })
      }
    }
  }, [currentDiscussion?.messages])

  const handleSendMessage = async () => {
    if (!currentDiscussionId || !messageInput.trim()) return
    setIsSending(true)
    try {
      await sendMessage(currentDiscussionId, messageInput)
      setMessageInput("")
    } finally {
      setIsSending(false)
    }
  }

  const handleCloseDiscussion = async () => {
    if (!currentDiscussionId) return
    setIsClosing(true)
    try {
      await closeDiscussion(currentDiscussionId)
    } finally {
      setIsClosing(false)
    }
  }

  const messages = currentDiscussion?.messages || []

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* Liste des discussions */}
      <Card className="w-80 flex-shrink-0 flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          {/* Header avec recherche */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Discussions</h2>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "h-2 w-2 rounded-full",
                    isConnected ? "bg-green-500" : "bg-red-500"
                  )}
                />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? "Connecté" : "Déconnecté"}
                </span>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Liste des discussions */}
          <div className="flex-1 overflow-y-auto">
            {isLoadingDiscussions ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground">Chargement...</p>
              </div>
            ) : filteredDiscussions.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "Aucune discussion trouvée" : "Aucune discussion ouverte"}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredDiscussions.map((discussion) => {
                  const inactive = isDiscussionInactive(discussion)
                  const lastMessage = discussion.messages?.[discussion.messages.length - 1]
                  // Note: Les messages dans la liste n'ont pas la propriété 'read', 
                  // donc on utilise _count.messages comme approximation
                  const unreadCount = discussion._count?.messages || 0

                  return (
                    <button
                      key={discussion.id}
                      type="button"
                      onClick={() => {
                        if (currentDiscussionId !== discussion.id) {
                          if (currentDiscussionId) {
                            leaveDiscussion(currentDiscussionId)
                          }
                          joinDiscussion(discussion.id)
                        }
                      }}
                      className={cn(
                        "w-full p-4 text-left hover:bg-accent transition-colors relative",
                        currentDiscussionId === discussion.id && "bg-accent"
                      )}
                    >
                      {inactive && (
                        <div className="absolute top-2 right-2">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                        </div>
                      )}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-sm truncate">
                              {discussion.user.username ||
                                discussion.user.phone ||
                                discussion.user.email ||
                                "Utilisateur"}
                            </p>
                            {discussion.user.username && (
                              <Badge variant="outline" className="text-xs">
                                {discussion.status}
                              </Badge>
                            )}
                          </div>
                          {lastMessage && (
                            <p className="text-xs text-muted-foreground truncate">
                              {lastMessage.content}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(discussion.lastActivityAt)}
                          </p>
                          {inactive && (
                            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                              ⚠️ Inactive depuis 20+ min
                            </p>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <Badge
                            variant="destructive"
                            className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                          >
                            {unreadCount}
                          </Badge>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Zone de chat */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="p-0 flex flex-col h-full">
          {currentDiscussion ? (
            <>
              {/* Header de la discussion */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">
                    {currentDiscussion.user.username ||
                      currentDiscussion.user.phone ||
                      currentDiscussion.user.email ||
                      "Utilisateur"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {currentDiscussion.user.email || currentDiscussion.user.phone || "Aucun contact"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={currentDiscussion.status === "OPEN" ? "default" : "secondary"}>
                    {currentDiscussion.status}
                  </Badge>
                  {currentDiscussion.status === "OPEN" && (
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      onClick={handleCloseDiscussion}
                      isLoading={isClosing}
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      Fermer
                    </LoadingButton>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingDiscussion ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">Chargement des messages...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-muted-foreground">
                      Aucun message. Commencez la conversation !
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((message: Message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.senderType === "ADMIN" ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[70%] rounded-lg p-3",
                            message.senderType === "ADMIN"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          )}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              message.senderType === "ADMIN"
                                ? "text-primary-foreground/70"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatDate(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Input pour envoyer un message */}
              {currentDiscussion.status === "OPEN" && (
                <div className="p-4 border-t">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      handleSendMessage()
                    }}
                    className="flex gap-2"
                  >
                    <Input
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Tapez votre message..."
                      className="flex-1"
                      maxLength={5000}
                      disabled={isSending}
                    />
                    <LoadingButton type="submit" size="icon" disabled={!messageInput.trim()} isLoading={isSending}>
                      <Send className="h-4 w-4" />
                    </LoadingButton>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Sélectionnez une discussion pour commencer
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
