"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { adminApi } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

/**
 * Schéma de validation pour le formulaire de connexion
 */
const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

type LoginFormData = z.infer<typeof loginSchema>

/**
 * Page de connexion pour les administrateurs
 */
export default function LoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, user, _hasHydrated } = useAuthStore()
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Rediriger vers le dashboard si déjà connecté
  useEffect(() => {
    if (_hasHydrated && isAuthenticated && user && user.role === "ADMIN") {
      router.push("/")
    }
  }, [_hasHydrated, isAuthenticated, user, router])

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      const response = await adminApi.auth.login(data.email, data.password)

      if (response.success && response.data) {
        // Connexion réussie : sauvegarder les données
        login(response.data.user, response.data.token)
        
        // Attendre un peu pour que le store soit mis à jour avant la redirection
        await new Promise(resolve => setTimeout(resolve, 100))
        
        // Rediriger vers le dashboard
        router.push("/")
        router.refresh() // Forcer le rafraîchissement pour s'assurer que le layout se met à jour
      } else {
        // Afficher le message d'erreur spécifique du serveur
        const errorMessage = response.message || response.error || "Erreur de connexion"
        setError(errorMessage)
        console.error("Login error:", response)
      }
    } catch (err) {
      // Gérer les erreurs inattendues
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue. Veuillez réessayer."
      setError(errorMessage)
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Connexion Admin</CardTitle>
          <CardDescription>Connectez-vous à votre compte administrateur</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@budgix.com"
                {...register("email")}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register("password")}
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

