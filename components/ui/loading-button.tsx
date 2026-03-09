import * as React from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  isLoading?: boolean
  loadingText?: string
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ className, variant = "default", size = "default", isLoading = false, loadingText, children, disabled, ...props }, ref) => {

    // Fonction pour obtenir le texte de chargement
    const getLoadingText = () => {
      if (loadingText) return loadingText;

      if (typeof children === 'string') {
        const patterns: Record<string, string> = {
          'Créer': 'Création...',
          'Enregistrer': 'Enregistrement...',
          'Supprimer': 'Suppression...',
          'Modifier': 'Modification...',
          'Approuver': 'Approbation...',
          'Rejeter': 'Rejet...',
          'Envoyer': 'Envoi...',
          'Rafraîchir': 'Rafraîchissement...',
          'Charger': 'Chargement...',
          'Confirmer le rejet': 'Rejet en cours...',
          'Envoyer la notification': 'Envoi en cours...',
          'Fermer la discussion': 'Fermeture...',
        };

        return patterns[children] || `${children}...`;
      }

      return 'Chargement...';
    };

    // Déterminer si c'est un bouton icon-only (pas de texte)
    const isIconOnly = size === "icon" || (React.isValidElement(children) && !loadingText);

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-primary text-primary-foreground hover:bg-primary/90": variant === "default",
            "bg-destructive text-destructive-foreground hover:bg-destructive/90": variant === "destructive",
            "border border-input bg-background hover:bg-accent hover:text-accent-foreground": variant === "outline",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80": variant === "secondary",
            "hover:bg-accent hover:text-accent-foreground": variant === "ghost",
            "text-primary underline-offset-4 hover:underline": variant === "link",
          },
          {
            "h-10 px-4 py-2": size === "default",
            "h-9 rounded-md px-3": size === "sm",
            "h-11 rounded-md px-8": size === "lg",
            "h-11 w-11": size === "icon",
          },
          className
        )}
        disabled={isLoading || disabled}
        aria-busy={isLoading}
        aria-disabled={isLoading || disabled}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className={cn(
              "animate-spin",
              isIconOnly ? "h-4 w-4" : "mr-2 h-4 w-4"
            )} />
            {!isIconOnly && getLoadingText()}
          </>
        ) : (
          children
        )}
      </button>
    )
  }
)
LoadingButton.displayName = "LoadingButton"

export { LoadingButton }
