import Foundation
import Observation

enum Sex: String, Codable, CaseIterable, Identifiable {
    case male, female
    var id: String { rawValue }
    var label: String { self == .male ? "Homme" : "Femme" }
}

enum Goal: String, Codable, CaseIterable, Identifiable {
    case cut, keep, gain
    var id: String { rawValue }
    var label: String {
        switch self { case .cut: "Perte"; case .keep: "Maintien"; case .gain: "Muscle" }
    }
    /// Apport en protéines conseillé par défaut, en g par kg.
    var defaultProteinPerKg: Double {
        switch self { case .cut: 2.0; case .keep: 1.6; case .gain: 1.8 }
    }
    var calorieFactor: Double {
        switch self { case .cut: 0.85; case .keep: 1.0; case .gain: 1.10 }
    }
}

struct ActivityLevel: Identifiable, Hashable {
    let factor: Double
    let label: String
    var id: Double { factor }

    static let all = [
        ActivityLevel(factor: 1.2, label: "Sédentaire"),
        ActivityLevel(factor: 1.375, label: "Léger (1 à 3 séances/sem.)"),
        ActivityLevel(factor: 1.55, label: "Modéré (3 à 5 séances/sem.)"),
        ActivityLevel(factor: 1.725, label: "Intense (6 séances ou plus)"),
    ]
}

struct Targets {
    var kcal: Double, protein: Double, carbs: Double, fat: Double
}

struct Profile: Codable, Equatable {
    var sex: Sex = .male
    var age: Int = 30
    var heightCm: Double = 178
    var weightKg: Double = 75
    var activity: Double = 1.55
    var goal: Goal = .keep
    var proteinPerKg: Double = 1.6
    /// Calories imposées par l'utilisateur ; nil = calcul automatique.
    var customKcal: Int? = nil

    /// Mifflin-St Jeor × activité, ajusté selon l'objectif.
    /// Lipides à 1 g/kg, le reste des calories en glucides.
    var targets: Targets {
        let bmr = 10 * weightKg + 6.25 * heightCm - 5 * Double(age) + (sex == .male ? 5 : -161)
        let auto = (bmr * activity * goal.calorieFactor / 10).rounded() * 10
        let kcal = customKcal.map(Double.init) ?? auto
        let protein = (weightKg * proteinPerKg).rounded()
        let fat = weightKg.rounded()
        let carbs = max(0, ((kcal - protein * 4 - fat * 9) / 4).rounded())
        return Targets(kcal: kcal, protein: protein, carbs: carbs, fat: fat)
    }
}

/// Garde le profil dans les réglages de l'iPhone (UserDefaults).
@Observable
final class ProfileStore {
    private static let key = "profile.v1"

    var profile: Profile? {
        didSet {
            if let profile, let data = try? JSONEncoder().encode(profile) {
                UserDefaults.standard.set(data, forKey: Self.key)
            }
        }
    }

    var targets: Targets { (profile ?? Profile()).targets }

    init() {
        if let data = UserDefaults.standard.data(forKey: Self.key) {
            profile = try? JSONDecoder().decode(Profile.self, from: data)
        }
    }
}
