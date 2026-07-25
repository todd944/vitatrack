// Resolves a scanned UPC/EAN barcode to a product name via Open Food
// Facts's public API — free, no API key, called directly from the browser.
//
// UPCitemdb (a more product-general barcode database) was tried first and
// rejected: its trial endpoint doesn't send CORS headers, so it fails with
// an opaque "Failed to fetch" from a browser regardless of the request
// itself being fine — confirmed live rather than assumed. Open Food Facts
// does support CORS and returns real product data. Coverage is
// food/grocery-centric (it's a food database that happens to catalog a lot
// of supplements too, not a dedicated supplement database), so some
// supplement barcodes won't resolve — that's an expected miss, not a bug,
// and falls through to the same manual-entry path as any other lookup miss.
export async function lookupBarcode(code) {
  const trimmed = code.trim()
  if (!trimmed) return null

  const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(trimmed)}.json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Barcode lookup failed')
  const data = await res.json()
  if (data?.status !== 1 || !data?.product?.product_name) return null

  const { product_name, brands } = data.product
  const brand = brands ? brands.split(',')[0].trim() : null
  return {
    name: brand ? `${brand} ${product_name}`.trim() : product_name,
    brand,
  }
}
