import { useQuery } from '@tanstack/react-query'
import { adminApi } from '@/lib/api'

export function usePendingPaymentsCount() {
  const { data = 0 } = useQuery({
    queryKey: ['pending-payments-count'],
    queryFn: async () => {
      const response = await adminApi.payments.getAll({ status: 'PENDING_VERIFICATION' })
      return response.data?.payments?.length || 0
    },
    refetchInterval: 5000, // Refresh toutes les 5 secondes
  })

  return data
}
