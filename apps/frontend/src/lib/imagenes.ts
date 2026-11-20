// Achica una foto y la devuelve como data URL (JPEG). Sirve para guardarla en
// localStorage, que ronda los 5 MB por sitio: una foto de celular sin achicar
// lo llena con un par de avisos.
export async function fotoADataUrl(
  archivo: Blob,
  ladoMaximo = 1280,
  calidad = 0.7,
): Promise<string> {
  const bitmap = await createImageBitmap(archivo);
  const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * escala);
  canvas.height = Math.round(bitmap.height * escala);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', calidad);
}

// SHA-256 del archivo original (el mismo cálculo que hace el backend para el
// sello de evidencia). crypto.subtle solo existe en https o localhost.
export async function sha256DeArchivo(archivo: Blob): Promise<string | null> {
  if (!crypto?.subtle) return null;
  const digest = await crypto.subtle.digest('SHA-256', await archivo.arrayBuffer());
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
