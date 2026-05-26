import Foundation

enum APIClientError: LocalizedError {
    case invalidURL
    case httpStatus(Int, String)
    case decoding(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case let .httpStatus(code, body):
            return body.isEmpty ? "Request failed (\(code))" : body
        case let .decoding(error):
            return "Could not read server response: \(error.localizedDescription)"
        }
    }
}

/// Mirrors web `apiFetch` — attaches `X-User-Id` when set.
final class APIClient {
    static let shared = APIClient()

    private let baseURL: URL
    private let session: URLSession
    private let decoder: JSONDecoder

    var userId: String? {
        didSet { UserDefaults.standard.set(userId, forKey: AppConfig.demoUserIdKey) }
    }

    init(baseURL: URL = AppConfig.apiBaseURL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
        self.decoder = JSONDecoder()
        self.userId = UserDefaults.standard.string(forKey: AppConfig.demoUserIdKey)
    }

    func url(path: String) throws -> URL {
        let normalized = path.hasPrefix("/") ? String(path.dropFirst()) : path
        guard let url = URL(string: normalized, relativeTo: baseURL) else {
            throw APIClientError.invalidURL
        }
        return url
    }

    func request(
        path: String,
        method: String = "GET",
        body: Data? = nil,
        contentType: String? = nil
    ) async throws -> (Data, HTTPURLResponse) {
        let url = try url(path: path)
        var req = URLRequest(url: url)
        req.httpMethod = method
        if let userId, !userId.isEmpty {
            req.setValue(userId, forHTTPHeaderField: "X-User-Id")
        }
        if let contentType {
            req.setValue(contentType, forHTTPHeaderField: "Content-Type")
        }
        req.httpBody = body

        let (data, response) = try await session.data(for: req)
        guard let http = response as? HTTPURLResponse else {
            throw APIClientError.httpStatus(-1, "No HTTP response")
        }
        guard (200 ..< 300).contains(http.statusCode) else {
            let text = String(data: data, encoding: .utf8) ?? ""
            throw APIClientError.httpStatus(http.statusCode, text)
        }
        return (data, http)
    }

    func getJSON<T: Decodable>(_ type: T.Type, path: String) async throws -> T {
        let (data, _) = try await request(path: path)
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIClientError.decoding(error)
        }
    }

    func postJSON<T: Decodable>(_ type: T.Type, path: String) async throws -> T {
        let (data, _) = try await request(path: path, method: "POST")
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIClientError.decoding(error)
        }
    }
}
