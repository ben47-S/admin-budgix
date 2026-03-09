"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { adminApi, type Review, type ImprovementSuggestion } from "@/lib/api"
import { formatDate } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Badge } from "@/components/ui/badge"
import { Star, MessageSquare, Edit, Trash2, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

/**
 * Page de gestion des avis et suggestions
 * Affiche les avis et suggestions des utilisateurs avec statistiques
 */
export default function ReviewsPage() {
  const [activeTab, setActiveTab] = useState<"reviews" | "suggestions">("reviews")
  const [editingSuggestion, setEditingSuggestion] = useState<ImprovementSuggestion | null>(null)
  const [editContent, setEditContent] = useState("")
  const [deletingSuggestionId, setDeletingSuggestionId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  // Charger les statistiques des avis
  const { data: reviewStats } = useQuery({
    queryKey: ["review-stats"],
    queryFn: async () => {
      const response = await adminApi.reviews.getStats()
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement des statistiques")
      }
      return response.data
    },
  })

  // Charger tous les avis
  const { data: reviews, isLoading: isLoadingReviews } = useQuery({
    queryKey: ["reviews-all"],
    queryFn: async () => {
      const response = await adminApi.reviews.getAll()
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement des avis")
      }
      return response.data
    },
  })

  // Charger les statistiques des suggestions
  const { data: suggestionStats } = useQuery({
    queryKey: ["suggestion-stats"],
    queryFn: async () => {
      const response = await adminApi.suggestions.getStats()
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement des statistiques")
      }
      return response.data
    },
  })

  // Charger toutes les suggestions
  const { data: suggestions, isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ["suggestions-all"],
    queryFn: async () => {
      const response = await adminApi.suggestions.getAll()
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement des suggestions")
      }
      return response.data
    },
  })

  // Mutation pour mettre à jour une suggestion
  const updateMutation = useMutation({
    mutationFn: async ({ id, content }: { id: string; content: string }) => {
      const response = await adminApi.suggestions.update(id, content)
      if (!response.success) {
        throw new Error(response.message || "Erreur lors de la mise à jour")
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions-all"] })
      queryClient.invalidateQueries({ queryKey: ["suggestion-stats"] })
      setEditingSuggestion(null)
      setEditContent("")
    },
  })

  // Mutation pour supprimer une suggestion
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApi.suggestions.delete(id)
      if (!response.success) {
        throw new Error(response.message || "Erreur lors de la suppression")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suggestions-all"] })
      queryClient.invalidateQueries({ queryKey: ["suggestion-stats"] })
      setDeletingSuggestionId(null)
    },
    onError: () => {
      setDeletingSuggestionId(null)
    },
  })

  const handleEdit = (suggestion: ImprovementSuggestion) => {
    setEditingSuggestion(suggestion)
    setEditContent(suggestion.content)
  }

  const handleUpdate = () => {
    if (!editingSuggestion || !editContent.trim()) {
      return
    }
    updateMutation.mutate({ id: editingSuggestion.id, content: editContent.trim() })
  }

  const handleDelete = (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette suggestion ?")) {
      return
    }
    setDeletingSuggestionId(id)
    deleteMutation.mutate(id)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-4 w-4",
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            )}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Avis et Suggestions</h1>
        <p className="text-muted-foreground">Gérez les avis et suggestions des utilisateurs</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setActiveTab("reviews")}
          className={cn(
            "px-4 py-2 font-medium transition-colors",
            activeTab === "reviews"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Avis ({reviewStats?.totalReviews || 0})
        </button>
        <button
          onClick={() => setActiveTab("suggestions")}
          className={cn(
            "px-4 py-2 font-medium transition-colors",
            activeTab === "suggestions"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Suggestions ({suggestionStats?.totalSuggestions || 0})
        </button>
      </div>

      {/* Section Avis */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          {/* Statistiques des avis */}
          {reviewStats && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total d'avis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reviewStats.totalReviews}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Note moyenne</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {reviewStats.averageRating.toFixed(1)} / 5
                  </div>
                  {renderStars(Math.round(reviewStats.averageRating))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviewStats.ratingDistribution[rating as keyof typeof reviewStats.ratingDistribution]
                      const percentage = reviewStats.totalReviews > 0 
                        ? (count / reviewStats.totalReviews) * 100 
                        : 0
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="w-8">{rating}★</span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="w-8 text-right text-xs text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Liste des avis */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Avis</CardTitle>
              <CardDescription>
                {reviews?.length || 0} avis au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingReviews ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Chargement des avis...</p>
                </div>
              ) : !reviews || reviews.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Aucun avis pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review: Review) => (
                    <div
                      key={review.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium">
                              {review.user.username || review.user.phone || "Utilisateur anonyme"}
                            </span>
                            <Badge variant="outline">{renderStars(review.rating)}</Badge>
                          </div>
                          {review.comment && (
                            <p className="text-sm text-muted-foreground mb-2">{review.comment}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatDate(review.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Section Suggestions */}
      {activeTab === "suggestions" && (
        <div className="space-y-6">
          {/* Statistiques des suggestions */}
          {suggestionStats && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Total de suggestions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{suggestionStats.totalSuggestions}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Utilisateurs uniques</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{suggestionStats.uniqueUsers}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Moyenne par utilisateur</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {suggestionStats.averagePerUser.toFixed(1)}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Liste des suggestions */}
          <Card>
            <CardHeader>
              <CardTitle>Liste des Suggestions</CardTitle>
              <CardDescription>
                {suggestions?.length || 0} suggestions au total
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingSuggestions ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Chargement des suggestions...</p>
                </div>
              ) : !suggestions || suggestions.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Aucune suggestion pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {suggestions.map((suggestion: ImprovementSuggestion) => (
                    <div
                      key={suggestion.id}
                      className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {suggestion.user.username || suggestion.user.phone || "Utilisateur anonyme"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">
                            {suggestion.content}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(suggestion.createdAt)}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(suggestion)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            isLoading={deletingSuggestionId === suggestion.id}
                            onClick={() => handleDelete(suggestion.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </LoadingButton>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Dialog d'édition */}
      <Dialog open={!!editingSuggestion} onOpenChange={(open) => !open && setEditingSuggestion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la suggestion</DialogTitle>
            <DialogDescription>
              Modifiez le contenu de la suggestion d'amélioration
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Contenu</Label>
              <Textarea
                id="content"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Contenu de la suggestion..."
                rows={6}
                maxLength={2000}
              />
              <p className="text-xs text-muted-foreground text-right">
                {editContent.length}/2000 caractères
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingSuggestion(null)
                setEditContent("")
              }}
            >
              Annuler
            </Button>
            <LoadingButton
              onClick={handleUpdate}
              disabled={!editContent.trim()}
              isLoading={updateMutation.isPending}
            >
              Enregistrer
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}



