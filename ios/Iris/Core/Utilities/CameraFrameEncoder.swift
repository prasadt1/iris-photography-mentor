import AVFoundation
import UIKit

enum CameraFrameEncoder {
    /// JPEG from a video sample buffer (rear camera, portrait orientation).
    static func jpeg(from sampleBuffer: CMSampleBuffer, quality: CGFloat = 0.55, maxEdge: CGFloat = 640) -> Data? {
        guard let pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer) else { return nil }
        let ciImage = CIImage(cvPixelBuffer: pixelBuffer)
        let context = CIContext(options: nil)
        guard let cgImage = context.createCGImage(ciImage, from: ciImage.extent) else { return nil }
        let image = UIImage(cgImage: cgImage, scale: 1, orientation: .right)
        let data = ImageUploadPrep.jpegForUpload(
            from: image.jpegData(compressionQuality: 1) ?? Data(),
            maxEdge: maxEdge,
            quality: quality
        )
        return data
    }
}
