"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Activity,
  Search,
  ChevronLeft,
  ChevronRight,
  Shield,
  User,
  AlertCircle,
  Info,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Loader2,
} from "lucide-react"
import { adminApi, type Log, type LogLevel, type LogScope } from "@/lib/api"
import { formatDateTime } from "@/lib/utils"

const scopes: LogScope[] = ["USER", "BUSINESS", "SECURITY", "ADMIN", "SYSTEM"]
const levels: LogLevel[] = ["INFO", "WARN", "ERROR"]

export default function LogsPage() {
  // États des filtres
  const [selectedScopes, setSelectedScopes] = useState<LogScope[]>([])
  const [selectedLevels, setSelectedLevels] = useState<LogLevel[]>([])
  const [actionFilter, setActionFilter] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [actorType, setActorType] = useState<"ALL" | "USER" | "ADMIN">("ALL")
  const [searchId, setSearchId] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(25)

  // Requête API
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "admin-logs",
      currentPage,
      itemsPerPage,
      selectedScopes,
      selectedLevels,
      actionFilter,
      dateFrom,
      dateTo,
      actorType,
      searchId,
    ],
    queryFn: async () => {
      const response = await adminApi.logs.getAll({
        page: currentPage,
        limit: itemsPerPage,
        scopes: selectedScopes.length > 0 ? selectedScopes : undefined,
        levels: selectedLevels.length > 0 ? selectedLevels : undefined,
        action: actionFilter || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        actorType: actorType !== "ALL" ? actorType : undefined,
        searchId: searchId || undefined,
      })

      if (!response.success || !response.data) {
        throw new Error(response.message || "Erreur lors du chargement des logs")
      }

      return response.data
    },
  })

  const logs = data?.logs || []
  const pagination = data?.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 }

  // Réinitialiser la page quand les filtres changent
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  // Toggle scope
  const toggleScope = (scope: LogScope) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    )
    handleFilterChange()
  }

  // Toggle level
  const toggleLevel = (level: LogLevel) => {
    setSelectedLevels((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]
    )
    handleFilterChange()
  }

  // Formater les métadonnées pour l'affichage
  const formatMetadata = (metadata: Record<string, any> | null): string => {
    if (!metadata) return "-"
    const entries = Object.entries(metadata)
    if (entries.length === 0) return "-"

    const display = entries.slice(0, 2).map(([key, value]) => {
      if (Array.isArray(value)) return `${key}: [${value.length} items]`
      if (typeof value === "object") return `${key}: {...}`
      return `${key}: ${value}`
    })

    return display.join(", ")
  }

  // Obtenir l'icône du niveau
  const getLevelIcon = (level: LogLevel) => {
    switch (level) {
      case "INFO":
        return <Info className="h-3 w-3" />
      case "WARN":
        return <AlertTriangle className="h-3 w-3" />
      case "ERROR":
        return <XCircle className="h-3 w-3" />
    }
  }

  // Obtenir la variante du badge niveau
  const getLevelVariant = (level: LogLevel): "default" | "destructive" | "secondary" | "outline" => {
    switch (level) {
      case "INFO":
        return "default"
      case "WARN":
        return "secondary"
      case "ERROR":
        return "destructive"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-8 w-8" />
            Logs Systèmes
          </h1>
          <p className="text-muted-foreground mt-1">
            Journal d&apos;audit et événements système
          </p>
        </div>
        <LoadingButton variant="outline" onClick={() => refetch()} isLoading={isLoading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Rafraîchir
        </LoadingButton>
      </div>

      {/* Card unique avec filtres et tableau */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Événements
              <Badge variant="secondary" className="ml-2">
                {isLoading ? "..." : pagination.total}
              </Badge>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {/* Section Filtres */}
          <div className="mb-6 pb-6 border-b">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              {/* Filtre par Scope */}
              <div className="space-y-2">
                <Label className="text-xs">Scope</Label>
                <div className="flex flex-wrap gap-1">
                  {scopes.map((scope) => (
                    <button
                      key={scope}
                      onClick={() => toggleScope(scope)}
                      className={`px-2 py-1 text-xs rounded border transition-colors ${
                        selectedScopes.includes(scope)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-accent border-input"
                      }`}
                    >
                      {scope}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre par Level */}
              <div className="space-y-2">
                <Label className="text-xs">Niveau</Label>
                <div className="flex flex-wrap gap-1">
                  {levels.map((level) => (
                    <button
                      key={level}
                      onClick={() => toggleLevel(level)}
                      className={`px-2 py-1 text-xs rounded border transition-colors flex items-center gap-1 ${
                        selectedLevels.includes(level)
                          ? level === "INFO"
                            ? "bg-blue-500 text-white border-blue-500"
                            : level === "WARN"
                            ? "bg-orange-500 text-white border-orange-500"
                            : "bg-red-500 text-white border-red-500"
                          : "bg-background hover:bg-accent border-input"
                      }`}
                    >
                      {getLevelIcon(level)}
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              {/* Filtre par Action */}
              <div className="space-y-2">
                <Label htmlFor="action" className="text-xs">Action</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="action"
                    placeholder="Filtrer..."
                    value={actionFilter}
                    onChange={(e) => {
                      setActionFilter(e.target.value)
                      handleFilterChange()
                    }}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>

              {/* Filtre par Type d'Acteur */}
              <div className="space-y-2">
                <Label htmlFor="actorType" className="text-xs">Type d&apos;acteur</Label>
                <Select
                  id="actorType"
                  value={actorType}
                  onChange={(e) => {
                    setActorType(e.target.value as "ALL" | "USER" | "ADMIN")
                    handleFilterChange()
                  }}
                  className="h-8 text-xs"
                >
                  <option value="ALL">Tous</option>
                  <option value="USER">Utilisateur</option>
                  <option value="ADMIN">Administrateur</option>
                </Select>
              </div>

              {/* Filtre par Date Début */}
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="text-xs">Date début</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value)
                    handleFilterChange()
                  }}
                  className="h-8 text-xs"
                />
              </div>

              {/* Filtre par Date Fin */}
              <div className="space-y-2">
                <Label htmlFor="dateTo" className="text-xs">Date fin</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value)
                    handleFilterChange()
                  }}
                  className="h-8 text-xs"
                />
              </div>

              {/* Filtre par ID */}
              <div className="space-y-2 md:col-span-2 lg:col-span-3 xl:col-span-6">
                <Label htmlFor="searchId" className="text-xs">Recherche par ID (User/Admin/Target)</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="searchId"
                    placeholder="Entrez un ID..."
                    value={searchId}
                    onChange={(e) => {
                      setSearchId(e.target.value)
                      handleFilterChange()
                    }}
                    className="pl-7 h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Bouton réinitialiser */}
            <div className="mt-4 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedScopes([])
                  setSelectedLevels([])
                  setActionFilter("")
                  setDateFrom("")
                  setDateTo("")
                  setActorType("ALL")
                  setSearchId("")
                  setCurrentPage(1)
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </div>

          {/* Tableau des logs */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-auto whitespace-nowrap">Date</TableHead>
                  <TableHead className="w-auto whitespace-nowrap">Niveau</TableHead>
                  <TableHead className="w-auto whitespace-nowrap">Scope</TableHead>
                  <TableHead className="w-auto">Action</TableHead>
                  <TableHead className="w-auto whitespace-nowrap">Acteur (ID)</TableHead>
                  <TableHead className="w-auto whitespace-nowrap">Target ID</TableHead>
                  <TableHead className="w-auto">Métadonnées</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
                      <p className="text-muted-foreground">Chargement des logs...</p>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-destructive" />
                      <p className="text-destructive">Erreur lors du chargement des logs</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {error instanceof Error ? error.message : "Une erreur est survenue"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <AlertCircle className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Aucun log trouvé</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log: Log) => (
                    <TableRow key={log.id} className="font-mono text-xs">
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getLevelVariant(log.level)} className="flex items-center gap-1 w-fit text-xs">
                          {getLevelIcon(log.level)}
                          {log.level}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {log.scope}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{log.action}</TableCell>
                      <TableCell>
                        {log.userId ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                              <User className="h-3 w-3" />
                              USER
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.userId}
                            </span>
                          </div>
                        ) : log.adminId ? (
                          <div className="flex items-center gap-1">
                            <Badge variant="default" className="flex items-center gap-1 bg-orange-600 text-xs">
                              <Shield className="h-3 w-3" />
                              ADMIN
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.adminId}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.targetId ? (
                          <span className="text-xs text-muted-foreground">
                            {log.targetId}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">
                          {formatMetadata(log.metadata)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
              </p>
              <div className="flex gap-2">
                <LoadingButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  isLoading={isLoading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Précédent
                </LoadingButton>
                <LoadingButton
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
                  disabled={currentPage === pagination.totalPages}
                  isLoading={isLoading}
                >
                  Suivant
                  <ChevronRight className="h-4 w-4 ml-1" />
                </LoadingButton>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
