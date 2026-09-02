import type { Metadata } from 'next';
import Link from 'next/link';

import SiteFooter from '../site-footer';

const TITLE = 'PINTR Privacy Policy';
const DESCRIPTION =
  'How the PINTR app for iPhone and iPad, and this website, handle your data.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://javier.xyz/pintr/privacy',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://javier.xyz/pintr/privacy',
    siteName: 'PINTR',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    site: '@javierbyte',
    creator: '@javierbyte',
  },
};

export default function PrivacyPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="flex doc-header">
        <h1>PINTR Privacy Policy</h1>
        <p className="doc-back">
          <Link href="/">Back to PINTR</Link>
        </p>
      </header>

      <main id="main" className="doc">
        <p className="meta">Last updated: August 29, 2026.</p>

        <p>
          PINTR turns a photo into a line drawing. The app for iPhone and iPad
          does all of that work on your device. It has no account, no server,
          and nothing to sign in to, so there is no personal information for it
          to collect, store, or share.
        </p>

        <p>
          This policy covers two separate things: the <strong>PINTR app</strong>{' '}
          you install from the App Store, and this <strong>website</strong> at
          javier.xyz/pintr. They are described separately below because they do
          not work the same way.
        </p>

        <h2>The PINTR app for iPhone and iPad</h2>

        <p>
          The app <strong>collects no data</strong>. Its bundled privacy
          manifest declares no collected data types and no tracking, which is
          why its App Store listing shows{' '}
          <strong>Data Not Collected</strong>.
        </p>

        <ul>
          <li>No account, sign-in, or profile.</li>
          <li>No analytics, crash reporting, or usage measurement.</li>
          <li>No advertising, and no tracking across apps or websites.</li>
          <li>No third-party SDKs.</li>
          <li>
            No network requests. The drawing engine, the preview, and the
            exports are all computed on your device, and the app keeps working
            with no connection at all.
          </li>
          <li>Nothing is sold or shared with anyone.</li>
        </ul>

        <h2>Photos, camera, and files</h2>

        <p>
          The app can only see an image after you choose it yourself, through
          the Add Image menu:
        </p>

        <ul>
          <li>
            <strong>Choose Photo</strong> opens the system photo picker. The
            picker runs outside the app and hands over only the single item you
            pick, so the app never gets access to your photo library.
          </li>
          <li>
            <strong>Take Photo</strong> opens the camera. iOS asks for camera
            permission the first time, for the reason shown in the prompt:
            &quot;Take a photo to turn it into a PINTR drawing.&quot; The photo
            goes straight into the drawing and is not saved anywhere by PINTR.
          </li>
          <li>
            <strong>Open File…</strong> and drag-and-drop read the one image
            file you select.
          </li>
        </ul>

        <p>
          Whatever the source, the image is prepared and drawn entirely on your
          device. It is never uploaded, and it is not copied anywhere outside
          the app. Choosing another image, or closing the app, discards the
          previous one.
        </p>

        <h2>Exported drawings</h2>

        <p>
          When you export a drawing, PINTR writes a PNG or SVG file into
          app-owned temporary storage on your device. That file leaves the app
          only when you send it somewhere yourself with the system share sheet
          — to Files, Photos, Mail, or another app of your choosing. PINTR does
          not upload it, and has no say in what the destination app does with
          it afterwards.
        </p>

        <p>
          Temporary export files are removed on a later launch of the app, so
          save or share an export you want to keep rather than relying on that
          temporary copy.
        </p>

        <h2>Data retention and deletion</h2>

        <p>
          There is no server-side user data to retain or delete, because the
          app sends nothing anywhere. Everything stays under your control on
          your device:
        </p>

        <ul>
          <li>
            The image currently loaded in the app is discarded when you replace
            it or close the app.
          </li>
          <li>
            Exports you shared live in whichever app or folder you sent them to,
            and are deleted there — in Files, Photos, or the destination app.
          </li>
          <li>
            Temporary exports the app still holds are cleared on a later launch,
            and deleting the app removes them along with everything else it
            stores.
          </li>
          <li>
            Camera permission can be changed or revoked at any time in Settings
            → Privacy &amp; Security → Camera, or in Settings → PINTR.
          </li>
        </ul>

        <h2>This website</h2>

        <p>
          This section is about javier.xyz/pintr only. None of it applies to the
          app, which contacts no servers at all.
        </p>

        <ul>
          <li>
            The browser version of PINTR draws your image locally in your
            browser. Images are never uploaded to a server.
          </li>
          <li>
            The site is hosted by <a href="https://vercel.com">Vercel</a>, which
            processes ordinary request data such as IP address and browser user
            agent in order to deliver the pages and keep the service secure.
          </li>
          <li>
            The drawing tool page uses Google Analytics (Google LLC) to count
            visits.
          </li>
          <li>
            <strong>
              This privacy page and the support page load no analytics and set
              no cookies.
            </strong>
          </li>
          <li>
            The typeface is served from this site, so no font or other
            third-party CDN sees your visit.
          </li>
        </ul>

        <h2>Children</h2>

        <p>
          PINTR is not directed at children, and because it collects no data it
          collects nothing from children either.
        </p>

        <h2>Changes to this policy</h2>

        <p>
          If the app or this site ever changes how it handles data, this page is
          updated and the date at the top changes with it. This address stays
          stable, because released versions of the app link to it.
        </p>

        <h2>Contact</h2>

        <p>
          Privacy questions go to{' '}
          <a href="mailto:pintr@javier.xyz">pintr@javier.xyz</a>. The app and
          this site are made by Javier Bórquez (
          <a href="https://javier.xyz">javier.xyz</a>). See also the{' '}
          <Link href="/support">support page</Link>.
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
