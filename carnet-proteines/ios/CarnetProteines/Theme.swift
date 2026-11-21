import SwiftUI

enum Theme {
    static let protein = Color(red: 0.72, green: 0.15, blue: 0.29)
    static let carbs = Color(red: 0.80, green: 0.53, blue: 0.05)
    static let fat = Color(red: 0.20, green: 0.45, blue: 0.75)
}

extension Double {
    /// Valeur arrondie pour l'affichage : 46,4 → « 46 ».
    var rounded0: String { String(Int(self.rounded())) }
}
