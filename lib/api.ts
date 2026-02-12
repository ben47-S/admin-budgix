/**
 * Client API pour communiquer avec le backend Budgix
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

/**
 * Récupère le token d'authentification depuis le localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('admin_token')
}

/**
 * Stocke le token d'authentification dans le localStorage
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('admin_token', token)
}

/**
 * Supprime le token d'authentification
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_token')
}

/**
 * Effectue une requête HTTP avec authentification
 */
async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken()
  
  // Créer un objet headers avec le bon type pour permettre l'indexation
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    })

    // Si le token est invalide ou expiré, rediriger vers la page de login
    // Mais seulement si ce n'est pas déjà la page de login pour éviter les boucles
    if ((response.status === 401 || response.status === 403) && typeof window !== 'undefined') {
      const currentPath = window.location.pathname
      if (currentPath !== '/login') {
        removeToken()
        window.location.href = '/login'
      }
    }

    return response
  } catch (error) {
    // Gérer les erreurs réseau (CORS, timeout, etc.)
    console.error('Network error:', error)
    throw new Error('Erreur de connexion au serveur. Vérifiez votre connexion internet.')
  }
}

/**
 * Types pour les réponses API
 */
export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
  error?: string
}

export interface User {
  id: string
  username: string
  phone: string
  email: string | null
  isPremium: boolean
  role: 'USER' | 'ADMIN'
  createdAt: string
  _count?: {
    transactions: number
    budgets: number
    debts: number
    externalSubscriptions: number
    categories?: number
    notifications?: number
  }
  subscription?: {
    plan: string
    price: number
    startDate: string
    endDate: string | null
  }
  stats?: {
    totalTransactions: number
    totalAmount: number
    totalExpenses: number
    totalIncome: number
  }
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface UsersResponse {
  users: User[]
  pagination: Pagination
}

export interface GlobalStats {
  users: {
    total: number
    premium: number
    admin: number
    regular: number
    newLast30Days: number
  }
  transactions: {
    total: number
    totalAmount: number
    totalExpenses: number
    totalIncome: number
  }
  features: {
    budgets: number
    debts: number
    externalSubscriptions: number
    globalCategories: number
  }
  subscriptions: {
    active: number
  }
}

export interface Category {
  id: string
  name: string
  type: 'INCOME' | 'EXPENSE'
  createdAt: string
}

export interface Review {
  id: string
  userId: string
  rating: number
  comment: string | null
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string | null
    phone: string | null
    email: string | null
  }
}

export interface ReviewStats {
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export interface ImprovementSuggestion {
  id: string
  userId: string
  content: string
  createdAt: string
  updatedAt: string
  user: {
    id: string
    username: string | null
    phone: string | null
    email: string | null
  }
}

export interface SuggestionStats {
  totalSuggestions: number
  uniqueUsers: number
  averagePerUser: number
}

export interface Payment {
  id: string
  userId: string
  user: {
    id: string
    username: string | null
    phone: string | null
    email: string | null
  }
  plan: 'MONTHLY' | 'ANNUAL'
  amount: number
  status: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED'
  waveTransactionId: string
  senderName: string
  transferDate: string
  rejectionReason?: string | null
  rejectedAt?: string | null
  rejectedById?: string | null
  approvedAt?: string | null
  approvedById?: string | null
  createdAt: string
  updatedAt: string
}

export interface Subscription {
  id: string
  userId: string
  plan: 'MONTHLY' | 'ANNUAL'
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface PendingPaymentsResponse {
  payments: Payment[]
}

export interface ExternalSubscription {
  id: string
  userId: string
  user: {
    id: string
    username: string
    phone: string
    email: string | null
    isPremium: boolean
    role: 'USER' | 'ADMIN'
  }
  name: string
  amount: number
  startDate: string
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
  customDays: number | null
  nextBillingDate: string
  categoryId: string | null
  category: {
    id: string
    name: string
    type: 'INCOME' | 'EXPENSE'
  } | null
  notes: string | null
  isActive: boolean
  expirationStatus: string | null
  createdAt: string
  updatedAt: string
}

export interface ExternalSubscriptionsResponse {
  subscriptions: ExternalSubscription[]
  pagination: Pagination
}

// Types pour les Logs
export type LogLevel = "INFO" | "WARN" | "ERROR"
export type LogScope = "USER" | "BUSINESS" | "SECURITY" | "ADMIN" | "SYSTEM"

export interface Log {
  id: string
  level: LogLevel
  scope: LogScope
  action: string
  userId: string | null
  adminId: string | null
  targetId: string | null
  metadata: Record<string, any> | null
  createdAt: string
}

export interface LogsResponse {
  logs: Log[]
  pagination: Pagination
}

// Ré-exporter les types pour les rendre accessibles
export type { LogLevel as LogLevelType, LogScope as LogScopeType }

/**
 * Client API Admin
 */
export const adminApi = {
  /**
   * Authentification
   */
  auth: {
    /**
     * Vérifie la validité du token admin
     */
    verify: async (): Promise<ApiResponse<{ user: User }>> => {
      try {
        const response = await fetchWithAuth('/api/admin/auth/verify')

        if (!response.ok) {
          let errorMessage = 'Session invalide'
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            errorMessage = `Erreur ${response.status}: ${response.statusText}`
          }
          return {
            success: false,
            message: errorMessage,
          }
        }

        const data = await response.json()
        return data
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },
    /**
     * Connexion avec email et mot de passe
     */
    login: async (email: string, password: string): Promise<ApiResponse<{ user: User; token: string }>> => {
      try {
        const response = await fetchWithAuth('/api/admin/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        })

        // Vérifier si la réponse est OK
        if (!response.ok) {
          // Essayer de parser le message d'erreur
          let errorMessage = 'Erreur de connexion'
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            // Si la réponse n'est pas du JSON, utiliser le statut
            errorMessage = `Erreur ${response.status}: ${response.statusText}`
          }
          return {
            success: false,
            message: errorMessage,
          }
        }

        // Parser la réponse JSON
        const data = await response.json()
        return data
      } catch (error) {
        // Gérer les erreurs réseau ou de parsing
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Définit le mot de passe de l'admin connecté
     */
    setPassword: async (password: string): Promise<ApiResponse<void>> => {
      const response = await fetchWithAuth('/api/admin/auth/set-password', {
        method: 'POST',
        body: JSON.stringify({ password }),
      })
      return response.json()
    },

    /**
     * Définit le mot de passe d'un admin par email
     */
    setPasswordByEmail: async (email: string, password: string): Promise<ApiResponse<void>> => {
      const response = await fetchWithAuth('/api/admin/auth/set-password-by-email', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      return response.json()
    },
  },

  /**
   * Gestion des utilisateurs
   */
  users: {
    /**
     * Récupère la liste des utilisateurs avec pagination et filtres
     */
    getUsers: async (params?: {
      page?: number
      limit?: number
      search?: string
      isPremium?: boolean
      role?: 'USER' | 'ADMIN'
      createdAtFrom?: string
      createdAtTo?: string
    }): Promise<ApiResponse<UsersResponse>> => {
      const queryParams = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value))
          }
        })
      }
      const query = queryParams.toString()
      const response = await fetchWithAuth(`/api/admin/users?${query}`)
      return response.json()
    },

    /**
     * Récupère les détails d'un utilisateur
     */
    getUser: async (userId: string): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetchWithAuth(`/api/admin/users/${userId}`)
      return response.json()
    },

    /**
     * Met à jour un utilisateur
     */
    updateUser: async (
      userId: string,
      data: {
        role?: 'USER' | 'ADMIN'
        isPremium?: boolean
        username?: string
      }
    ): Promise<ApiResponse<{ user: User }>> => {
      const response = await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      })
      return response.json()
    },

    /**
     * Supprime un utilisateur
     */
    deleteUser: async (userId: string): Promise<ApiResponse<void>> => {
      const response = await fetchWithAuth(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })
      return response.json()
    },

    /**
     * Envoie une notification push à un utilisateur
     */
    sendNotification: async (
      userId: string,
      data: {
        title: string
        body: string
        data?: Record<string, any>
      }
    ): Promise<ApiResponse<{ tokensCount: number; tokens: Array<{ id: string; platform: string; deviceId: string }> }>> => {
      try {
        const response = await fetchWithAuth(`/api/admin/users/${userId}/send-notification`, {
          method: 'POST',
          body: JSON.stringify(data),
        })

        // Parser la réponse JSON
        const result = await response.json()

        // Si la réponse n'est pas OK, retourner l'erreur
        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }

        return result
      } catch (error) {
        // Gérer les erreurs réseau ou de parsing
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },
  },

  /**
   * Statistiques globales
   */
  stats: {
    /**
     * Récupère les statistiques globales de la plateforme
     * Le backend peut retourner soit:
     * - { success: true, data: { stats: { users: {...}, ... } } }
     * - { success: true, data: { users: {...}, ... } }
     * Route: GET /api/admin/stats
     */
    getStats: async (): Promise<ApiResponse<GlobalStats | { stats: GlobalStats }>> => {
      const response = await fetchWithAuth('/api/admin/stats')
      return response.json()
    },
  },

  /**
   * Gestion des catégories globales
   */
  categories: {
    /**
     * Récupère la liste des catégories globales
     * Le backend retourne { success: true, data: { categories: [...] } }
     */
    getCategories: async (): Promise<ApiResponse<{ categories: Category[] }>> => {
      const response = await fetchWithAuth('/api/admin/categories')
      return response.json()
    },

    /**
     * Crée une nouvelle catégorie globale
     */
    createCategory: async (data: { name: string; type: 'INCOME' | 'EXPENSE' }): Promise<ApiResponse<Category>> => {
      try {
        const response = await fetchWithAuth('/api/admin/categories', {
          method: 'POST',
          body: JSON.stringify(data),
        })

        // Parser la réponse JSON
        const result = await response.json()

        // Si la réponse n'est pas OK, retourner l'erreur
        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }

        return result
      } catch (error) {
        // Gérer les erreurs réseau ou de parsing
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Met à jour une catégorie globale
     */
    updateCategory: async (
      categoryId: string,
      data: { name?: string; type?: 'INCOME' | 'EXPENSE' }
    ): Promise<ApiResponse<Category>> => {
      try {
        const response = await fetchWithAuth(`/api/admin/categories/${categoryId}`, {
          method: 'PUT',
          body: JSON.stringify(data),
        })

        // Parser la réponse JSON
        const result = await response.json()

        // Si la réponse n'est pas OK, retourner l'erreur
        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }

        return result
      } catch (error) {
        // Gérer les erreurs réseau ou de parsing
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Supprime une catégorie globale
     */
    deleteCategory: async (categoryId: string): Promise<ApiResponse<void>> => {
      try {
        const response = await fetchWithAuth(`/api/admin/categories/${categoryId}`, {
          method: 'DELETE',
        })

        // Parser la réponse JSON
        const result = await response.json()

        // Si la réponse n'est pas OK, retourner l'erreur
        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }

        return result
      } catch (error) {
        // Gérer les erreurs réseau ou de parsing
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },
  },

  /**
   * API Discussions / Service Client
   */
  discussions: {
    /**
     * Récupérer toutes les discussions ouvertes
     */
    getOpenDiscussions: async (): Promise<ApiResponse<Array<{
      id: string
      userId: string
      status: "OPEN" | "CLOSED" | "ARCHIVED"
      lastActivityAt: string
      createdAt: string
      updatedAt: string
      user: {
        id: string
        username: string | null
        phone: string | null
        email: string | null
      }
      messages: Array<{
        id: string
        content: string
        createdAt: string
        senderType: "USER" | "ADMIN"
      }>
      _count: {
        messages: number
      }
    }>>> => {
      try {
        const response = await fetchWithAuth("/api/discussions/open")
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue"
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Récupérer une discussion spécifique avec tous ses messages
     */
    getDiscussion: async (
      discussionId: string
    ): Promise<ApiResponse<{
      id: string
      userId: string
      status: "OPEN" | "CLOSED" | "ARCHIVED"
      lastActivityAt: string
      createdAt: string
      updatedAt: string
      user: {
        id: string
        username: string | null
        phone: string | null
        email: string | null
      }
      messages: Array<{
        id: string
        discussionId: string
        senderId: string | null
        senderType: "USER" | "ADMIN"
        content: string
        read: boolean
        createdAt: string
        updatedAt: string
      }>
    }>> => {
      try {
        const response = await fetchWithAuth(`/api/discussions/${discussionId}`)
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue"
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Envoyer un message dans une discussion (via HTTP)
     */
    sendMessage: async (
      discussionId: string,
      content: string
    ): Promise<ApiResponse<{
      id: string
      discussionId: string
      senderId: null
      senderType: "ADMIN"
      content: string
      read: boolean
      createdAt: string
      updatedAt: string
      discussion: {
        id: string
        userId: string
        user: {
          id: string
          username: string | null
          phone: string | null
          email: string | null
        }
      }
    }>> => {
      try {
        const response = await fetchWithAuth(
          `/api/discussions/${discussionId}/messages`,
          {
            method: "POST",
            body: JSON.stringify({ content }),
          }
        )

        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue"
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Marquer une discussion comme lue
     */
    markAsRead: async (
      discussionId: string
    ): Promise<ApiResponse<{ message: string }>> => {
      try {
        const response = await fetchWithAuth(
          `/api/discussions/${discussionId}/read`,
          {
            method: "POST",
          }
        )

        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue"
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Fermer une discussion
     */
    closeDiscussion: async (
      discussionId: string
    ): Promise<ApiResponse<{ message: string }>> => {
      try {
        const response = await fetchWithAuth(
          `/api/discussions/${discussionId}/close`,
          {
            method: "POST",
          }
        )

        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue"
        return {
          success: false,
          message: errorMessage,
        }
      }
    },
  },

  /**
   * API Avis et Suggestions
   */
  reviews: {
    /**
     * Récupère tous les avis
     */
    getAll: async (): Promise<ApiResponse<Review[]>> => {
      try {
        const response = await fetchWithAuth('/api/reviews/all')
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Récupère les statistiques des avis
     */
    getStats: async (): Promise<ApiResponse<ReviewStats>> => {
      try {
        const response = await fetchWithAuth('/api/reviews/stats')
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },
  },

  suggestions: {
    /**
     * Récupère toutes les suggestions
     */
    getAll: async (): Promise<ApiResponse<ImprovementSuggestion[]>> => {
      try {
        const response = await fetchWithAuth('/api/improvement-suggestions/all')
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Récupère les statistiques des suggestions
     */
    getStats: async (): Promise<ApiResponse<SuggestionStats>> => {
      try {
        const response = await fetchWithAuth('/api/improvement-suggestions/stats')
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Récupère une suggestion par son ID
     */
    getById: async (suggestionId: string): Promise<ApiResponse<ImprovementSuggestion>> => {
      try {
        const response = await fetchWithAuth(`/api/improvement-suggestions/${suggestionId}`)
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Modifie une suggestion
     */
    update: async (suggestionId: string, content: string): Promise<ApiResponse<ImprovementSuggestion>> => {
      try {
        const response = await fetchWithAuth(`/api/improvement-suggestions/${suggestionId}`, {
          method: 'PUT',
          body: JSON.stringify({ content }),
        })

        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Supprime une suggestion
     */
    delete: async (suggestionId: string): Promise<ApiResponse<void>> => {
      try {
        const response = await fetchWithAuth(`/api/improvement-suggestions/${suggestionId}`, {
          method: 'DELETE',
        })

        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },
  },

  /**
   * API Paiements Premium
   */
  payments: {
    /**
     * Récupère la liste des paiements en attente de vérification
     */
    getPending: async (): Promise<ApiResponse<PendingPaymentsResponse>> => {
      try {
        const response = await fetchWithAuth('/api/admin/payments/pending')
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Approuve un paiement en attente
     * - Statut passe à APPROVED
     * - Crée/renouvelle l'abonnement premium
     * - Envoie notification push au client
     */
    approve: async (paymentId: string, customPlan?: 'MONTHLY' | 'ANNUAL'): Promise<ApiResponse<{ payment: Payment; subscription: Subscription }>> => {
      try {
        const body = customPlan ? { plan: customPlan } : {}
        
        const response = await fetchWithAuth(`/api/admin/payments/${paymentId}/approve`, {
          method: 'POST',
          body: Object.keys(body).length > 0 ? JSON.stringify(body) : undefined,
        })

        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Rejette un paiement en attente
     * - Statut passe à REJECTED
     * - Raison de rejet sauvegardée
     * - Envoie notification push au client avec la raison
     * - Client peut créer un nouveau paiement
     */
    reject: async (paymentId: string, reason: string): Promise<ApiResponse<{ payment: Payment }>> => {
      try {
        const response = await fetchWithAuth(`/api/admin/payments/${paymentId}/reject`, {
          method: 'POST',
          body: JSON.stringify({ reason }),
        })

        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },

    /**
     * Récupère tous les paiements avec filtres optionnels
     * - Permet d'afficher l'historique complet (PENDING, APPROVED, REJECTED)
     * - Supporte les filtres par statut, date, montant, utilisateur
     */
    getAll: async (params?: {
      status?: 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED'
      startDate?: string
      endDate?: string
      minAmount?: number
      maxAmount?: number
      search?: string
    }): Promise<ApiResponse<PendingPaymentsResponse>> => {
      try {
        const queryParams = new URLSearchParams()
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value))
            }
          })
        }
        const query = queryParams.toString()
        const response = await fetchWithAuth(`/api/admin/payments?${query}`)
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },
  },

  /**
   * Gestion des abonnements externes
   */
  externalSubscriptions: {
    /**
     * Récupère tous les abonnements externes de tous les utilisateurs
     */
    getAll: async (params?: {
      page?: number
      limit?: number
      search?: string
      isActive?: boolean
      billingCycle?: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM'
      minAmount?: number
      maxAmount?: number
    }): Promise<ApiResponse<ExternalSubscriptionsResponse>> => {
      try {
        const queryParams = new URLSearchParams()
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              queryParams.append(key, String(value))
            }
          })
        }
        const query = queryParams.toString()
        const response = await fetchWithAuth(`/api/admin/external-subscriptions?${query}`)
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },
  },

  /**
   * Logs systèmes et audit
   */
  logs: {
    /**
     * Récupère les logs systèmes avec filtres et pagination
     */
    getAll: async (params?: {
      page?: number
      limit?: number
      scopes?: LogScope[]
      levels?: LogLevel[]
      action?: string
      dateFrom?: string
      dateTo?: string
      actorType?: 'USER' | 'ADMIN'
      searchId?: string
    }): Promise<ApiResponse<LogsResponse>> => {
      try {
        const queryParams = new URLSearchParams()
        if (params) {
          Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              if (Array.isArray(value)) {
                value.forEach((v) => queryParams.append(key, String(v)))
              } else {
                queryParams.append(key, String(value))
              }
            }
          })
        }
        const query = queryParams.toString()
        const response = await fetchWithAuth(`/api/admin/logs?${query}`)
        const result = await response.json()

        if (!response.ok) {
          return {
            success: false,
            message: result.message || result.error || `Erreur ${response.status}: ${response.statusText}`,
            error: result.error,
          }
        }
        return result
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Une erreur est survenue'
        return {
          success: false,
          message: errorMessage,
        }
      }
    },
  }
}
