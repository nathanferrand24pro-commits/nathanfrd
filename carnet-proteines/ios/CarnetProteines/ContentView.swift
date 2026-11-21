import SwiftUI

struct ContentView: View {
    @Environment(ProfileStore.self) private var store

    var body: some View {
        if store.profile == nil {
            // Premier lancement : on remplit le profil une seule fois.
            NavigationStack { ProfileView(isOnboarding: true) }
        } else {
            TabView {
                TodayView()
                    .tabItem { Label("Aujourd'hui", systemImage: "fork.knife") }
                HistoryView()
                    .tabItem { Label("Historique", systemImage: "chart.bar.fill") }
                NavigationStack { ProfileView(isOnboarding: false) }
                    .tabItem { Label("Profil", systemImage: "person.fill") }
            }
        }
    }
}
