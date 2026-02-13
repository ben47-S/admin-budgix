'use client'

import { useState } from 'react'
import { adminApi, Payment } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Download, Filter, Copy, Check } from 'lucide-react'

type PaymentStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED'

export default function PaymentsHistoryPage() {
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<'ALL' | 'MONTHLY' | 'ANNUAL'>('ALL')
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'APPROVED' | 'REJECTED'>('ALL')

  // Grouper les paiements par mois
  const groupPaymentsByMonth = (payments: Payment[]) => {
    const grouped: Record<string, Payment[]> = {}

    payments.forEach((payment) => {
      const date = new Date(payment.createdAt)
      const monthKey = format(date, 'MMMM yyyy', { locale: fr })
      
      if (!grouped[monthKey]) {
        grouped[monthKey] = []
      }
      grouped[monthKey].push(payment)
    })

    // Trier les mois par date décroissante
    return Object.entries(grouped)
      .sort((a, b) => {
        const dateA = new Date(payments.find(p => format(new Date(p.createdAt), 'MMMM yyyy', { locale: fr }) === a[0])?.createdAt || 0)
        const dateB = new Date(payments.find(p => format(new Date(p.createdAt), 'MMMM yyyy', { locale: fr }) === b[0])?.createdAt || 0)
        return dateB.getTime() - dateA.getTime()
      })
      .map(([month, monthPayments]) => ({
        month,
        payments: monthPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }))
  }

  // Copier un ID au clipboard
  const copyToClipboard = (text: string, paymentId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(paymentId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Récupérer les paiements historiques (APPROVED et REJECTED uniquement)
  const { data, isLoading, error } = useQuery({
    queryKey: [
      'payments-history',
      searchQuery,
      selectedPlan,
      selectedStatus,
    ],
    queryFn: async () => {
      const params: any = {}

      // Appliquer les filtres
      if (searchQuery) params.search = searchQuery
      if (selectedPlan !== 'ALL') params.plan = selectedPlan
      if (selectedStatus !== 'ALL') params.status = selectedStatus

      const response = await adminApi.payments.getAll(params)
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors du chargement')
      }
      
      // Filtrer pour ne garder que APPROVED et REJECTED
      const allPayments = response.data?.payments || []
      return allPayments.filter(p => p.status === 'APPROVED' || p.status === 'REJECTED')
    },
    refetchInterval: 30000, // Refresh toutes les 30 secondes
  })

  // Exporter en CSV
  const handleExportCSV = () => {
    const payments = data || []
    if (payments.length === 0) {
      alert('Aucun paiement à exporter')
      return
    }

    const headers = [
      'ID Paiement',
      'Utilisateur',
      'Email',
      'Téléphone',
      'Plan',
      'Montant (XOF)',
      'Statut',
      'ID Transaction Wave',
      'Date Transfert',
      'Créé le',
      'Approuvé le',
      'Rejeté le',
      'Raison Rejet',
    ]

    const rows = payments.map((payment) => [
      payment.id,
      payment.user.username || '',
      payment.user.email || '',
      payment.user.phone || '',
      payment.plan,
      payment.amount,
      payment.status,
      payment.waveTransactionId,
      format(new Date(payment.transferDate), 'dd MMMM yyyy', { locale: fr }),
      format(new Date(payment.createdAt), 'dd MMMM yyyy', { locale: fr }),
      payment.approvedAt
        ? format(new Date(payment.approvedAt), 'dd MMMM yyyy', { locale: fr })
        : '',
      payment.rejectedAt
        ? format(new Date(payment.rejectedAt), 'dd MMMM yyyy', { locale: fr })
        : '',
      payment.rejectionReason || '',
    ])

    // Créer le CSV
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n')

    // Télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `historique_paiements_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Badge de statut
  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, 'default' | 'secondary' | 'destructive'> = {
      PENDING_VERIFICATION: 'secondary',
      APPROVED: 'default',
      REJECTED: 'destructive',
    }

    const labels: Record<PaymentStatus, string> = {
      PENDING_VERIFICATION: 'En attente',
      APPROVED: 'Approuvé',
      REJECTED: 'Rejeté',
    }

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  const payments = data || []

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Historique des Demandes Premium</h1>
          <p className="text-gray-600 mt-1">
            {payments.length} paiement{payments.length !== 1 ? 's' : ''} traité{payments.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={payments.length === 0}
          variant="outline"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Exporter CSV
        </Button>
      </div>

      {/* Barre de filtre */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4" />
          <h3 className="font-semibold">Filtres</h3>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Rechercher utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            type="text"
          />
          <Select value={selectedPlan} onChange={(e: any) => setSelectedPlan(e.target.value)}>
            <option value="ALL">Tous les plans</option>
            <option value="MONTHLY">Abonnés mensuels</option>
            <option value="ANNUAL">Abonnés annuels</option>
          </Select>
          <Select value={selectedStatus} onChange={(e: any) => setSelectedStatus(e.target.value)}>
            <option value="ALL">Tous les statuts</option>
            <option value="APPROVED">Approuvés</option>
            <option value="REJECTED">Rejetés</option>
          </Select>
        </div>
      </Card>

      {error && (
        <Card className="bg-red-50 border-red-200 p-4">
          <p className="text-red-800">
            Erreur: {error instanceof Error ? error.message : JSON.stringify(error)}
          </p>
        </Card>
      )}

      {isLoading ? (
        <Card className="p-12 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-600">Chargement de l&apos;historique...</p>
          </div>
        </Card>
      ) : payments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">
            Aucun paiement dans l&apos;historique
          </p>
        </Card>
      ) : (
        <div className="space-y-6">
          {groupPaymentsByMonth(payments).map(({ month, payments: monthPayments }) => (
            <div key={month}>
              <div className="mb-4 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200"></div>
                <Badge variant="secondary" className="px-3 py-1">
                  {month}
                </Badge>
                <div className="h-px flex-1 bg-gray-200"></div>
              </div>
              <div className="grid gap-4">
                {monthPayments.map((payment) => (
                  <Card
                    key={payment.id}
                    className="p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      {/* Colonne 1: Utilisateur */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Utilisateur
                        </h3>
                        <div className="space-y-1 text-sm">
                          <p className="font-medium">
                            {payment.user.username || 'N/A'}
                          </p>
                          <p className="text-gray-600">{payment.user.email || 'N/A'}</p>
                          <p className="text-gray-600">{payment.user.phone || 'N/A'}</p>
                        </div>
                      </div>

                      {/* Colonne 2: Paiement */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Paiement
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 text-xs">ID: </span>
                            <span className="font-mono text-xs break-all flex-1 truncate">
                              {payment.id}
                            </span>
                            <Button
                              onClick={() => copyToClipboard(payment.id, payment.id)}
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0.5 flex-shrink-0"
                              title="Copier l'ID"
                            >
                              {copiedId === payment.id ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-400" />
                              )}
                            </Button>
                          </div>
                          <p>
                            <span className="text-gray-600">Plan: </span>
                            <span className="font-medium">
                              {payment.plan === 'MONTHLY' ? 'Mensuel' : 'Annuel'}
                            </span>
                          </p>
                          <p>
                            <span className="text-gray-600">Montant: </span>
                            <span className="font-bold text-green-700">
                              {payment.amount.toLocaleString()} XOF
                            </span>
                          </p>
                          <p className="text-gray-600 text-xs">
                            Créé le {format(new Date(payment.createdAt), 'dd MMMM yyyy', {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Colonne 3: Infos Wave */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Infos Wave
                        </h3>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-600 text-xs">Transaction: </span>
                            <span className="font-mono text-xs break-all flex-1 truncate">
                              {payment.waveTransactionId}
                            </span>
                            <Button
                              onClick={() => copyToClipboard(payment.waveTransactionId, `wave-${payment.id}`)}
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0.5 flex-shrink-0"
                              title="Copier l'ID Wave"
                            >
                              {copiedId === `wave-${payment.id}` ? (
                                <Check className="w-3 h-3 text-green-600" />
                              ) : (
                                <Copy className="w-3 h-3 text-gray-400" />
                              )}
                            </Button>
                          </div>
                          <p className="text-gray-600 text-xs">
                            Transfert le {format(new Date(payment.transferDate), 'dd MMMM yyyy', {
                              locale: fr,
                            })}
                          </p>
                        </div>
                      </div>

                      {/* Colonne 4: Statut et dates */}
                      <div className="space-y-2">
                        <h3 className="text-sm font-semibold text-gray-900">
                          Statut
                        </h3>
                        <div className="space-y-2 text-sm">
                          {getStatusBadge(payment.status)}
                          {payment.approvedAt && (
                            <p className="text-green-700 text-xs">
                              Approuvé le {format(new Date(payment.approvedAt), 'dd MMMM yyyy', {
                                locale: fr,
                              })}
                            </p>
                          )}
                          {payment.rejectedAt && (
                            <div className="text-red-700 text-xs space-y-1">
                              <p>
                                Rejeté le {format(new Date(payment.rejectedAt), 'dd MMMM yyyy', {
                                  locale: fr,
                                })}
                              </p>
                              {payment.rejectionReason && (
                                <p className="italic">
                                  &quot;{payment.rejectionReason}&quot;
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Colonne 5: Info */}
                      <div className="flex flex-col gap-2 justify-center">
                        <div className="text-xs text-gray-600 text-center py-2">
                          {payment.status === 'APPROVED' ? '✅ Traité' : '❌ Refusé'}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
