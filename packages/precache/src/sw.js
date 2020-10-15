const versionDomain = 'PROJECT-HTML-CACHE'
// const isWholeVersionUpdate = process.env.IS_WHOLE_VERSION_UPDATE === 'true'
const isWholeVersionUpdate = process.env.IS_WHOLE_VERSION_UPDATE === 'true'


const cacheName = process.env.BUILD_ID
const staticPagePathList = JSON.parse(process.env.STATIC_PAGE)

const version = `${versionDomain}-${cacheName}`
// Only for static html
self.addEventListener('install', (event) => {
  if (self.skipWaiting) {
    self.skipWaiting()
  }
  // cache static html follow projectBuildId
  event.waitUntil(
    caches.open(version).then((cache) => {
      return cache.addAll(staticPagePathList)
    })
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key.indexOf(versionDomain) !== -1 && key !== version) {
          return caches.delete(key)
        }
      }))
    })
  )
})

self.addEventListener('fetch', async (event) => {
  if (process.env.NODE_ENV === 'develepment') return
  // Let the browser do its default thing
  // for non-GET requests.
  const currentPagePath = new URL(event.request.url).pathname
  if (!(event.request.method === 'GET' && staticPagePathList.indexOf(currentPagePath) !== -1)) return

  // https://github.com/whatwg/fetch/issues/658
  // prefetch maybe 'empty'(spec) or 'unknown'(old)
  // event.request.destination === 'document' not work for prefetch
  // Prevent the default, and handle the request ourselves.
  event.respondWith((async () => {
    // Try to get the response from a cache.
    const cache = await caches.open(version)

    if (!isWholeVersionUpdate) {
      event.waitUntil(cache.add(currentPagePath))
    }

    // Only response cache for static html
    const cachedResponse = await cache.match(currentPagePath)
    if (cachedResponse) {
      return cachedResponse
    }

    // If we didn't find a match in the cache, use the network.
    return fetch(event.request)
  })())
})
