import SwiftUI
import SwiftData
import PhotosUI

/// Un aliment en cours d'édition : on garde les valeurs estimées pour le poids d'origine
/// et on les recalcule quand l'utilisateur corrige les grammes.
struct DraftItem: Identifiable {
    let id = UUID()
    var name: String
    var baseGrams: Double
    var baseKcal: Double, baseProtein: Double, baseCarbs: Double, baseFat: Double
    var grams: Double

    private var factor: Double { baseGrams > 0 ? grams / baseGrams : 1 }
    var kcal: Double { baseKcal * factor }
    var protein: Double { baseProtein * factor }
    var carbs: Double { baseCarbs * factor }
    var fat: Double { baseFat * factor }

    var food: FoodItem {
        FoodItem(name: name, grams: grams, kcal: kcal, protein: protein, carbs: carbs, fat: fat)
    }
}

struct AddMealView: View {
    let day: Date

    @Environment(\.dismiss) private var dismiss
    @Environment(\.modelContext) private var context

    @State private var image: UIImage?
    @State private var pickerItem: PhotosPickerItem?
    @State private var showCamera = false
    @State private var note = ""
    @State private var mealName = ""
    @State private var items: [DraftItem] = []
    @State private var confidence = ""
    @State private var remark = ""
    @State private var errorText: String?
    @State private var task: Task<Void, Never>?
    @State private var showManual = false

    private var isLoading: Bool { task != nil }
    private var cameraAvailable: Bool { UIImagePickerController.isSourceTypeAvailable(.camera) }

    var body: some View {
        NavigationStack {
            Form {
                Section {
                    if let image {
                        Image(uiImage: image)
                            .resizable().scaledToFill()
                            .frame(maxWidth: .infinity).frame(height: 220)
                            .clipped()
                            .listRowInsets(EdgeInsets())
                    }
                    HStack {
                        if cameraAvailable {
                            Button { showCamera = true } label: {
                                Label("Photo", systemImage: "camera.fill").frame(maxWidth: .infinity)
                            }
                            .buttonStyle(.borderedProminent)
                        }
                        PhotosPicker(selection: $pickerItem, matching: .images) {
                            Label("Galerie", systemImage: "photo.on.rectangle").frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.bordered)
                    }
                    TextField("Précisions : 150 g de poulet, riz cuit…", text: $note, axis: .vertical)
                        .lineLimit(1...4)
                } footer: {
                    Text("Les précisions améliorent l'estimation, surtout pour les quantités et l'huile de cuisson.")
                }

                Section {
                    if isLoading {
                        HStack(spacing: 12) {
                            ProgressView()
                            VStack(alignment: .leading) {
                                Text("Analyse en cours…").bold()
                                Text("Comptez 10 à 40 secondes.").font(.footnote).foregroundStyle(.secondary)
                            }
                            Spacer()
                            Button("Arrêter") { task?.cancel(); task = nil }
                        }
                    } else {
                        Button(items.isEmpty ? "Estimer calories et macros" : "Relancer l'estimation") {
                            estimate()
                        }
                        .disabled(image == nil && note.trimmingCharacters(in: .whitespaces).isEmpty)
                    }
                    if let errorText {
                        Text(errorText).foregroundStyle(.red)
                    }
                }

                if !items.isEmpty {
                    Section {
                        TextField("Nom du repas", text: $mealName)
                        ForEach($items) { $item in
                            ItemRow(item: $item)
                        }
                        .onDelete { items.remove(atOffsets: $0) }
                    } header: {
                        HStack {
                            Text("Détail")
                            Spacer()
                            if !confidence.isEmpty { Text("Confiance \(confidence)") }
                        }
                    } footer: {
                        if !remark.isEmpty { Text(remark) }
                    }

                    Section {
                        let t = items.reduce(into: (k: 0.0, p: 0.0, c: 0.0, f: 0.0)) {
                            $0.k += $1.kcal; $0.p += $1.protein; $0.c += $1.carbs; $0.f += $1.fat
                        }
                        HStack {
                            Text("Total").bold()
                            Spacer()
                            Text("\(t.p.rounded0) g prot.").bold().foregroundStyle(Theme.protein)
                            Text("\(t.k.rounded0) kcal").bold()
                        }
                        .monospacedDigit()
                        Text("Glucides \(t.c.rounded0) g  ·  Lipides \(t.f.rounded0) g")
                            .font(.footnote).foregroundStyle(.secondary)
                    }
                }

                Section {
                    Button("Ajouter un aliment à la main") { showManual = true }
                } footer: {
                    Text("Les valeurs issues d'une photo sont des estimations. Corrigez les grammes si vous les connaissez.")
                }
            }
            .navigationTitle("Ajouter un repas")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Annuler") { task?.cancel(); dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Enregistrer") { save() }.disabled(items.isEmpty || isLoading)
                }
            }
            .fullScreenCover(isPresented: $showCamera) {
                CameraPicker { picked in setImage(picked) }.ignoresSafeArea()
            }
            .sheet(isPresented: $showManual) {
                ManualItemView { items.append($0) }
            }
            .onChange(of: pickerItem) { _, newItem in
                guard let newItem else { return }
                Task {
                    if let data = try? await newItem.loadTransferable(type: Data.self),
                       let img = UIImage(data: data) {
                        setImage(img)
                    }
                    pickerItem = nil
                }
            }
        }
    }

    private func setImage(_ img: UIImage) {
        image = img.resized(maxSide: 1280)
        estimate()
    }

    private func estimate() {
        task?.cancel()
        errorText = nil
        let jpeg = image?.jpegData(compressionQuality: 0.7)
        let text = note.trimmingCharacters(in: .whitespacesAndNewlines)
        task = Task {
            // Une analyse arrêtée ou remplacée ne touche plus à l'écran.
            defer { if !Task.isCancelled { task = nil } }
            do {
                let result = try await NutritionAPI.analyze(jpeg: jpeg, note: text)
                if Task.isCancelled { return }
                let parsed = result.aliments.map {
                    DraftItem(name: $0.nom, baseGrams: $0.grammes,
                              baseKcal: $0.kcal, baseProtein: $0.proteines,
                              baseCarbs: $0.glucides, baseFat: $0.lipides,
                              grams: $0.grammes)
                }
                if parsed.isEmpty {
                    errorText = result.remarque.isEmpty
                        ? "Aucun aliment reconnu. Essayez une photo plus nette ou ajoutez des précisions."
                        : result.remarque
                } else {
                    items = parsed
                    confidence = result.confiance
                    remark = result.remarque
                    if mealName.isEmpty { mealName = result.plat }
                }
            } catch is CancellationError {
                // Arrêt demandé : rien à afficher.
            } catch {
                if !Task.isCancelled { errorText = error.localizedDescription }
            }
        }
    }

    private func save() {
        let date: Date
        if Calendar.current.isDateInToday(day) {
            date = .now
        } else {
            date = Calendar.current.date(bySettingHour: 12, minute: 0, second: 0, of: day) ?? day
        }
        let thumb = image?.squareThumbnail(side: 160).jpegData(compressionQuality: 0.6)
        let name = mealName.trimmingCharacters(in: .whitespaces)
        let meal = Meal(date: date,
                        name: name.isEmpty ? (items.first?.name ?? "Repas") : name,
                        items: items.map(\.food),
                        thumbnail: thumb)
        context.insert(meal)
        dismiss()
    }
}

private struct ItemRow: View {
    @Binding var item: DraftItem

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(item.name).font(.body.weight(.semibold))
                Text("\(item.kcal.rounded0) kcal · P \(item.protein.rounded0) · G \(item.carbs.rounded0) · L \(item.fat.rounded0)")
                    .font(.footnote).foregroundStyle(.secondary).monospacedDigit()
            }
            Spacer()
            if item.baseGrams > 0 {
                TextField("g", value: $item.grams, format: .number.precision(.fractionLength(0)))
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.trailing)
                    .frame(width: 60)
                    .textFieldStyle(.roundedBorder)
                Text("g").foregroundStyle(.secondary)
            }
        }
    }
}

/// Saisie manuelle d'un aliment (étiquette d'un produit, par exemple).
private struct ManualItemView: View {
    var onAdd: (DraftItem) -> Void
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var kcal: Double?
    @State private var protein: Double?
    @State private var carbs: Double?
    @State private var fat: Double?

    var body: some View {
        NavigationStack {
            Form {
                TextField("Aliment (ex. : skyr nature)", text: $name)
                numberField("Calories (kcal)", $kcal)
                numberField("Protéines (g)", $protein)
                numberField("Glucides (g)", $carbs)
                numberField("Lipides (g)", $fat)
            }
            .navigationTitle("Aliment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Annuler") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Ajouter") {
                        let p = protein ?? 0, c = carbs ?? 0, f = fat ?? 0
                        let k = kcal ?? (p * 4 + c * 4 + f * 9)
                        onAdd(DraftItem(name: name, baseGrams: 0, baseKcal: k, baseProtein: p,
                                        baseCarbs: c, baseFat: f, grams: 0))
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespaces).isEmpty
                              || (kcal == nil && protein == nil && carbs == nil && fat == nil))
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func numberField(_ title: String, _ value: Binding<Double?>) -> some View {
        HStack {
            Text(title)
            Spacer()
            TextField("0", value: value, format: .number)
                .keyboardType(.decimalPad)
                .multilineTextAlignment(.trailing)
                .frame(width: 90)
        }
    }
}
