import SwiftUI
import SwiftData
import Charts

struct HistoryView: View {
    @Environment(ProfileStore.self) private var store
    @Query(sort: \Meal.date, order: .reverse) private var meals: [Meal]

    private struct DayPoint: Identifiable {
        let day: Date
        let protein: Double
        let kcal: Double
        let count: Int
        var id: Date { day }
    }

    private var days: [DayPoint] {
        let cal = Calendar.current
        let today = cal.startOfDay(for: .now)
        return (0..<7).reversed().compactMap { offset in
            guard let d = cal.date(byAdding: .day, value: -offset, to: today) else { return nil }
            let list = meals.filter { cal.isDate($0.date, inSameDayAs: d) }
            let t = Totals(meals: list)
            return DayPoint(day: d, protein: t.protein, kcal: t.kcal, count: list.count)
        }
    }

    var body: some View {
        let goal = store.targets.protein
        let points = days
        let logged = points.filter { $0.count > 0 }
        let avgP = logged.isEmpty ? 0 : logged.map(\.protein).reduce(0, +) / Double(logged.count)
        let avgK = logged.isEmpty ? 0 : logged.map(\.kcal).reduce(0, +) / Double(logged.count)
        let hits = logged.filter { $0.protein >= goal }.count

        NavigationStack {
            List {
                Section("Protéines par jour (g)") {
                    Chart {
                        ForEach(points) { p in
                            BarMark(x: .value("Jour", p.day, unit: .day),
                                    y: .value("Protéines", p.protein))
                                .foregroundStyle(p.protein >= goal ? Theme.protein : Theme.protein.opacity(0.35))
                                .cornerRadius(5)
                        }
                        RuleMark(y: .value("Objectif", goal))
                            .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [5, 4]))
                            .foregroundStyle(.secondary)
                            .annotation(position: .top, alignment: .trailing) {
                                Text("Objectif \(goal.rounded0) g").font(.caption2).foregroundStyle(.secondary)
                            }
                    }
                    .chartXAxis {
                        AxisMarks(values: .stride(by: .day)) {
                            AxisValueLabel(format: .dateTime.weekday(.abbreviated))
                        }
                    }
                    .frame(height: 200)
                    .padding(.vertical, 8)
                }

                Section("Moyenne des jours suivis") {
                    LabeledContent("Protéines", value: logged.isEmpty ? "–" : "\(avgP.rounded0) g")
                    LabeledContent("Calories", value: logged.isEmpty ? "–" : "\(avgK.rounded0) kcal")
                    LabeledContent("Objectif protéines atteint", value: "\(hits) / \(logged.count) jours")
                }

                Section("Repas des 7 derniers jours") {
                    let start = points.first?.day ?? .now
                    let recent = meals.filter { $0.date >= start }
                    if recent.isEmpty {
                        Text("Vos repas apparaîtront ici.").foregroundStyle(.secondary)
                    } else {
                        ForEach(recent) { meal in
                            VStack(alignment: .leading, spacing: 4) {
                                Text(meal.date.formatted(.dateTime.weekday(.wide).day().hour().minute()))
                                    .font(.caption).foregroundStyle(.secondary)
                                MealRow(meal: meal)
                            }
                        }
                    }
                }
            }
            .navigationTitle("Historique")
        }
    }
}
