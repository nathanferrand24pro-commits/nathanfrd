import Foundation
import Security

/// Connexion au serveur Vercel.
/// L'adresse n'est pas secrète. Le jeton d'accès, lui, est saisi une fois dans l'app
/// (Profil → Serveur) et gardé dans le trousseau de l'iPhone : il n'est jamais écrit
/// dans ce dépôt, qui est public.
enum Config {
    static let defaultServerURL = "https://VOTRE-PROJET.vercel.app"

    private static let urlKey = "server.url"
    private static let tokenAccount = "app-token"

    static var serverURL: String {
        get { UserDefaults.standard.string(forKey: urlKey) ?? defaultServerURL }
        set { UserDefaults.standard.set(newValue.trimmingCharacters(in: .whitespacesAndNewlines), forKey: urlKey) }
    }

    static var appToken: String {
        get { Keychain.read(tokenAccount) ?? "" }
        set { Keychain.write(tokenAccount, newValue.trimmingCharacters(in: .whitespacesAndNewlines)) }
    }

    static var isConfigured: Bool {
        !appToken.isEmpty && !serverURL.contains("VOTRE-PROJET")
    }
}

/// Lecture et écriture minimales dans le trousseau iOS.
enum Keychain {
    private static let service = "CarnetProteines"

    static func read(_ account: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
              let data = item as? Data else { return nil }
        return String(data: data, encoding: .utf8)
    }

    static func write(_ account: String, _ value: String) {
        let base: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        SecItemDelete(base as CFDictionary)
        guard !value.isEmpty else { return }
        var add = base
        add[kSecValueData as String] = Data(value.utf8)
        add[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlock
        SecItemAdd(add as CFDictionary, nil)
    }
}
