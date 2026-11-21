import Foundation
import UIKit

/// Réponse du serveur : la même forme que le schéma JSON défini dans server/api/analyze.ts.
struct AnalysisResult: Decodable {
    struct Aliment: Decodable {
        let nom: String
        let grammes: Double
        let kcal: Double
        let proteines: Double
        let glucides: Double
        let lipides: Double
    }
    let plat: String
    let aliments: [Aliment]
    let confiance: String
    let remarque: String
}

enum AnalyzeError: LocalizedError {
    case notConfigured
    case server(String)
    case offline
    case unreadable

    var errorDescription: String? {
        switch self {
        case .notConfigured: "Renseignez l'adresse du serveur et le jeton dans Config.swift."
        case .server(let message): message
        case .offline: "Pas de connexion. Vérifiez le réseau et réessayez."
        case .unreadable: "Réponse du serveur illisible. Réessayez."
        }
    }
}

enum NutritionAPI {
    private struct Body: Encodable {
        let image: String?
        let mediaType: String
        let note: String
    }
    private struct ErrorBody: Decodable { let error: String }

    static func analyze(jpeg: Data?, note: String) async throws -> AnalysisResult {
        guard Config.appToken != "REMPLACEZ-MOI",
              let url = URL(string: Config.serverURL + "/api/analyze") else {
            throw AnalyzeError.notConfigured
        }
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.timeoutInterval = 120
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(Config.appToken)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONEncoder().encode(
            Body(image: jpeg?.base64EncodedString(), mediaType: "image/jpeg", note: note)
        )

        let data: Data
        let response: URLResponse
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch is CancellationError {
            throw CancellationError()
        } catch let error as URLError where error.code == .cancelled {
            throw CancellationError()
        } catch {
            throw AnalyzeError.offline
        }

        let status = (response as? HTTPURLResponse)?.statusCode ?? 0
        guard status == 200 else {
            let message = (try? JSONDecoder().decode(ErrorBody.self, from: data))?.error
            throw AnalyzeError.server(message ?? "Erreur du serveur (\(status)).")
        }
        guard let result = try? JSONDecoder().decode(AnalysisResult.self, from: data) else {
            throw AnalyzeError.unreadable
        }
        return result
    }
}

extension UIImage {
    /// Réduit l'image pour que son plus grand côté fasse au plus `maxSide` points.
    func resized(maxSide: CGFloat) -> UIImage {
        let scale = min(1, maxSide / max(size.width, size.height))
        let target = CGSize(width: (size.width * scale).rounded(), height: (size.height * scale).rounded())
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        return UIGraphicsImageRenderer(size: target, format: format).image { _ in
            draw(in: CGRect(origin: .zero, size: target))
        }
    }

    /// Vignette carrée, recadrée au centre.
    func squareThumbnail(side: CGFloat) -> UIImage {
        let m = min(size.width, size.height)
        let scale = side / m
        let drawSize = CGSize(width: size.width * scale, height: size.height * scale)
        let origin = CGPoint(x: (side - drawSize.width) / 2, y: (side - drawSize.height) / 2)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        return UIGraphicsImageRenderer(size: CGSize(width: side, height: side), format: format).image { _ in
            draw(in: CGRect(origin: origin, size: drawSize))
        }
    }
}
