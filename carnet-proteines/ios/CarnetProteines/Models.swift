import Foundation
import SwiftData

/// Un aliment d'un repas enregistré (valeurs finales, après correction des grammes).
struct FoodItem: Codable, Hashable, Identifiable {
    var id = UUID()
    var name: String
    var grams: Double
    var kcal: Double
    var protein: Double
    var carbs: Double
    var fat: Double
}

@Model
final class Meal {
    var id: UUID
    var date: Date
    var name: String
    var kcal: Double
    var protein: Double
    var carbs: Double
    var fat: Double
    @Attribute(.externalStorage) var thumbnail: Data?
    var itemsData: Data

    init(date: Date, name: String, items: [FoodItem], thumbnail: Data?) {
        self.id = UUID()
        self.date = date
        self.name = name
        self.kcal = items.reduce(0) { $0 + $1.kcal }
        self.protein = items.reduce(0) { $0 + $1.protein }
        self.carbs = items.reduce(0) { $0 + $1.carbs }
        self.fat = items.reduce(0) { $0 + $1.fat }
        self.thumbnail = thumbnail
        self.itemsData = (try? JSONEncoder().encode(items)) ?? Data()
    }

    var items: [FoodItem] {
        (try? JSONDecoder().decode([FoodItem].self, from: itemsData)) ?? []
    }
}

/// Totaux d'une liste de repas.
struct Totals {
    var kcal = 0.0, protein = 0.0, carbs = 0.0, fat = 0.0

    init(meals: [Meal]) {
        for m in meals {
            kcal += m.kcal; protein += m.protein; carbs += m.carbs; fat += m.fat
        }
    }
}
