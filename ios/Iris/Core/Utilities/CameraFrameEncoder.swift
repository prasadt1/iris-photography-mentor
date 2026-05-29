import AVFoundation
import UIKit

enum CameraFrameEncoder {
    private static let ciContext = CIContext(options: [.useSoftwareRenderer: false])

    /// JPEG from a retained pixel buffer (call off the camera session queue).
    static func jpeg(from pixelBuffer: CVPixelBuffer, quality: CGFloat = 0.55, maxEdge: CGFloat = 640) -> Data? {
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        guard let cgImage = ciContext.createCGImage(ciImage, from: ciImage.extent) else { return nil }
        let image = UIImage(cgImage: cgImage, scale: 1, orientation: .right)
        guard let raw = image.jpegData(compressionQuality: 1) else { return nil }
        return ImageUploadPrep.jpegForUpload(from: raw, maxEdge: maxEdge, quality: quality)
    }

    static func jpeg(from sampleBuffer: CMSampleBuffer, quality: CGFloat = 0.55, maxEdge: CGFloat = 640) -> Data? {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return nil }
        return jpeg(from: pixelBuffer, quality: quality, maxEdge: maxEdge)
    }
}
