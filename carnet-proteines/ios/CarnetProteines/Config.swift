import Foundation

/// Réglages de connexion au serveur.
/// Remplacez les deux valeurs après avoir déployé le dossier `server` sur Vercel.
enum Config {
    /// Adresse de votre serveur Vercel, sans « / » final.
    static let serverURL = "https://VOTRE-PROJET.vercel.app"
    /// Même valeur que la variable APP_TOKEN réglée sur Vercel.
    /// Ce n'est PAS la clé Claude : la clé Claude reste uniquement sur le serveur.
    static let appToken = "REMPLACEZ-MOI"
}
