"use client"

import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { adminApi, type Category } from "@/lib/api"
import { formatDate } from "@/lib/utils"
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
import { Plus, Trash2, Edit } from "lucide-react"

/**
 * Schéma de validation pour le formulaire de catégorie
 */
const categorySchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  type: z.enum(["INCOME", "EXPENSE"], {
    required_error: "Le type est requis",
  }),
})

type CategoryFormData = z.infer<typeof categorySchema>

/**
 * Page de gestion des catégories globales
 * Permet de créer, modifier et supprimer des catégories
 */
export default function CategoriesPage() {
  const queryClient = useQueryClient()
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<"ALL" | "INCOME" | "EXPENSE">("ALL")
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const response = await adminApi.categories.getCategories()
      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement des catégories")
      }
      // Accéder à response.data.categories car le backend retourne { data: { categories: [...] } }
      const categories = Array.isArray(response.data?.categories)
        ? response.data.categories
        : []
      return categories
    },
  })

  // Filtrer les catégories par type
  const filteredCategories = data?.filter((category: Category) => {
    if (typeFilter === "ALL") return true
    return category.type === typeFilter
  }) || []

  const createMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      const response = await adminApi.categories.createCategory(data)
      if (!response.success || !response.data) {
        throw new Error(response.message || response.error || "Erreur lors de la création")
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      reset()
      setIsCreating(false)
      setFormError(null)
    },
    onError: (error: Error) => {
      setFormError(error.message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CategoryFormData> }) => {
      const response = await adminApi.categories.updateCategory(id, data)
      if (!response.success || !response.data) {
        throw new Error(response.message || response.error || "Erreur lors de la mise à jour")
      }
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      reset()
      setEditingCategory(null)
      setFormError(null)
    },
    onError: (error: Error) => {
      setFormError(error.message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await adminApi.categories.deleteCategory(id)
      if (!response.success) {
        throw new Error(response.message || "Erreur lors de la suppression")
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] })
      setDeletingCategoryId(null)
    },
    onError: () => {
      setDeletingCategoryId(null)
    },
  })

  const onSubmit = async (data: CategoryFormData) => {
    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setIsCreating(false)
    reset({
      name: category.name,
      type: category.type,
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
      return
    }
    setDeletingCategoryId(id)
    deleteMutation.mutate(id)
  }

  const handleCancel = () => {
    reset()
    setIsCreating(false)
    setEditingCategory(null)
    setFormError(null)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gestion des Catégories</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérez les catégories globales de la plateforme</p>
        </div>
        <Button
          onClick={() => {
            setIsCreating(true)
            setEditingCategory(null)
            reset()
          }}
          disabled={isCreating || editingCategory !== null}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle Catégorie
        </Button>
      </div>

      {/* Formulaire de création/édition */}
      {(isCreating || editingCategory) && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCategory ? "Modifier la Catégorie" : "Nouvelle Catégorie"}
            </CardTitle>
            <CardDescription>
              {editingCategory
                ? "Modifiez les informations de la catégorie"
                : "Créez une nouvelle catégorie globale"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Restaurant"
                    {...register("name")}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    id="type"
                    {...register("type")}
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    <option value="">Sélectionnez un type</option>
                    <option value="INCOME">Revenu</option>
                    <option value="EXPENSE">Dépense</option>
                  </Select>
                  {errors.type && (
                    <p className="text-sm text-destructive">{errors.type.message}</p>
                  )}
                </div>
              </div>

              {formError && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {formError}
                </div>
              )}

              <div className="flex gap-2">
                <LoadingButton
                  type="submit"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingCategory ? "Enregistrer" : "Créer"}
                </LoadingButton>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Liste des catégories */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Liste des Catégories</CardTitle>
              <CardDescription>
                {filteredCategories.length} catégorie(s) affichée(s) sur {Array.isArray(data) ? data.length : 0} totale(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="typeFilter" className="text-sm whitespace-nowrap">Filtrer par type :</Label>
              <Select
                id="typeFilter"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as "ALL" | "INCOME" | "EXPENSE")}
                className="w-[180px]"
              >
                <option value="ALL">Toutes</option>
                <option value="EXPENSE">Dépenses uniquement</option>
                <option value="INCOME">Revenus uniquement</option>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Chargement des catégories...</p>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-destructive">Erreur lors du chargement des catégories</p>
            </div>
          ) : !data || !Array.isArray(data) || data.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Aucune catégorie trouvée</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">
                Aucune catégorie de type "{typeFilter === "EXPENSE" ? "Dépense" : "Revenu"}" trouvée
              </p>
            </div>
          ) : (
            <ResponsiveTableWrapper>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden sm:table-cell">Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category: Category) => (
                    <TableRow key={category.id}>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>
                        <Badge variant={category.type === "INCOME" ? "default" : "secondary"}>
                          {category.type === "INCOME" ? "Revenu" : "Dépense"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">{formatDate(category.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-3 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="min-h-[44px] min-w-[44px]"
                            onClick={() => handleEdit(category)}
                            disabled={isCreating || editingCategory !== null}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <LoadingButton
                            variant="ghost"
                            size="icon"
                            className="min-h-[44px] min-w-[44px]"
                            isLoading={deletingCategoryId === category.id}
                            onClick={() => handleDelete(category.id)}
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
          )}
        </CardContent>
      </Card>
    </div>
  )
}

