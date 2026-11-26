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
          <a href="/pintr">Back to PINTR</a>
        </p>
      </header>

      <main id="main" className="doc">
        <p className="meta">Last updated: November 26, 2026.</p>

        <p>
          PINTR turns a photo into a line drawing. The app for iPhone and iPad
          processes your photos and creates exports on your device. This policy
          also covers the web drawing tool at javier.xyz/pintr.
        </p>

        <h2>The PINTR app for iPhone and iPad</h2>

        <p>
          PINTR <strong>collects no data</strong> from the app. Its privacy
          manifest declares no data collection or tracking.
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
        </ul>

        <h2>Photos, camera, and files</h2>

        <p>
          You can choose a photo from the start screen or open the Add Media
          menu in the toolbar.
        </p>

        <ul>
          <li>
            <strong>Choose Photo</strong> opens the system photo picker. The
            picker runs outside the app and hands over only the single item you
            pick, so the app never gets read access to your photo library.
          </li>
          <li>
            <strong>Take Photo</strong> opens the camera. iOS asks for camera
            permission the first time, for the reason shown in the prompt:
            &quot;Take a photo to turn it into a PINTR drawing.&quot; The photo
            is not saved to your photo library. Its working copy is kept in the
            app in the same way as any other picture, as described below.
          </li>
          <li>
            <strong>Open File…</strong> and drag-and-drop read the one image
            file you select.
          </li>
          <li>
            <strong>Samples…</strong> opens a sample picture that comes with
            the app.
          </li>
        </ul>

        <p>
          Whatever the source, the image is prepared and drawn entirely on your
          device. It is never uploaded. The <strong>Remove background</strong>{' '}
          option uses Apple&rsquo;s on-device subject detection, and nothing is
          sent anywhere.
        </p>

        <p>
          PINTR stores a reduced working copy of the open picture, its name,
          and drawing settings in app storage so the edit can reopen at launch.
          When you close a picture or open another, PINTR can keep the previous
          edit under <strong>Recent</strong> on the start screen. PINTR keeps up
          to five recent edits with their settings and a drawing thumbnail.
          Bundled samples use the copy already included with the app. Your
          device backups may include PINTR’s saved edits and settings,
          depending on your backup settings.
        </p>

        <h2>Exported drawings</h2>

        <p>
          Exports are made on your device, and each one goes only where you
          send it:
        </p>

        <ul>
          <li>
            <strong>PNG</strong> — <strong>Save PNG to Photos</strong> or{' '}
            <strong>Share PNG</strong>.
          </li>
          <li>
            <strong>SVG</strong>, <strong>PDF</strong>, and{' '}
            <strong>Coordinates</strong> (JSON or CSV) —{' '}
            <strong>Save to Files</strong>, which opens the system save dialog
            so you choose the location, or <strong>Share</strong>.
          </li>
          <li>
            <strong>Video</strong> — <strong>Create Video</strong>, then{' '}
            <strong>Share Video</strong>.
          </li>
          <li>
            <strong>Live Photo</strong> —{' '}
            <strong>Save Live Photo to Photos</strong>.
          </li>
        </ul>

        <p>
          PINTR can use temporary storage to prepare a shareable file. It
          also stores generated videos there while you choose whether to share
          them. The system share sheet hands the export to the destination you
          choose, such as Files, Photos, or Mail. That destination handles the
          copy according to its own settings and privacy policy.
        </p>

        <p>
          PINTR clears leftover temporary export files when it next launches.
          Live Photo export uses temporary files that PINTR discards after
          the save attempt. Copies you save or share are kept at the
          destination you chose.
        </p>

        <p>
          Saving a PNG or a Live Photo to Photos asks for add-only access to
          your photo library, for the reason shown in the prompt: &quot;Save
          exported drawings and Live Photos to your photo library.&quot;
          Add-only means the app can add items but cannot read or browse your
          library. iOS asks only the first time you use one of those two save
          buttons, and the rest of the app works without this permission. You
          can change it in Settings → Apps → PINTR → Photos or in Settings →
          Privacy &amp; Security → Photos.
        </p>

        <h2>Data retention and deletion</h2>

        <p>
          There is no PINTR account or server-side app data to delete. You
          can manage saved edits, exports, and permissions on your device.
        </p>

        <ul>
          <li>
            To remove the working copies, choose <strong>Close Photo</strong>{' '}
            in the Add Media menu. Then tap <strong>Clear</strong> next to{' '}
            <strong>Recent</strong> on the start screen and confirm. This clears
            the recent edits together. Older edits also drop off as new ones
            fill the five available slots.
          </li>
          <li>
            PNGs and Live Photos saved to Photos stay in your photo library, and
            are deleted there, in Photos.
          </li>
          <li>
            Files saved through the save dialog stay in the location you chose,
            and are deleted there, in Files.
          </li>
          <li>
            Exports you shared live in whichever app or folder you sent them to,
            and are deleted there.
          </li>
          <li>
            Deleting the app removes its working copies, recent edits, and
            temporary exports from the device. Manage any backup copies through
            your backup settings.
          </li>
          <li>
            Camera permission can be changed or revoked at any time in Settings
            → Privacy &amp; Security → Camera or Settings → Apps → PINTR.
          </li>
          <li>
            Permission to add to Photos can be changed or revoked at any time in
            Settings → Privacy &amp; Security → Photos or Settings → Apps →
            PINTR → Photos.
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
            The web drawing tool uses Google Analytics (Google LLC) to
            measure visits. Google Analytics can use cookies for this purpose.
            This privacy page and the support page do not load Google Analytics.
          </li>
          <li>
            The Brutalita typeface is loaded from brutalita.com, so that origin
            sees your browser&rsquo;s font request.
          </li>
        </ul>

        <h2>Support email</h2>

        <p>
          If you email PINTR, Javier Bórquez uses your email address and the
          details you provide to respond to your request. You can use the
          contact address below to ask for deletion of information you sent.
        </p>

        <h2>Children</h2>

        <p>
          PINTR is not directed at children. The iPhone and iPad app does not
          collect personal data from users of any age.
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
