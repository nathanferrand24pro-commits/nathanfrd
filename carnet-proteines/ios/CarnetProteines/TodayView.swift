import SwiftUI
import SwiftData

struct TodayView: View {
    @Environment(ProfileStore.self) private var store
    @Environment(\.modelContext) private var context
    @Query(sort: \Meal.date) private var meals: [Meal]

    @State private var day = Calendar.current.startOfDay(for: .now)
    @State private var showAdd = false

    private var dayMeals: [Meal] {
        meals.filter { Calendar.current.isDate($0.date, inSameDayAs: day) }
    }
    private var isToday: Bool { Calendar.current.isDateInToday(day) }

    var body: some View {
        let totals = Totals(meals: dayMeals)
        let goal = store.targets

        NavigationStack {
            List {
                Section {
                    ProteinCard(eaten: totals.protein, goal: goal.protein,
                                weightKg: store.profile?.weightKg)
                        .listRowInsets(EdgeInsets())
                        .listRowBackground(Color.clear)
                }
                Section {
                    HStack(spacing: 12) {
                        MacroGauge(title: "Calories", unit: "", value: totals.kcal, goal: goal.kcal, color: .primary)
                        MacroGauge(title: "Glucides", unit: " g", value: totals.carbs, goal: goal.carbs, color: Theme.carbs)
                        MacroGauge(title: "Lipides", unit: " g", value: totals.fat, goal: goal.fat, color: Theme.fat)
                    }
                    .padding(.vertical, 4)
                }
                Section("Repas") {
                    if dayMeals.isEmpty {
                        Button { showAdd = true } label: {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("Aucun repas enregistré").font(.headline)
                                Text("Photographiez votre assiette pour estimer calories et macros.")
                                    .font(.subheadline).foregroundStyle(.secondary)
                            }
                            .padding(.vertical, 6)
                        }
                        .buttonStyle(.plain)
                    } else {
                        ForEach(dayMeals) { MealRow(meal: $0) }
                            .onDelete { offsets in
                                for i in offsets { context.delete(dayMeals[i]) }
                            }
                    }
                }
            }
            .navigationTitle(dayTitle)
            .toolbar {
                ToolbarItemGroup(placement: .topBarLeading) {
                    Button { shiftDay(-1) } label: { Image(systemName: "chevron.left") }
                        .accessibilityLabel("Jour précédent")
                    Button { shiftDay(1) } label: { Image(systemName: "chevron.right") }
                        .accessibilityLabel("Jour suivant")
                        .disabled(isToday)
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { showAdd = true } label: {
                        Label("Ajouter un repas", systemImage: "camera.fill")
                    }
                }
            }
            .sheet(isPresented: $showAdd) { AddMealView(day: day) }
        }
    }

    private var dayTitle: String {
        if isToday { return "Aujourd'hui" }
        if Calendar.current.isDateInYesterday(day) { return "Hier" }
        return day.formatted(.dateTime.weekday(.wide).day().month(.wide)).capitalized
    }

    private func shiftDay(_ n: Int) {
        if let d = Calendar.current.date(byAdding: .day, value: n, to: day), d <= .now {
            day = Calendar.current.startOfDay(for: d)
        }
    }
}

struct ProteinCard: View {
    let eaten: Double
    let goal: Double
    let weightKg: Double?

    var body: some View {
        let left = goal - eaten.rounded()
        VStack(alignment: .leading, spacing: 12) {
            Text("PROTÉINES").font(.caption.weight(.bold)).tracking(1.2)
            HStack(alignment: .firstTextBaseline, spacing: 6) {
                Text(eaten.rounded0).font(.system(size: 64, weight: .bold, design: .rounded))
                Text("/ \(goal.rounded0) g").font(.title3.weight(.medium)).opacity(0.85)
            }
            .monospacedDigit()
            ProgressView(value: min(eaten, goal), total: max(goal, 1))
                .tint(.white)
                .scaleEffect(x: 1, y: 2.5, anchor: .center)
            HStack {
                Text(left > 0 ? "Reste \(left.rounded0) g" : "Objectif atteint")
                Spacer()
                if let w = weightKg, w > 0 {
                    Text(String(format: "%.1f g/kg", eaten / w))
                }
            }
            .font(.subheadline.weight(.medium))
        }
        .foregroundStyle(.white)
        .padding(20)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.protein, in: RoundedRectangle(cornerRadius: 20))
    }
}

struct MacroGauge: View {
    let title: String
    let unit: String
    let value: Double
    let goal: Double
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title.uppercased()).font(.caption2.weight(.bold)).foregroundStyle(color)
            Text(value.rounded0).font(.title3.weight(.bold)).monospacedDigit()
            + Text(" / \(goal.rounded0)\(unit)").font(.caption).foregroundColor(.secondary)
            ProgressView(value: min(value, goal), total: max(goal, 1)).tint(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

struct MealRow: View {
    let meal: Meal

    var body: some View {
        HStack(spacing: 12) {
            Group {
                if let data = meal.thumbnail, let img = UIImage(data: data) {
                    Image(uiImage: img).resizable().scaledToFill()
                } else {
                    Image(systemName: "fork.knife").foregroundStyle(.secondary)
                }
            }
            .frame(width: 52, height: 52)
            .background(Color(.secondarySystemFill))
            .clipShape(RoundedRectangle(cornerRadius: 10))

            VStack(alignment: .leading, spacing: 2) {
                Text(meal.name).font(.body.weight(.semibold)).lineLimit(2)
                (Text("\(meal.protein.rounded0) g prot.").foregroundColor(Theme.protein).bold()
                 + Text("  ·  \(meal.kcal.rounded0) kcal  ·  G \(meal.carbs.rounded0)  ·  L \(meal.fat.rounded0)")
                    .foregroundColor(.secondary))
                    .font(.footnote)
                    .monospacedDigit()
            }
        }
    }
}
