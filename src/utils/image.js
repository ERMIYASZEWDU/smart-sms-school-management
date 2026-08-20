// Shared client-side photo helpers: validate an image file and downscale
// large photos before upload so phone camera photos never hit the 5MB
// upload limit. Downscaled photos are capped at 1024px on the longest edge.

export const MAX_PHOTO_BYTES = 5 * 1024 * 1024 // 5MB
export const MAX_PHOTO_EDGE = 1024

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

export const isHeicFile = (file) =>
  file.type === 'image/heic' || file.type === 'image/heif' || /\.(heic|heif)$/i.test(file.name)

// Convert a File (e.g. a downscaled photo) to a base64 data URL string so it
// can be sent as a plain JSON string field (the backend stores photo as a string).
export const fileToDataUrl = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(file)
  })
}

// Validate type/size and downscale if needed. Returns a Promise<File>.
// Rejects with an Error whose .message is user-friendly for the type check.
export const processPhoto = async (file) => {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    const err = new Error(
      isHeicFile(file)
        ? 'This looks like an iPhone photo (HEIC), which is not supported. Please convert it to JPG or PNG and try again.'
        : `Unsupported file type (${file.type || file.name.split('.').pop()}). Please choose a JPG, PNG, or WEBP image.`
    )
    throw err
  }
  return downscaleImage(file)
}

export const downscaleImage = (file, MAX = MAX_PHOTO_EDGE) => {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      try {
        const longest = Math.max(img.naturalWidth, img.naturalHeight)
        const scale = Math.min(1, MAX / longest)

        // Already small enough — use the original file untouched
        if (scale >= 1 && file.size <= MAX_PHOTO_BYTES) {
          URL.revokeObjectURL(url)
          resolve(file)
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)

        const type = file.type === 'image/png' ? 'image/png' : file.type === 'image/webp' ? 'image/webp' : 'image/jpeg'
        const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg'
        const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo'

        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url)
          if (!blob) return reject(new Error('Image encoding failed'))
          resolve(new File([blob], `${baseName}-resized.${ext}`, { type }))
        }, type, 0.85)
      } catch (err) {
        URL.revokeObjectURL(url)
        reject(err)
      }
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read this image. Please choose another photo (JPG, PNG, or WEBP).'))
    }
    img.src = url
  })
}
