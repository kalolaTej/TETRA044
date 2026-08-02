// real photographic image URLs for animal detection snapshots & camera streams

export const ANIMAL_IMAGES = {
  cow: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800',
  dog: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800',
  bear: 'https://images.pexels.com/photos/35435/pexels-photo.jpg?auto=compress&cs=tinysrgb&w=800',
  pig: 'https://images.pexels.com/photos/110820/pexels-photo-110820.jpeg?auto=compress&cs=tinysrgb&w=800',
  horse: 'https://images.pexels.com/photos/1996333/pexels-photo-1996333.jpeg?auto=compress&cs=tinysrgb&w=800',
  fallback: 'https://images.pexels.com/photos/422218/pexels-photo-422218.jpeg?auto=compress&cs=tinysrgb&w=800'
}

export function getAnimalImage(animalName, providedUrl) {
  if (
    providedUrl &&
    typeof providedUrl === 'string' &&
    providedUrl.trim().length > 5 &&
    !providedUrl.includes('placeholder.co')
  ) {
    return providedUrl
  }
  const key = (animalName || '').toLowerCase()
  return ANIMAL_IMAGES[key] || ANIMAL_IMAGES.cow
}
