"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/utils"
import {
  Users,
  UserCheck,
  TrendingUp,
  Wallet,
  CreditCard,
  FileText,
  Calendar,
} from "lucide-react"

/**
 * Page principale du dashboard admin
 * Affiche les statistiques globales de la plateforme
 */
export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const response = await adminApi.stats.getStats()
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement des statistiques")
      }
      // Le backend retourne: { success: true, data: { stats: { users: {...}, ... } } }
      // ou parfois directement: { success: true, data: { users: {...}, ... } }
      const responseData = response.data as any
      const stats = responseData.stats || responseData
      if (!stats || !stats.users) {
        console.error("Structure de réponse inattendue:", response.data)
        throw new Error("Structure de données invalide - users non trouvé")
      }
      return stats
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Chargement des statistiques...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Erreur lors du chargement des statistiques</p>
      </div>
    )
  }

  if (!data) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Vue d'ensemble de la plateforme Budgix</p>
      </div>

      {/* Statistiques utilisateurs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.users.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.users.newLast30Days} nouveaux ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Premium</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.users.premium.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {((data.users.premium / data.users.total) * 100).toFixed(1)}% du total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs Réguliers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.users.regular.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Utilisateurs non premium</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Administrateurs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.users.admin.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Comptes administrateurs</p>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques transactions */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.transactions.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Toutes transactions confondues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Montant Total</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{formatCurrency(data.transactions.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">Montant total des transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Dépenses</CardTitle>
            <TrendingUp className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-destructive">
              {formatCurrency(data.transactions.totalExpenses)}
            </div>
            <p className="text-xs text-muted-foreground">Dépenses totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenus</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {formatCurrency(data.transactions.totalIncome)}
            </div>
            <p className="text-xs text-muted-foreground">Revenus totaux</p>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques fonctionnalités */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Budgets</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.features.budgets.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Budgets créés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dettes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{data.features.debts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Dettes enregistrées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abonnements Externes</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.features.externalSubscriptions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Abonnements suivis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Catégories Globales</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {data.features.globalCategories.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Catégories disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Abonnements actifs */}
      <Card>
        <CardHeader>
          <CardTitle>Abonnements</CardTitle>
          <CardDescription>Statistiques des abonnements premium</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{data.subscriptions.active.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Abonnements premium actifs</p>
        </CardContent>
      </Card>
    </div>
  )
}

