"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

/**
 * Schéma de validation pour le formulaire d'envoi de notification
 */
const notificationSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(100, "Le titre est trop long"),
  body: z.string().min(1, "Le message est requis").max(500, "Le message est trop long"),
  dataType: z.string().optional(),
  dataPriority: z.string().optional(),
})

type NotificationFormData = z.infer<typeof notificationSchema>

interface SendNotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  userName: string
  onSuccess?: () => void
}

/**
 * Composant Dialog pour envoyer une notification à un utilisateur
 */
export function SendNotificationDialog({
  open,
  onOpenChange,
  userId,
  userName,
  onSuccess,
}: SendNotificationDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
      dataType: "admin_notification",
      dataPriority: "high",
    },
  })

  const onSubmit = async (data: NotificationFormData) => {
    setError(null)
    setIsLoading(true)

    try {
      // Import dynamique pour éviter les erreurs de circular dependency
      const { adminApi } = await import("@/lib/api")

      const notificationData: {
        title: string
        body: string
        data?: Record<string, any>
      } = {
        title: data.title,
        body: data.body,
      }

      // Ajouter les données optionnelles si fournies
      if (data.dataType || data.dataPriority) {
        notificationData.data = {}
        if (data.dataType) notificationData.data.type = data.dataType
        if (data.dataPriority) notificationData.data.priority = data.dataPriority
      }

      const response = await adminApi.users.sendNotification(userId, notificationData)

      if (response.success && response.data) {
        reset()
        onOpenChange(false)
        if (onSuccess) {
          onSuccess()
        }
        // Afficher un message de succès
        alert(
          `Notification envoyée avec succès à ${userName}.\n${response.data.tokensCount} appareil(s) notifié(s).`
        )
      } else {
        setError(response.message || response.error || "Erreur lors de l'envoi de la notification")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue"
      setError(errorMessage)
      console.error("Send notification error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = () => {
    reset()
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Envoyer une notification</DialogTitle>
          <DialogDescription>
            Envoyer une notification push à <strong>{userName}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titre *</Label>
            <Input
              id="title"
              placeholder="Ex: Notification importante"
              {...register("title")}
              disabled={isLoading}
              maxLength={100}
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Message *</Label>
            <Textarea
              id="body"
              placeholder="Ex: Ceci est un message de notification depuis l'admin"
              {...register("body")}
              disabled={isLoading}
              rows={4}
              maxLength={500}
            />
            {errors.body && (
              <p className="text-sm text-destructive">{errors.body.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="dataType">Type de données (optionnel)</Label>
              <Input
                id="dataType"
                placeholder="admin_notification"
                {...register("dataType")}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataPriority">Priorité (optionnel)</Label>
              <Input
                id="dataPriority"
                placeholder="high"
                {...register("dataPriority")}
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Envoi..." : "Envoyer la notification"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

