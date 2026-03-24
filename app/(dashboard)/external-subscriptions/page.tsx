'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { adminApi, type ExternalSubscription } from '@/lib/api'
import { formatDate, formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, Calendar, CreditCard, Users as UsersIcon, TrendingUp, AlertCircle } from 'lucide-react'

/**
 * Page de gestion des abonnements externes
 * Affiche tous les abonnements externes de tous les utilisateurs
 */
export default function ExternalSubscriptionsPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined)
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM' | undefined>(undefined)
  const [minAmount, setMinAmount] = useState<number | undefined>(undefined)
  const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined)
  const [navigatingToUserId, setNavigatingToUserId] = useState<string | null>(null)

  // Charger les abonnements externes
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-external-subscriptions', page, limit, search, isActive, billingCycle, minAmount, maxAmount],
    queryFn: async () => {
      const response = await adminApi.externalSubscriptions.getAll({
        page,
        limit,
        search: search || undefined,
        isActive,
        billingCycle,
        minAmount,
        maxAmount,
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Erreur lors du chargement des abonnements')
      }
      return response.data
    },
  })

  // Calculer les statistiques
  const stats = {
    total: data?.pagination.total || 0,
    active: data?.subscriptions.filter(sub => sub.isActive && !sub.expirationStatus).length || 0,
    expired: data?.subscriptions.filter(sub => sub.expirationStatus === 'échéance atteinte').length || 0,
  }

  // Calculer le total mensuel équivalent
  const calculateMonthlyTotal = () => {
    if (!data?.subscriptions) return 0
    return data.subscriptions
      .filter(sub => sub.isActive && !sub.expirationStatus)
      .reduce((total, sub) => {
        switch (sub.billingCycle) {
          case 'MONTHLY':
            return total + sub.amount
          case 'QUARTERLY':
            return total + (sub.amount / 3)
          case 'ANNUAL':
            return total + (sub.amount / 12)
          case 'CUSTOM':
            return total + ((sub.amount / (sub.customDays || 30)) * 30)
          default:
            return total
        }
      }, 0)
  }

  const handleViewUser = (userId: string) => {
    setNavigatingToUserId(userId)
    router.push(`/users/${userId}`)
  }

  const getBillingCycleLabel = (cycle: string, customDays: number | null) => {
    switch (cycle) {
      case 'MONTHLY':
        return 'Mensuel'
      case 'QUARTERLY':
        return 'Trimestriel'
      case 'ANNUAL':
        return 'Annuel'
      case 'CUSTOM':
        return `${customDays} jours`
      default:
        return cycle
    }
  }

  const getStatusBadge = (subscription: ExternalSubscription) => {
    if (subscription.expirationStatus === 'échéance atteinte') {
      return <Badge variant="destructive">Échéance atteinte</Badge>
    } else if (subscription.isActive) {
      return <Badge className="bg-green-500">Actif</Badge>
    } else {
      return <Badge variant="secondary">Inactif</Badge>
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Abonnements Externes</h1>
        <p className="text-sm sm:text-base text-muted-foreground">Gérez tous les abonnements externes des utilisateurs</p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Abonnements enregistrés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Actifs</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">En cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expirés</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expired}</div>
            <p className="text-xs text-muted-foreground">Échéance atteinte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Mensuel</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Math.round(calculateMonthlyTotal()))}</div>
            <p className="text-xs text-muted-foreground">Équivalent mensuel</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Recherchez et filtrez les abonnements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom d'abonnement ou utilisateur..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="isActive">Statut</Label>
              <Select
                id="isActive"
                value={isActive === undefined ? '' : String(isActive)}
                onChange={(e) => {
                  const value = e.target.value
                  setIsActive(value === '' ? undefined : value === 'true')
                  setPage(1)
                }}
              >
                <option value="">Tous</option>
                <option value="true">Actifs</option>
                <option value="false">Inactifs</option>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="billingCycle">Cycle</Label>
              <Select
                id="billingCycle"
                value={billingCycle || ''}
                onChange={(e) => {
                  const value = e.target.value as any
                  setBillingCycle(value || undefined)
                  setPage(1)
                }}
              >
                <option value="">Tous</option>
                <option value="MONTHLY">Mensuel</option>
                <option value="QUARTERLY">Trimestriel</option>
                <option value="ANNUAL">Annuel</option>
                <option value="CUSTOM">Personnalisé</option>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('')
                  setIsActive(undefined)
                  setBillingCycle(undefined)
                  setMinAmount(undefined)
                  setMaxAmount(undefined)
                  setPage(1)
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="minAmount">Montant minimum (FCFA)</Label>
              <Input
                id="minAmount"
                type="number"
                placeholder="0"
                value={minAmount || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined
                  setMinAmount(value)
                  setPage(1)
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxAmount">Montant maximum (FCFA)</Label>
              <Input
                id="maxAmount"
                type="number"
                placeholder="100000"
                value={maxAmount || ''}
                onChange={(e) => {
                  const value = e.target.value ? Number(e.target.value) : undefined
                  setMaxAmount(value)
                  setPage(1)
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des abonnements */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            <CardTitle>Liste des Abonnements</CardTitle>
          </div>
          <CardDescription>
            {data?.pagination.total || 0} abonnement(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Chargement des abonnements...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-destructive">Erreur lors du chargement des abonnements</p>
            </div>
          ) : !data || data.subscriptions.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Aucun abonnement trouvé</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Abonnement</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Cycle</TableHead>
                      <TableHead>Prochain renouvellement</TableHead>
                      <TableHead>Catégorie</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.subscriptions.map((subscription: ExternalSubscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{subscription.user.username}</span>
                            <span className="text-xs text-muted-foreground">{subscription.user.phone}</span>
                            <div className="mt-1 flex gap-1">
                              {subscription.user.isPremium && (
                                <Badge variant="default" className="text-xs">Premium</Badge>
                              )}
                              {subscription.user.role === 'ADMIN' && (
                                <Badge variant="secondary" className="text-xs">Admin</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{subscription.name}</span>
                            {subscription.notes && (
                              <span className="text-xs text-muted-foreground line-clamp-1">{subscription.notes}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{formatCurrency(subscription.amount)}</TableCell>
                        <TableCell>{getBillingCycleLabel(subscription.billingCycle, subscription.customDays)}</TableCell>
                        <TableCell>{formatDate(subscription.nextBillingDate)}</TableCell>
                        <TableCell>
                          {subscription.category ? (
                            <Badge variant={subscription.category.type === 'EXPENSE' ? 'destructive' : 'default'}>
                              {subscription.category.name}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(subscription)}</TableCell>
                        <TableCell className="text-right">
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewUser(subscription.userId)}
                            isLoading={navigatingToUserId === subscription.userId}
                            title="Voir l'utilisateur"
                          >
                            <Eye className="h-4 w-4" />
                          </LoadingButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} sur {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      isLoading={isLoading}
                    >
                      Précédent
                    </LoadingButton>
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
                      isLoading={isLoading}
                    >
                      Suivant
                    </LoadingButton>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
