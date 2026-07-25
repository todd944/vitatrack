import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'

export default defineConfig({
  // mkcert generates a locally-trusted certificate authority (installed
  // into this machine's trust store automatically) and issues it a cert
  // for localhost + the machine's LAN IPs. That makes https://<LAN IP>:5173
  // a genuine secure context, so camera access (barcode scanning) works
  // from a phone on the same WiFi — without depending on a third-party
  // tunnel relay staying up. The phone itself won't trust the CA
  // automatically (only this machine does), so it'll show a one-time
  // certificate warning — tapping through "Advanced / Proceed" is normal
  // and expected, not a sign anything's broken.
  plugins: [react(), mkcert()],
  server: {
    // Binds to all network interfaces (not just localhost) so a phone on
    // the same WiFi can reach the dev server at your computer's LAN IP.
    host: true,
  },
})
