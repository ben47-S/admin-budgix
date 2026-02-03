"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter, useParams } from "next/navigation"
import { adminApi, type User } from "@/lib/api"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Save, Trash2, Bell } from "lucide-react"
import { useState } from "react"
import { SendNotificationDialog } from "@/components/admin/send-notification-dialog"

/**
 * Page de détails d'un utilisateur
 * Permet de voir et modifier les informations d'un utilisateur
 */
export default function UserDetailPage() {
  const params = useParams()
  const userId = params.id as string
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [isNotificationDialogOpen, setIsNotificationDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    role: "USER" as "USER" | "ADMIN",
    isPremium: false,
    username: "",
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const response = await adminApi.users.getUser(userId)
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement de l'utilisateur")
      }
      return response.data.user
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (data: { role?: "USER" | "ADMIN"; isPremium?: boolean; username?: string }) => {
      const response = await adminApi.users.updateUser(userId, data)
      if (!response.success) {
        throw new Error(response.message || "Erreur lors de la mise à jour")
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-user", userId] })
      queryClient.invalidateQueries({ queryKey: ["admin-users"] })
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await adminApi.users.deleteUser(userId)
      if (!response.success) {
        throw new Error(response.message || "Erreur lors de la suppression")
      }
    },
    onSuccess: () => {
      router.push("/users")
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement des informations utilisateur...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Erreur lors du chargement de l'utilisateur</p>
      </div>
    )
  }

  const handleEdit = () => {
    setFormData({
      role: data.role,
      isPremium: data.isPremium,
      username: data.username,
    })
    setIsEditing(true)
  }

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  const handleDelete = () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      return
    }
    deleteMutation.mutate()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{data.username}</h1>
            <p className="text-muted-foreground">Détails de l'utilisateur</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" onClick={handleEdit}>
                Modifier
              </Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="mr-2 h-4 w-4" />
                Supprimer
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button onClick={handleSave} disabled={updateMutation.isPending}>
                <Save className="mr-2 h-4 w-4" />
                {updateMutation.isPending ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle>Informations Générales</CardTitle>
            <CardDescription>Informations de base de l'utilisateur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nom d'utilisateur</Label>
              {isEditing ? (
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              ) : (
                <p className="text-sm">{data.username}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Email</Label>
              <p className="text-sm">{data.email || "-"}</p>
            </div>

            <div className="space-y-2">
              <Label>Téléphone</Label>
              <p className="text-sm">{data.phone}</p>
            </div>

            <div className="space-y-2">
              <Label>Statut Premium</Label>
              {isEditing ? (
                <Select
                  value={String(formData.isPremium)}
                  onChange={(e) =>
                    setFormData({ ...formData, isPremium: e.target.value === "true" })
                  }
                >
                  <option value="false">Régulier</option>
                  <option value="true">Premium</option>
                </Select>
              ) : (
                <div>
                  <Badge variant={data.isPremium ? "default" : "secondary"}>
                    {data.isPremium ? "Premium" : "Régulier"}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              {isEditing ? (
                <Select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value as "USER" | "ADMIN" })
                  }
                >
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </Select>
              ) : (
                <div>
                  <Badge variant={data.role === "ADMIN" ? "destructive" : "outline"}>
                    {data.role}
                  </Badge>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Date d'inscription</Label>
              <p className="text-sm">{formatDate(data.createdAt)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Statistiques */}
        <Card>
          <CardHeader>
            <CardTitle>Statistiques</CardTitle>
            <CardDescription>Données et statistiques de l'utilisateur</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {data._count && (
              <>
                <div className="space-y-2">
                  <Label>Transactions</Label>
                  <p className="text-2xl font-bold">{data._count.transactions}</p>
                </div>

                <div className="space-y-2">
                  <Label>Budgets</Label>
                  <p className="text-2xl font-bold">{data._count.budgets}</p>
                </div>

                <div className="space-y-2">
                  <Label>Dettes</Label>
                  <p className="text-2xl font-bold">{data._count.debts}</p>
                </div>

                <div className="space-y-2">
                  <Label>Abonnements Externes</Label>
                  <p className="text-2xl font-bold">{data._count.externalSubscriptions}</p>
                </div>
              </>
            )}

            {data.stats && (
              <>
                <div className="space-y-2">
                  <Label>Montant Total</Label>
                  <p className="text-2xl font-bold">{formatCurrency(data.stats.totalAmount)}</p>
                </div>

                <div className="space-y-2">
                  <Label>Total Dépenses</Label>
                  <p className="text-2xl font-bold text-destructive">
                    {formatCurrency(data.stats.totalExpenses)}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Total Revenus</Label>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(data.stats.totalIncome)}
                  </p>
                </div>
              </>
            )}

            {data.subscription && (
              <div className="space-y-2">
                <Label>Abonnement</Label>
                <div className="space-y-1">
                  <p className="text-sm">
                    Plan: <strong>{data.subscription.plan}</strong>
                  </p>
                  <p className="text-sm">
                    Prix: <strong>{formatCurrency(data.subscription.price)}</strong>
                  </p>
                  <p className="text-sm">
                    Début: <strong>{formatDate(data.subscription.startDate)}</strong>
                  </p>
                  {data.subscription.endDate && (
                    <p className="text-sm">
                      Fin: <strong>{formatDate(data.subscription.endDate)}</strong>
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog d'envoi de notification */}
      <SendNotificationDialog
        open={isNotificationDialogOpen}
        onOpenChange={setIsNotificationDialogOpen}
        userId={userId}
        userName={data.username}
      />
    </div>
  )
}

