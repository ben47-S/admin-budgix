"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useMutation } from "@tanstack/react-query"
import { adminApi } from "@/lib/api"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LoadingButton } from "@/components/ui/loading-button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * Schéma de validation pour le formulaire d'envoi de notification
 */
const notificationSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(100, "Le titre est trop long"),
  body: z.string().min(1, "Le message est requis").max(500, "Le message est trop long"),
})

type NotificationFormData = z.infer<typeof notificationSchema>

/**
 * Types de destinataires
 */
type RecipientType = "all" | "phone" | "email" | "premium" | "standard"

/**
 * Page de gestion des notifications
 * Permet d'envoyer des notifications avec sélection de destinataires
 */
export default function NotificationsPage() {
  const [recipientType, setRecipientType] = useState<RecipientType>("all")
  const [recipientValue, setRecipientValue] = useState("")
  const [phoneNumberLocal, setPhoneNumberLocal] = useState("")
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: "",
      body: "",
    },
  })

  // Handler pour synchroniser le numéro de téléphone local avec recipientValue
  const handlePhoneNumberChange = (localNumber: string) => {
    setPhoneNumberLocal(localNumber)
    setRecipientValue("+225" + localNumber)
  }

  // Handler pour changer le type de destinataire et réinitialiser les champs
  const handleRecipientTypeChange = (newType: RecipientType) => {
    setRecipientType(newType)
    setRecipientValue("")
    setPhoneNumberLocal("")
    setFormError(null)
  }

  const sendMutation = useMutation({
    mutationFn: async (data: {
      title: string
      body: string
      recipientType: RecipientType
      recipientValue?: string
    }) => {
      if (recipientType === "phone" || recipientType === "email") {
        // Récupérer l'utilisateur par email ou téléphone
        const usersResponse = await adminApi.users.getUsers({
          search: recipientValue,
          limit: 1,
        })

        if (!usersResponse.success || !usersResponse.data || usersResponse.data.users.length === 0) {
          throw new Error(
            recipientType === "phone"
              ? "Aucun utilisateur trouvé avec ce numéro de téléphone"
              : "Aucun utilisateur trouvé avec cet email"
          )
        }

        const user = usersResponse.data.users[0]
        const response = await adminApi.users.sendNotification(user.id, {
          title: data.title,
          body: data.body,
        })

        if (!response.success) {
          throw new Error(response.message || "Erreur lors de l'envoi")
        }

        return {
          success: true,
          tokensCount: response.data?.tokensCount || 0,
          message: `Notification envoyée à ${user.username}`,
        }
      } else if (recipientType === "all" || recipientType === "premium" || recipientType === "standard") {
        // Récupérer tous les utilisateurs selon le filtre
        const isPremium = recipientType === "premium" ? true : recipientType === "standard" ? false : undefined

        const usersResponse = await adminApi.users.getUsers({
          isPremium,
          limit: 1000, // Limite élevée pour récupérer tous les utilisateurs
        })

        if (!usersResponse.success || !usersResponse.data) {
          throw new Error("Erreur lors de la récupération des utilisateurs")
        }

        const users = usersResponse.data.users
        if (users.length === 0) {
          throw new Error("Aucun utilisateur trouvé")
        }

        // Envoyer à tous les utilisateurs
        let totalTokens = 0
        let successCount = 0
        const errors: string[] = []

        for (const user of users) {
          try {
            const response = await adminApi.users.sendNotification(user.id, {
              title: data.title,
              body: data.body,
            })

            if (response.success && response.data) {
              totalTokens += response.data.tokensCount
              successCount++
            } else {
              errors.push(`${user.username}: ${response.message || "Erreur"}`)
            }
          } catch (err) {
            errors.push(`${user.username}: ${err instanceof Error ? err.message : "Erreur"}`)
          }
        }

        return {
          success: true,
          tokensCount: totalTokens,
          message: `Notifications envoyées à ${successCount} utilisateur(s). ${totalTokens} appareil(s) notifié(s).`,
          errors: errors.length > 0 ? errors : undefined,
        }
      }

      throw new Error("Type de destinataire non valide")
    },
    onSuccess: (result) => {
      setSuccessMessage(result.message)
      setFormError(null)
      reset()
      setRecipientValue("")
      setPhoneNumberLocal("")
      // Effacer le message de succès après 5 secondes
      setTimeout(() => setSuccessMessage(null), 5000)
    },
    onError: (error: Error) => {
      setFormError(error.message)
      setSuccessMessage(null)
    },
  })

  const onSubmit = async (data: NotificationFormData) => {
    setFormError(null)
    setSuccessMessage(null)

    // Validation du destinataire selon le type
    if (recipientType === "phone" || recipientType === "email") {
      if (!recipientValue.trim()) {
        setFormError(
          recipientType === "phone"
            ? "Veuillez entrer un numéro de téléphone"
            : "Veuillez entrer un email"
        )
        return
      }
    }

    sendMutation.mutate({
      title: data.title,
      body: data.body,
      recipientType,
      recipientValue: recipientType === "phone" || recipientType === "email" ? recipientValue : undefined,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestion des Notifications</h1>
        <p className="text-muted-foreground">
          Envoyez des notifications push aux utilisateurs de la plateforme
        </p>
      </div>

      {/* Formulaire de notification */}
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle Notification</CardTitle>
          <CardDescription>Remplissez le formulaire et sélectionnez les destinataires</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Sélection du type de destinataire */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Destinataires</Label>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <button
                  type="button"
                  className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    recipientType === "all"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                  onClick={() => handleRecipientTypeChange("all")}
                >
                  <span className="text-sm font-medium">Tous les utilisateurs</span>
                </button>

                <button
                  type="button"
                  className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    recipientType === "premium"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                  onClick={() => handleRecipientTypeChange("premium")}
                >
                  <span className="text-sm font-medium">Utilisateurs Premium</span>
                </button>

                <button
                  type="button"
                  className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    recipientType === "standard"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                  onClick={() => handleRecipientTypeChange("standard")}
                >
                  <span className="text-sm font-medium">Utilisateurs Standard</span>
                </button>

                <button
                  type="button"
                  className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    recipientType === "email"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                  onClick={() => handleRecipientTypeChange("email")}
                >
                  <span className="text-sm font-medium">Par Email</span>
                </button>

                <button
                  type="button"
                  className={`flex items-center justify-center rounded-lg border-2 p-3 cursor-pointer transition-all ${
                    recipientType === "phone"
                      ? "border-primary bg-primary text-primary-foreground shadow-md"
                      : "border-border hover:border-primary/50 hover:bg-accent"
                  }`}
                  onClick={() => handleRecipientTypeChange("phone")}
                >
                  <span className="text-sm font-medium">Par Téléphone</span>
                </button>
              </div>

              {/* Champ pour email ou téléphone */}
              {recipientType === "email" && (
                <div className="space-y-2">
                  <Label htmlFor="recipient-value">Email de l'utilisateur</Label>
                  <Input
                    id="recipient-value"
                    type="email"
                    placeholder="exemple@budgix.com"
                    value={recipientValue}
                    onChange={(e) => setRecipientValue(e.target.value)}
                    disabled={sendMutation.isPending}
                  />
                </div>
              )}

              {recipientType === "phone" && (
                <div className="space-y-2">
                  <Label htmlFor="phone-number">Numéro de téléphone</Label>
                  <div className="flex gap-2">
                    {/* Préfixe +225 (non-éditable) */}
                    <Input
                      type="text"
                      value="+225"
                      disabled
                      className="w-20 text-center font-medium"
                      readOnly
                    />

                    {/* Partie éditable du numéro */}
                    <Input
                      id="phone-number"
                      type="tel"
                      placeholder="0123456789"
                      value={phoneNumberLocal}
                      onChange={(e) => handlePhoneNumberChange(e.target.value)}
                      disabled={sendMutation.isPending}
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Entrez le numéro sans le préfixe +225
                  </p>
                </div>
              )}
            </div>

            {/* Titre et contenu */}
            <div className="grid gap-4 md:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="title">Titre de la notification *</Label>
                <Input
                  id="title"
                  placeholder="Ex: Bienvenue sur Budgix !"
                  {...register("title")}
                  disabled={sendMutation.isPending}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Contenu de la notification *</Label>
                <Textarea
                  id="body"
                  placeholder="Ex: Merci de nous avoir rejoint. Découvrez toutes nos fonctionnalités premium pour mieux gérer vos finances."
                  {...register("body")}
                  disabled={sendMutation.isPending}
                  rows={6}
                  maxLength={500}
                />
                {errors.body && (
                  <p className="text-sm text-destructive">{errors.body.message}</p>
                )}
              </div>
            </div>

            {/* Messages d'erreur et de succès */}
            {formError && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {formError}
              </div>
            )}

            {successMessage && (
              <div className="rounded-md bg-green-500/10 p-3 text-sm text-green-600 dark:text-green-400">
                {successMessage}
              </div>
            )}

            {/* Bouton d'envoi */}
            <div className="flex justify-end">
              <LoadingButton type="submit" isLoading={sendMutation.isPending} size="lg">
                Envoyer la notification
              </LoadingButton>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

