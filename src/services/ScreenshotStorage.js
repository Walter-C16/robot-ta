/**
 * Clase base para servicios de almacenamiento de screenshots.
 *
 * En JavaScript no existen interfaces nativas como en Java,
 * por eso usamos esta clase como contrato conceptual.
 *
 * Cualquier storage concreto debe implementar el método save().
 *
 * Ejemplos de implementaciones posibles:
 * - LocalScreenshotStorage: guarda archivos en disco local.
 * - CloudScreenshotStorage: podría guardar archivos en S3, Cloudinary, Firebase, etc.
 */
class ScreenshotStorage {
  /**
   * Guarda una imagen y devuelve una URL pública.
   *
   * @param {Buffer} imageBuffer Imagen generada por Puppeteer.
   * @param {string} filename Nombre del archivo a guardar.
   * @returns {Promise<string>} URL pública de la imagen.
   */
  async save(imageBuffer, filename) {
    throw new Error("ScreenshotStorage.save() must be implemented");
  }
}

module.exports = ScreenshotStorage;
