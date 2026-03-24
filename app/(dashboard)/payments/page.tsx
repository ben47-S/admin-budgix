'use client'

import { useEffect, useState } from 'react'
import { adminApi, Payment } from '@/lib/api'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingButton } from '@/components/ui/loading-button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { Download, Filter, Copy, Check } from 'lucide-react'
import { parseISODate } from '@/lib/utils'

type PaymentStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED'

export default function PaymentsPage() {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [customApprovalPlan, setCustomApprovalPlan] = useState<'MONTHLY' | 'ANNUAL' | null>(null)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // États pour les messages d'approbation et de rejet
  const [approvalMessage, setApprovalMessage] = useState('Votre paiement a été approuvé')
  const [isApprovalCustom, setIsApprovalCustom] = useState(false)
  const [isRejectionCustom, setIsRejectionCustom] = useState(false)

  // États pour les filtres
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<'ALL' | 'MONTHLY' | 'ANNUAL'>('ALL')

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

  // Récupérer uniquement les paiements en attente de vérification (PENDING_VERIFICATION)
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      'payments',
      searchQuery,
      selectedPlan,
    ],
    queryFn: async () => {
      const params: any = {}

      // Appliquer les filtres
      if (searchQuery) params.search = searchQuery
      if (selectedPlan !== 'ALL') params.plan = selectedPlan
      // Forcer le statut PENDING_VERIFICATION
      params.status = 'PENDING_VERIFICATION'

      const response = await adminApi.payments.getAll(params)
      if (process.env.NODE_ENV === 'development') {
        console.log('getAll response:', {
          success: response.success,
          count: response.data?.payments?.length || 0,
        })
      }
      if (!response.success) {
        throw new Error(response.message || 'Erreur lors du chargement')
      }
      return response.data?.payments || []
    },
    refetchInterval: 5000, // Auto-refresh
  })

  // Initialiser le message de rejet avec la valeur par défaut quand le dialog s'ouvre
  useEffect(() => {
    if (isRejectDialogOpen && !isRejectionCustom) {
      setRejectReason("Vérifier l'identifiant ou la date du transfert")
    }
  }, [isRejectDialogOpen, isRejectionCustom])

  // Réinitialiser les états quand les dialogs se ferment
  useEffect(() => {
    if (!isRejectDialogOpen) {
      setIsRejectionCustom(false)
    }
  }, [isRejectDialogOpen])

  useEffect(() => {
    if (!isApproveDialogOpen) {
      setIsApprovalCustom(false)
      setApprovalMessage('Votre paiement a été approuvé')
    }
  }, [isApproveDialogOpen])

  // Gérer le bouton "Personnaliser" pour le rejet
  const handleCustomizeReject = () => {
    setIsRejectionCustom(true)
    setRejectReason('')
  }

  // Gérer le bouton "Personnaliser" pour l'approbation
  const handleCustomizeApproval = () => {
    setIsApprovalCustom(true)
    setApprovalMessage('')
  }

  // Approuver un paiement avec plan et message optionnels
  const handleApprove = async (paymentId: string, customPlan?: 'MONTHLY' | 'ANNUAL') => {
    setIsApproving(true)
    try {
      const message = approvalMessage.trim() || undefined
      const response = await adminApi.payments.approve(paymentId, customPlan, message)
      if (response.success) {
        setSelectedPayment(null)
        setIsApproveDialogOpen(false)
        setCustomApprovalPlan(null)
        setApprovalMessage('Votre paiement a été approuvé')
        setIsApprovalCustom(false)

        // Attendre un peu avant de refetch pour éviter les blocages
        setTimeout(() => {
          refetch()
        }, 500)
      } else {
        alert(response.message || 'Erreur lors de l\'approbation')
      }
    } catch (err) {
      alert('Erreur lors de l\'approbation')
      console.error(err)
    } finally {
      setIsApproving(false)
    }
  }

  // Rejeter un paiement
  const handleReject = async () => {
    if (!selectedPayment || !rejectReason.trim()) {
      alert('Veuillez entrer une raison')
      return
    }

    setIsRejecting(true)
    try {
      const response = await adminApi.payments.reject(
        selectedPayment.id,
        rejectReason
      )
      if (response.success) {
        // Fermer immédiatement le modal
        setSelectedPayment(null)
        setRejectReason('')
        setIsRejectDialogOpen(false)
        
        // Attendre un peu avant de refetch pour éviter les blocages
        setTimeout(() => {
          refetch()
        }, 500)
      } else {
        alert(response.message || 'Erreur lors du rejet')
      }
    } catch (err) {
      alert('Erreur lors du rejet')
      console.error(err)
    } finally {
      setIsRejecting(false)
    }
  }

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
      format(parseISODate(payment.transferDate), 'dd MMMM yyyy', { locale: fr }),
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
      `paiements_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.csv`
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
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Paiements Premium</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            {payments.length} demande{payments.length !== 1 ? 's' : ''} en attente de validation
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={payments.length === 0}
          variant="outline"
          className="gap-2 w-full sm:w-auto min-h-[44px]"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="text-gray-600">Chargement des paiements...</p>
          </div>
        </Card>
      ) : payments.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-600">
            Aucune demande en attente
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
              className="p-4 sm:p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col gap-4 md:grid md:grid-cols-5 md:gap-6">
                {/* Colonne 1: Utilisateur */}
                <div className="space-y-2 pb-3 border-b md:pb-0 md:border-b-0">
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
                <div className="space-y-1 pb-3 border-b md:pb-0 md:border-b-0">
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
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-600">Plan: </span>
                      <span className="font-medium">
                        {payment.plan === 'MONTHLY' ? 'Mensuel' : 'Annuel'}
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-gray-600">Montant: </span>
                      <span className="font-bold">
                        {payment.amount.toLocaleString()} XOF
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs">
                      Créé le {format(new Date(payment.createdAt), 'dd MMMM yyyy', { locale: fr })}
                    </p>
                  </div>
                </div>

                {/* Colonne 3: Infos Wave */}
                <div className="space-y-1 pb-3 border-b md:pb-0 md:border-b-0">
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
                        onClick={() =>
                          copyToClipboard(payment.waveTransactionId, payment.id)
                        }
                        variant="ghost"
                        size="sm"
                        className="h-auto p-0.5 flex-shrink-0"
                        title="Copier l'ID Wave"
                      >
                        {copiedId === payment.id ? (
                          <Check className="w-3 h-3 text-green-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </Button>
                    </div>
                    <p className="text-gray-600 text-xs">
                      Transfert le {format(parseISODate(payment.transferDate), 'dd MMMM yyyy', {
                        locale: fr,
                      })}
                    </p>
                  </div>
                </div>

                {/* Colonne 4: Statut et dates */}
                <div className="space-y-2 pb-3 border-b md:pb-0 md:border-b-0">
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

                {/* Colonne 5: Actions */}
                <div className="flex flex-col gap-2 justify-center pt-2 md:pt-0">
                  {payment.status === 'PENDING_VERIFICATION' ? (
                    <>
                      <LoadingButton
                        onClick={() => {
                          setSelectedPayment(payment)
                          setIsApproveDialogOpen(true)
                          setCustomApprovalPlan(null)
                        }}
                        isLoading={isApproving}
                        disabled={isRejecting}
                        className="bg-green-600 hover:bg-green-700 text-white min-h-[44px]"
                      >
                        Approuver
                      </LoadingButton>
                      <LoadingButton
                        onClick={() => {
                          setSelectedPayment(payment)
                          setIsRejectDialogOpen(true)
                        }}
                        isLoading={isRejecting}
                        disabled={isApproving}
                        variant="destructive"
                        className="min-h-[44px]"
                      >
                        Rejeter
                      </LoadingButton>
                    </>
                  ) : (
                    <div className="text-xs text-gray-600 text-center py-2">
                      ✅ Traité
                    </div>
                  )}
                </div>
              </div>
            </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de rejet */}
      {isRejectDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <h2 className="text-xl font-bold">Rejeter le paiement</h2>
            <p className="text-sm text-gray-600">
              Utilisateur:{' '}
              <span className="font-medium">
                {selectedPayment?.user.username}
              </span>
            </p>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Raison du rejet
                </label>
                {!isRejectionCustom && (
                  <Button
                    onClick={handleCustomizeReject}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                  >
                    Personnaliser
                  </Button>
                )}
              </div>
              <Textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder={isRejectionCustom ? "Entrez un message personnalisé..." : "Message par défaut"}
                className="w-full"
                rows={4}
              />
              {!isRejectionCustom && (
                <p className="text-xs text-gray-500">
                  Message par défaut : "Vérifier l'identifiant ou la date du transfert"
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end">
              <Button
                onClick={() => {
                  setIsRejectDialogOpen(false)
                  setRejectReason('')
                  setSelectedPayment(null)
                }}
                variant="outline"
                disabled={isRejecting}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Annuler
              </Button>
              <LoadingButton
                onClick={handleReject}
                isLoading={isRejecting}
                disabled={!rejectReason.trim()}
                variant="destructive"
                className="w-full sm:w-auto min-h-[44px]"
              >
                Confirmer le rejet
              </LoadingButton>
            </div>
          </Card>
        </div>
      )}

      {/* Dialog d'approbation avec choix du plan */}
      {isApproveDialogOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            <h2 className="text-xl font-bold">Approuver le paiement</h2>
            <p className="text-sm text-gray-600">
              Utilisateur:{' '}
              <span className="font-medium">
                {selectedPayment?.user.username}
              </span>
            </p>

            <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold">Montant: {selectedPayment?.amount.toLocaleString()} XOF</h3>
              <p className="text-sm text-gray-600">
                Plan actuel: <span className="font-medium">{selectedPayment?.plan === 'MONTHLY' ? 'Mensuel' : 'Annuel'}</span>
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium">
                S\u00e9lectionner un plan pour l&apos;abonnement
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 min-h-[56px] touch-manipulation"
                  style={{backgroundColor: customApprovalPlan === 'MONTHLY' ? '#eff6ff' : 'white', borderColor: customApprovalPlan === 'MONTHLY' ? '#3b82f6' : '#e5e7eb'}}>
                  <input
                    type="radio"
                    name="approval-plan"
                    value="MONTHLY"
                    checked={customApprovalPlan === 'MONTHLY'}
                    onChange={() => setCustomApprovalPlan('MONTHLY')}
                    className="w-5 h-5"
                  />
                  <div>
                    <div className="font-medium">Abonnement Mensuel</div>
                    <div className="text-xs text-gray-600">Plan par mois</div>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 min-h-[56px] touch-manipulation"
                  style={{backgroundColor: customApprovalPlan === 'ANNUAL' ? '#eff6ff' : 'white', borderColor: customApprovalPlan === 'ANNUAL' ? '#3b82f6' : '#e5e7eb'}}>
                  <input
                    type="radio"
                    name="approval-plan"
                    value="ANNUAL"
                    checked={customApprovalPlan === 'ANNUAL'}
                    onChange={() => setCustomApprovalPlan('ANNUAL')}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">Abonnement Annuel</div>
                    <div className="text-xs text-gray-600">Plan par an</div>
                  </div>
                </label>
              </div>
            </div>

            <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
              💡 Laissez vide pour utiliser le plan par défaut ({selectedPayment?.plan === 'MONTHLY' ? 'Mensuel' : 'Annuel'})
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium">
                  Message de notification
                </label>
                {!isApprovalCustom && (
                  <Button
                    onClick={handleCustomizeApproval}
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                  >
                    Personnaliser
                  </Button>
                )}
              </div>
              <Textarea
                value={approvalMessage}
                onChange={(e) => setApprovalMessage(e.target.value)}
                placeholder={isApprovalCustom ? "Entrez un message personnalisé..." : "Message par défaut"}
                className="w-full"
                rows={3}
              />
              {!isApprovalCustom && (
                <p className="text-xs text-gray-500">
                  Message par défaut : "Votre paiement a été approuvé"
                </p>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setIsApproveDialogOpen(false)
                  setCustomApprovalPlan(null)
                  setSelectedPayment(null)
                }}
                variant="outline"
                disabled={isApproving}
              >
                Annuler
              </Button>
              <LoadingButton
                onClick={() => handleApprove(selectedPayment!.id, customApprovalPlan || undefined)}
                isLoading={isApproving}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Approuver
              </LoadingButton>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

