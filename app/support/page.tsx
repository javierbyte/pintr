import type { Metadata } from 'next';
import Link from 'next/link';

import SiteFooter from '../site-footer';

const TITLE = 'PINTR Support';
const DESCRIPTION =
  'Help, contact, and troubleshooting for the PINTR app for iPhone and iPad.';

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: 'https://javier.xyz/pintr/support',
  },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: 'https://javier.xyz/pintr/support',
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

export default function SupportPage() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <header className="flex doc-header">
        <h1>PINTR Support</h1>
        <p className="doc-back">
          <Link href="/">Back to PINTR</Link>
        </p>
      </header>

      <main id="main" className="doc">
        <p className="meta">Last updated: August 29, 2026.</p>

        <p>
          PINTR turns a photo into a plotter-like line drawing on your iPhone or
          iPad. Everything runs on the device. Read the{' '}
          <strong>
            <Link href="/privacy">privacy policy</Link>
          </strong>{' '}
          for how it handles your photos and exports.
        </p>

        <h2>Contact</h2>

        <p>
          Email <a href="mailto:pintr@javier.xyz">pintr@javier.xyz</a> with
          questions, bugs, or feature requests. It helps to include your device
          model, your iOS or iPadOS version, and the app version shown at the
          bottom of <strong>About PINTR</strong> inside the app.
        </p>

        <h2>Requirements</h2>

        <ul>
          <li>iPhone or iPad running iOS or iPadOS 26 or later.</li>
          <li>
            No account and no internet connection. After installation PINTR
            works entirely offline.
          </li>
        </ul>

        <h2>Getting started</h2>

        <ol>
          <li>
            Tap <strong>Add Image</strong> and pick a source:{' '}
            <strong>Choose Photo</strong> for the photo library,{' '}
            <strong>Take Photo</strong> for the camera, or{' '}
            <strong>Open File…</strong> for an image file. On iPad you can also
            drag an image into the app.
          </li>
          <li>
            The drawing starts immediately and fills in line by line while you
            watch.
          </li>
          <li>
            Adjust the controls. Every change redraws right away.
          </li>
          <li>
            Tap <strong>Export</strong> to share the result as PNG or SVG.
          </li>
        </ol>

        <p>
          Photos with a clear subject, good contrast, and a light background
          give the strongest drawings.
        </p>

        <h2>Controls</h2>

        <ul>
          <li>
            <strong>Lines</strong> — how many strokes the drawing uses. More
            lines mean more detail and a longer draw.
          </li>
          <li>
            <strong>Contrast</strong> — how strongly light and dark areas are
            separated before drawing.
          </li>
          <li>
            <strong>Definition</strong> — how closely the strokes follow fine
            detail rather than broad shapes.
          </li>
          <li>
            <strong>Stroke width</strong> — the thickness of each line.
          </li>
          <li>
            <strong>Single continuous line</strong> — draws the whole image
            without lifting the pen, the classic plotter look.
          </li>
          <li>
            <strong>New variation</strong> — picks a new seed, giving a
            different drawing of the same photo. The current seed is shown next
            to it.
          </li>
        </ul>

        <p>
          Pinch or use a trackpad to zoom, drag to pan, and double-tap to reset
          the view. <strong>Fit Artwork</strong> returns the drawing to the
          screen if you lose it while zoomed in.
        </p>

        <h2>Exporting PNG and SVG</h2>

        <ul>
          <li>
            <strong>Share PNG</strong> exports the drawing as an image, at the
            size of the prepared artwork.
          </li>
          <li>
            <strong>Share SVG</strong> exports vector paths, for plotters,
            cutters, and editors like Illustrator, Affinity, Figma, or Inkscape.
          </li>
          <li>
            Both open the system share sheet, from which you can save to Files
            or Photos, send the file, or open it in another app.
          </li>
          <li>
            Exports are written to temporary storage inside the app and are
            cleared on a later launch, so save or send the file rather than
            relying on that temporary copy.
          </li>
        </ul>

        <h2>Permissions</h2>

        <p>
          <strong>Photos and files.</strong> Choosing a photo or opening a file
          goes through the system picker, which hands PINTR only the item you
          selected. No separate permission is requested, and PINTR never gets
          access to your whole library.
        </p>

        <p>
          <strong>Camera.</strong> The first time you use{' '}
          <strong>Take Photo</strong>, iOS asks for camera permission. If you
          declined earlier and want it back, open Settings → PINTR and turn on
          Camera, or go to Settings → Privacy &amp; Security → Camera and enable
          PINTR there. Return to the app and choose{' '}
          <strong>Take Photo</strong> again. Everything else in the app keeps
          working without camera access.
        </p>

        <h2>Troubleshooting</h2>

        <h3>&quot;The selected item is not a readable image.&quot;</h3>
        <p>
          The file is not an image PINTR can open, or it is not an image at all
          — a PDF, a video, or a document with an image-like name. Try a JPEG,
          PNG, or HEIC file instead.
        </p>

        <h3>&quot;PINTR could not prepare the selected image.&quot;</h3>
        <p>
          The file is an image, but its contents could not be decoded — usually
          a partially downloaded or corrupted file, or an unusual camera raw
          format. Open it in Photos first, export or duplicate it as a JPEG, and
          import that copy.
        </p>

        <h3>The drawing looks blank, faint, or too dark</h3>
        <p>
          Raise <strong>Lines</strong> for more coverage and adjust{' '}
          <strong>Contrast</strong>. Photos that are very dark, very flat, or
          busy from edge to edge give the engine little to follow; a portrait or
          a subject against a light background works far better.
        </p>

        <h3>Drawing feels slow</h3>
        <p>
          A high line count is simply a lot of work. The image appears
          progressively and stays interactive while it draws; lower{' '}
          <strong>Lines</strong> for a faster result, and use{' '}
          <strong>Stop</strong> to end a draw you no longer want.
        </p>

        <h3>An export failed</h3>
        <p>
          Free up storage space on the device and try again. If it keeps
          failing, note what you were exporting and email{' '}
          <a href="mailto:pintr@javier.xyz">pintr@javier.xyz</a>.
        </p>

        <h2>Privacy</h2>

        <p>
          Your photos and drawings stay on your device. PINTR has no account, no
          analytics, and no network service. The full{' '}
          <strong>
            <Link href="/privacy">privacy policy</Link>
          </strong>{' '}
          explains what that means for Photos, the camera, files, and exports.
        </p>

        <h2>PINTR in a browser</h2>

        <p>
          There is also a free web version of PINTR at{' '}
          <Link href="/">javier.xyz/pintr</Link>, and the drawing engine is open
          source on{' '}
          <a href="https://github.com/javierbyte/pintr">GitHub</a>.
        </p>
      </main>

      <SiteFooter />
    </>
  );
}
