"use client"

import { useQuery } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

/**
 * Page de statistiques détaillées
 * Affiche des graphiques et analyses des données de la plateforme
 */
export default function StatsPage() {
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

  if (error || !data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Erreur lors du chargement des statistiques</p>
      </div>
    )
  }

  // Données pour le graphique des utilisateurs (filtrer les valeurs à 0)
  const usersData = [
    { name: "Premium", value: data.users.premium },
    { name: "Réguliers", value: data.users.regular },
    { name: "Admins", value: data.users.admin },
  ].filter(item => item.value > 0) // Ne montrer que les catégories avec des utilisateurs

  // Données pour le graphique des transactions
  const transactionsData = [
    {
      name: "Transactions",
      Dépenses: data.transactions.totalExpenses,
      Revenus: data.transactions.totalIncome,
    },
  ]

  // Couleurs pour les graphiques (Premium: Or, Réguliers: Bleu, Admins: Violet)
  const COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6"]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Statistiques Détaillées</h1>
        <p className="text-muted-foreground">Analyses et graphiques de la plateforme</p>
      </div>

      {/* Graphique de répartition des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle>Répartition des Utilisateurs</CardTitle>
          <CardDescription>Distribution des utilisateurs par type</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={usersData}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={({ name, value, percent }) => {
                  // Afficher seulement si > 5% pour éviter le chevauchement
                  if (percent < 0.05) return null
                  return `${name}: ${value} (${(percent * 100).toFixed(0)}%)`
                }}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {usersData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number, name: string) => [value, name]}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => {
                  const item = usersData.find(d => d.name === value)
                  return `${value}: ${item?.value || 0} utilisateur(s)`
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Graphique des transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Dépenses vs Revenus</CardTitle>
          <CardDescription>Comparaison des dépenses et revenus totaux</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={transactionsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="Dépenses" fill="#ef4444" />
              <Bar dataKey="Revenus" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Utilisateurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">{data.users.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Premium:</span>
              <span className="font-semibold">{data.users.premium.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Réguliers:</span>
              <span className="font-semibold">{data.users.regular.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admins:</span>
              <span className="font-semibold">{data.users.admin.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Nouveaux (30j):</span>
              <span className="font-semibold">{data.users.newLast30Days.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-semibold">{data.transactions.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant Total:</span>
              <span className="font-semibold">{formatCurrency(data.transactions.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Dépenses:</span>
              <span className="font-semibold text-destructive">
                {formatCurrency(data.transactions.totalExpenses)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Revenus:</span>
              <span className="font-semibold text-green-600">
                {formatCurrency(data.transactions.totalIncome)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

