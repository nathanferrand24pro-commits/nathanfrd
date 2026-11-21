import SwiftUI
import SwiftData

@main
struct CarnetProteinesApp: App {
    @State private var profileStore = ProfileStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(profileStore)
                .tint(Theme.protein)
        }
        .modelContainer(for: Meal.self)
    }
}
