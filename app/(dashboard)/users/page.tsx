"use client"

import { useState } from "react"
import { useQuery, useMutation } from "@tanstack/react-query"
import { useRouter } from "next/navigation"
import { adminApi, type User } from "@/lib/api"
import { formatDate, formatCurrency } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ResponsiveTableWrapper } from "@/components/ui/responsive-table"
import { Search, Eye, Edit, Trash2, Shield, Users as UsersIcon } from "lucide-react"

/**
 * Page de gestion des utilisateurs
 * Affiche la liste des utilisateurs avec pagination et filtres
 */
export default function UsersPage() {
  const router = useRouter()
  const [page, setPage] = useState(1)
  const [adminPage, setAdminPage] = useState(1)
  const [limit] = useState(20)
  const [search, setSearch] = useState("")
  const [isPremium, setIsPremium] = useState<boolean | undefined>(undefined)
  const [navigatingToUserId, setNavigatingToUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)

  // Charger les utilisateurs normaux (USER)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-users", page, limit, search, isPremium, "USER"],
    queryFn: async () => {
      const response = await adminApi.users.getUsers({
        page,
        limit,
        search: search || undefined,
        isPremium,
        role: "USER", // Uniquement les utilisateurs normaux
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement des utilisateurs")
      }
      return response.data
    },
  })

  // Charger les administrateurs séparément
  const { data: adminData, isLoading: isLoadingAdmins, refetch: refetchAdmins } = useQuery({
    queryKey: ["admin-users", adminPage, limit, search, undefined, "ADMIN"],
    queryFn: async () => {
      const response = await adminApi.users.getUsers({
        page: adminPage,
        limit,
        search: search || undefined,
        role: "ADMIN", // Uniquement les administrateurs
      })
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement des administrateurs")
      }
      return response.data
    },
  })

  const handleViewUser = (userId: string) => {
    setNavigatingToUserId(userId)
    router.push(`/users/${userId}`)
  }

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminApi.users.deleteUser(userId)
      if (!response.success) {
        throw new Error(response.message || "Erreur lors de la suppression")
      }
      return response
    },
    onSuccess: () => {
      refetch()
      refetchAdmins()
      setDeletingUserId(null)
    },
    onError: (error: Error) => {
      alert(error.message || "Une erreur est survenue lors de la suppression")
      setDeletingUserId(null)
    },
  })

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) {
      return
    }
    setDeletingUserId(userId)
    deleteMutation.mutate(userId)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
        <p className="text-muted-foreground">Gérez les utilisateurs de la plateforme</p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
          <CardDescription>Recherchez et filtrez les utilisateurs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Recherche</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nom, email, téléphone..."
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
              <Label htmlFor="isPremium">Statut Premium</Label>
              <Select
                id="isPremium"
                value={isPremium === undefined ? "" : String(isPremium)}
                onChange={(e) => {
                  const value = e.target.value
                  setIsPremium(value === "" ? undefined : value === "true")
                  setPage(1)
                }}
              >
                <option value="">Tous</option>
                <option value="true">Premium</option>
                <option value="false">Régulier</option>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("")
                  setIsPremium(undefined)
                  setPage(1)
                  setAdminPage(1)
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section Administrateurs */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Administrateurs</CardTitle>
          </div>
          <CardDescription>
            {adminData?.pagination.total || 0} administrateur(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingAdmins ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Chargement des administrateurs...</p>
            </div>
          ) : !adminData || adminData.users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Aucun administrateur trouvé</p>
            </div>
          ) : (
            <>
              <ResponsiveTableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden lg:table-cell">Transactions</TableHead>
                      <TableHead className="hidden sm:table-cell">Inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminData.users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.phone}</TableCell>
                        <TableCell>
                          <Badge variant={user.isPremium ? "default" : "secondary"}>
                            {user.isPremium ? "Premium" : "Régulier"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{user._count?.transactions || 0}</TableCell>
                        <TableCell className="hidden sm:table-cell">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <LoadingButton
                              variant="ghost"
                              size="icon"
                              isLoading={navigatingToUserId === user.id}
                              onClick={() => handleViewUser(user.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </LoadingButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTableWrapper>

              {/* Pagination pour les admins */}
              {adminData.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {adminData.pagination.page} sur {adminData.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      isLoading={isLoadingAdmins}
                      onClick={() => setAdminPage((p) => Math.max(1, p - 1))}
                      disabled={adminPage === 1}
                    >
                      Précédent
                    </LoadingButton>
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      isLoading={isLoadingAdmins}
                      onClick={() => setAdminPage((p) => Math.min(adminData.pagination.totalPages, p + 1))}
                      disabled={adminPage === adminData.pagination.totalPages}
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

      {/* Section Utilisateurs normaux */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5" />
            <CardTitle>Utilisateurs</CardTitle>
          </div>
          <CardDescription>
            {data?.pagination.total || 0} utilisateur(s) au total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Chargement des utilisateurs...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-destructive">Erreur lors du chargement des utilisateurs</p>
            </div>
          ) : !data || data.users.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
            </div>
          ) : (
            <>
              <ResponsiveTableWrapper>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Utilisateur</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="hidden md:table-cell">Téléphone</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="hidden lg:table-cell">Transactions</TableHead>
                      <TableHead className="hidden sm:table-cell">Inscription</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user: User) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.username}</TableCell>
                        <TableCell>{user.email || "-"}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.phone}</TableCell>
                        <TableCell>
                          <Badge variant={user.isPremium ? "default" : "secondary"}>
                            {user.isPremium ? "Premium" : "Régulier"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">{user._count?.transactions || 0}</TableCell>
                        <TableCell className="hidden sm:table-cell">{formatDate(user.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2 sm:gap-2 gap-3">
                            <LoadingButton
                              variant="ghost"
                              size="icon"
                              className="min-h-[44px] min-w-[44px]"
                              isLoading={navigatingToUserId === user.id}
                              onClick={() => handleViewUser(user.id)}
                            >
                              <Eye className="h-4 w-4" />
                            </LoadingButton>
                            <LoadingButton
                              variant="ghost"
                              size="icon"
                              className="min-h-[44px] min-w-[44px]"
                              isLoading={deletingUserId === user.id}
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </LoadingButton>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTableWrapper>

              {/* Pagination pour les utilisateurs */}
              {data.pagination.totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} sur {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      isLoading={isLoading}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Précédent
                    </LoadingButton>
                    <LoadingButton
                      variant="outline"
                      size="sm"
                      isLoading={isLoading}
                      onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                      disabled={page === data.pagination.totalPages}
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

