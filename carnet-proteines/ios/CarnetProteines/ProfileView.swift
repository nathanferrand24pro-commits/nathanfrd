import SwiftUI

struct ProfileView: View {
    let isOnboarding: Bool
    @Environment(ProfileStore.self) private var store
    @State private var draft = Profile()
    @State private var useCustomKcal = false
    @State private var customKcal = 2500
    @State private var saved = false

    var body: some View {
        let t = editedProfile.targets

        Form {
            if isOnboarding {
                Section {
                    Text("Renseignez votre profil une fois pour calculer vos besoins quotidiens en calories et en protéines.")
                        .foregroundStyle(.secondary)
                }
            }

            Section("Vous") {
                Picker("Sexe", selection: $draft.sex) {
                    ForEach(Sex.allCases) { Text($0.label).tag($0) }
                }
                .pickerStyle(.segmented)
                Stepper("Âge : \(draft.age) ans", value: $draft.age, in: 14...99)
                Stepper("Taille : \(Int(draft.heightCm)) cm", value: $draft.heightCm, in: 120...230, step: 1)
                Stepper(String(format: "Poids : %.1f kg", draft.weightKg), value: $draft.weightKg, in: 35...250, step: 0.5)
                Picker("Activité", selection: $draft.activity) {
                    ForEach(ActivityLevel.all) { Text($0.label).tag($0.factor) }
                }
            }

            Section("Objectif") {
                // Changer d'objectif propose l'apport en protéines conseillé pour cet objectif.
                Picker("Objectif", selection: Binding(
                    get: { draft.goal },
                    set: { draft.goal = $0; draft.proteinPerKg = $0.defaultProteinPerKg }
                )) {
                    ForEach(Goal.allCases) { Text($0.label).tag($0) }
                }
                .pickerStyle(.segmented)

                VStack(alignment: .leading) {
                    Text(String(format: "Protéines : %.1f g par kg", draft.proteinPerKg))
                    Slider(value: $draft.proteinPerKg, in: 1.0...2.6, step: 0.1)
                }
                Toggle("Imposer mes calories", isOn: $useCustomKcal)
                if useCustomKcal {
                    Stepper("\(customKcal) kcal par jour", value: $customKcal, in: 1200...6000, step: 50)
                }
            }

            Section {
                Grid(horizontalSpacing: 12, verticalSpacing: 4) {
                    GridRow {
                        target(t.kcal.rounded0, "kcal", .primary)
                        target("\(t.protein.rounded0) g", "protéines", Theme.protein)
                        target("\(t.carbs.rounded0) g", "glucides", Theme.carbs)
                        target("\(t.fat.rounded0) g", "lipides", Theme.fat)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 4)
            } header: {
                Text("Objectifs quotidiens")
            } footer: {
                Text("Métabolisme de base (Mifflin-St Jeor) × activité, −15 % pour une perte ou +10 % pour la prise de muscle. Lipides à 1 g/kg, le reste en glucides.")
            }

            Section {
                Button(isOnboarding ? "Commencer" : (saved ? "Profil enregistré" : "Enregistrer")) {
                    store.profile = editedProfile
                    saved = true
                }
                .frame(maxWidth: .infinity)
                .bold()
            }
        }
        .navigationTitle(isOnboarding ? "Bienvenue" : "Mon profil")
        .onAppear(perform: load)
        .onChange(of: editedProfile) { _, _ in saved = false }
    }

    private var editedProfile: Profile {
        var p = draft
        p.customKcal = useCustomKcal ? customKcal : nil
        return p
    }

    private func load() {
        guard let p = store.profile else { return }
        draft = p
        useCustomKcal = p.customKcal != nil
        customKcal = p.customKcal ?? Int(p.targets.kcal)
        saved = true
    }

    private func target(_ value: String, _ label: String, _ color: Color) -> some View {
        VStack(spacing: 2) {
            Text(value).font(.headline).foregroundStyle(color).monospacedDigit()
            Text(label).font(.caption2).foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}
