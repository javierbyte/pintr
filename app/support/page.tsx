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
        <p className="meta">Last updated: November 26, 2026.</p>

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
            Tap <strong>Add Media</strong> in the toolbar and pick a source:{' '}
            <strong>Choose Photo</strong> for the photo library,{' '}
            <strong>Take Photo</strong> for the camera,{' '}
            <strong>Open File…</strong> for an image file, or{' '}
            <strong>Samples…</strong> for a sample picture. You can also drag
            an image into the app. The same menu has{' '}
            <strong>Close Photo</strong>, which removes the open picture.
          </li>
          <li>
            The drawing starts immediately and fills in line by line while you
            watch.
          </li>
          <li>
            Adjust the controls. Every change redraws right away.
          </li>
          <li>
            Tap <strong>Export</strong> to save or share the result.
          </li>
        </ol>

        <p>
          The start screen also offers <strong>Try a Sample</strong> and a{' '}
          <strong>Recent</strong> row with your last 5 edits. Tap{' '}
          <strong>Clear</strong> next to Recent to remove them. When you come
          back, the app reopens on the edit you left.
        </p>

        <p>
          Photos with a clear subject, good contrast, and a light background
          give the strongest drawings.
        </p>

        <h2>Controls</h2>

        <p>
          The controls live in the <strong>Sidebar</strong>, which you can
          collapse and expand.
        </p>

        <p>
          <strong>Drawing</strong>
        </p>

        <ul>
          <li>
            <strong>Lines</strong> — how many strokes the drawing uses. More
            lines mean more detail and a longer draw.{' '}
            <strong>Auto line count</strong> lets the app choose the number.
          </li>
          <li>
            <strong>Stroke width</strong> — the thickness of each line.
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
            <strong>Single continuous line</strong> — draws the whole image
            without lifting the pen, the classic plotter look.
          </li>
          <li>
            <strong>New Generation</strong> — picks a new seed, giving a
            different drawing of the same photo. The current seed is shown
            under <strong>Info</strong>.
          </li>
        </ul>

        <p>
          <strong>Source</strong>
        </p>

        <ul>
          <li>
            <strong>Aspect ratio</strong> — the shape of the drawing: Original,
            Square, portrait and landscape ratios, and the A4, Letter, and
            Legal paper sizes.
          </li>
          <li>
            <strong>Padding</strong> — the space around the image.
          </li>
          <li>
            <strong>Extend image</strong>.
          </li>
          <li>
            <strong>Vignette</strong>, adjusted with{' '}
            <strong>Vignette distance</strong>,{' '}
            <strong>Vignette hardness</strong>, and{' '}
            <strong>Square vignette</strong>.
          </li>
          <li>
            <strong>Remove background</strong> — finds the subject of the photo
            on your device and draws it without its background.
          </li>
          <li>
            <strong>Preview</strong> — shows the source image the drawing is
            made from.
          </li>
        </ul>

        <p>
          <strong>Undo</strong> and <strong>Redo</strong> step back and forward
          through your changes, and <strong>Reset All Settings</strong> returns
          every control to its default. Pinch to zoom and drag to pan.{' '}
          <strong>Fit Artwork</strong> returns the drawing to the screen if you
          lose it while zoomed in.
        </p>

        <h2>Exporting</h2>

        <ul>
          <li>
            <strong>PNG</strong> — <strong>Save PNG to Photos</strong> or{' '}
            <strong>Share PNG</strong>. Options: <strong>Size</strong> and{' '}
            <strong>Transparent background</strong>.
          </li>
          <li>
            <strong>SVG</strong> — vector paths, for plotters, cutters, and
            editors like Illustrator, Affinity, Figma, or Inkscape.{' '}
            <strong>Save to Files</strong> or <strong>Share</strong>. Option:{' '}
            <strong>Transparent background</strong>.
          </li>
          <li>
            <strong>PDF</strong> — <strong>Save to Files</strong> or{' '}
            <strong>Share</strong>. Option:{' '}
            <strong>Transparent background</strong>.
          </li>
          <li>
            <strong>Coordinates</strong> — <strong>Save to Files</strong> or{' '}
            <strong>Share</strong>. Options: <strong>File type</strong> (JSON
            or CSV) and <strong>Normalize to 0–1</strong>.
          </li>
          <li>
            <strong>Video</strong> — shows the drawing being made line by line.
            Tap <strong>Create Video</strong>, then{' '}
            <strong>Share Video</strong>.
          </li>
          <li>
            <strong>Live Photo</strong> — also shows the drawing being made
            line by line. Tap <strong>Save Live Photo to Photos</strong>.
          </li>
          <li>
            <strong>Save to Files</strong> opens the system save dialog, so you
            choose where the file goes. The Share buttons open the system share
            sheet, from which you can send the file or open it in another app.
          </li>
          <li>
            Long exports show their progress and a{' '}
            <strong>Cancel Export</strong> button.
          </li>
          <li>
            Shared exports are written to temporary storage inside the app and
            are cleared on a later launch, so save or send the file rather than
            relying on that temporary copy.
          </li>
        </ul>

        <h2>Permissions</h2>

        <p>
          <strong>Photos and files.</strong> Choosing a photo or opening a file
          goes through the system picker, which hands PINTR only the item you
          selected. No permission is requested for this, and PINTR never gets
          read access to your library.
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

        <p>
          <strong>Saving to Photos.</strong> The first time you use{' '}
          <strong>Save PNG to Photos</strong> or{' '}
          <strong>Save Live Photo to Photos</strong>, iOS asks for add-only
          access to your photo library. Add-only means PINTR can add items but
          cannot read or browse your library. If saving is refused, the app
          says &quot;Allow PINTR to add photos in Settings, then try
          again.&quot; and offers an <strong>Open Settings</strong> button. You
          can also turn it back on in Settings → PINTR → Photos, or in Settings
          → Privacy &amp; Security → Photos. Everything else in the app keeps
          working without this permission.
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

        <h3>
          &quot;No distinct foreground subject was found in this photo.&quot;
        </h3>
        <p>
          <strong>Remove background</strong> could not find a subject. Turn it
          off, or use a photo with a clearer subject.
        </p>

        <h3>
          &quot;Allow PINTR to add photos in Settings, then try again.&quot;
        </h3>
        <p>
          PINTR does not have permission to add to your photo library. See{' '}
          <strong>Saving to Photos</strong> under Permissions above.
        </p>

        <h3>&quot;Photo Library access is restricted on this device.&quot;</h3>
        <p>
          Photos access is blocked by Screen Time or a device profile.
        </p>

        <h3>&quot;This device cannot encode HEVC at that size.&quot;</h3>
        <p>
          Video or Live Photo export at this drawing size is not supported on
          the device. Try a smaller aspect ratio or source.
        </p>

        <h3>&quot;Could not encode the complete animation.&quot;</h3>
        <p>Try the export again.</p>

        <h3>
          &quot;Photos could not open this Live Photo pair. Nothing was
          saved.&quot;
        </h3>
        <p>Try the export again.</p>

        <h3>&quot;PINTR could not render that export.&quot;</h3>
        <p>Try the export again.</p>

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
