'use client';

import { useEffect } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

import SiteFooter from './site-footer';

// Every control is a range input that `main.ts` reads by its id.
function Slider({
  id,
  label,
  ...props
}: { id: string; label: string } & React.ComponentProps<'input'>) {
  return (
    <div className="input">
      <label htmlFor={id}>{label}</label>
      <input
        type="range"
        data-start-drawing
        id={id}
        min="0"
        max="100"
        {...props}
      />
    </div>
  );
}

// An on/off control is a range input that only goes from 0 to 1.
function Toggle({
  id,
  label,
  defaultValue = '0',
}: {
  id: string;
  label: string;
  defaultValue?: string;
}) {
  return (
    <Slider
      id={id}
      label={label}
      className="toggle"
      max="1"
      defaultValue={defaultValue}
    />
  );
}

export default function Page() {
  useEffect(() => {
    let disposed = false;
    let cleanup: (() => void) | undefined;

    // Initialize after React has mounted the DOM. The module itself is cached by
    // Next.js, so setup must run on every mount (including client-side back
    // navigation from Privacy or Support).
    import('../main').then(({ initializePintrApp }) => {
      if (disposed) return;
      cleanup = initializePintrApp();
    });

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, []);

  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <noscript>
        PINTR requires JavaScript to run. Please enable JavaScript in your
        browser.
      </noscript>
      <main id="main" className="app">
        <header className="flex">
          <h1>PINTR</h1>
          <p className="subtitle">
            Create plotter-like line drawings from your images
          </p>
          <input
            id="inputImageFile"
            type="file"
            accept="image/*"
            aria-label="Upload an image"
          />
          <button id="inputImageButton" type="button">
            New image
          </button>
        </header>

        <div className="inline">
          <div className="padding">
            <canvas
              id="draw"
              aria-label="Generated line drawing output"
            ></canvas>
          </div>

          <div className="srcimage-container padding">
            <canvas id="srcImg" role="img" aria-label="Source image"></canvas>
            <div className="label">Source</div>
          </div>
        </div>

        <div className="input-container">
          <Slider id="lines" label="Lines" defaultValue="42" />
          <Slider id="contrast" label="Contrast" step="10" defaultValue="50" />
          <Slider
            id="definition"
            label="Definition"
            step="10"
            defaultValue="55"
          />
          <Toggle id="singleLine" label="Single Line" defaultValue="1" />
          <Slider id="strokeWidth" label="Stroke width" defaultValue="35" />
          <Toggle id="advancedOptions" label="Advanced" />
        </div>

        <div className="advanced-options--container">
          <div className="input-container">
            <div className="input">
              <label htmlFor="aspectRatio">Aspect ratio</label>
              <select id="aspectRatio" data-start-drawing defaultValue="">
                <option value="">Original</option>
                <optgroup label="Ratio">
                  <option value="1:1">1:1</option>
                  <option value="4:5">4:5</option>
                  <option value="5:4">5:4</option>
                  <option value="2:3">2:3</option>
                  <option value="3:2">3:2</option>
                  <option value="3:4">3:4</option>
                  <option value="4:3">4:3</option>
                  <option value="9:16">9:16</option>
                  <option value="16:9">16:9</option>
                </optgroup>
                <optgroup label="Paper">
                  {/* Every A size is the same 1:sqrt(2) ratio, so one entry per
                      orientation covers A2 through A6. */}
                  <option value="210:297">A4 / A3 (portrait)</option>
                  <option value="297:210">A4 / A3 (landscape)</option>
                  <option value="8.5:11">Letter (portrait)</option>
                  <option value="11:8.5">Letter (landscape)</option>
                  <option value="8.5:14">Legal (portrait)</option>
                  <option value="14:8.5">Legal (landscape)</option>
                </optgroup>
              </select>
            </div>
          </div>

          <div className="input-container">
            <Slider id="padding" label="Padding" max="25" defaultValue="0" />
          </div>

          <div className="input-container">
            <Toggle id="extendImage" label="Extend original image" />
          </div>

          <div className="folder">
            <div className="input-container folder--tab">
              <Toggle id="vignette" label="Vignette" />
            </div>

            <div className="vignette-options--container folder--sheet">
              <div className="input-container">
                <Slider
                  id="vignetteDistance"
                  label="Vignette distance"
                  defaultValue="50"
                />
              </div>

              <div className="input-container">
                <Slider
                  id="vignetteHardness"
                  label="Vignette hardness"
                  defaultValue="50"
                />
              </div>

              <div className="input-container">
                <Toggle id="vignetteSquare" label="Vignette square" />
              </div>
            </div>
          </div>

          <div className="flex">
            <button id="downloadTxt">Download TXT</button>
            <p className="export-note">
              x,y rows &middot; <span id="coordsSize">&hellip;</span> &middot;
              origin top left
            </p>
          </div>
        </div>

        <div className="flex">
          <button id="download">Download PNG</button>
          <button id="downloadSvg">Download SVG</button>

          {/* Only affects the downloads, so it lives with the download buttons. */}
          <Toggle
            id="transparentBackground"
            label="Transparent background"
            defaultValue="1"
          />
        </div>

        <section className="instructions" aria-label="How to use">
          <ol>
            <li>
              Select an image — images with a face, white or light backgrounds
              and good contrast work better.
            </li>
            <li>Play with the controls.</li>
            <li>Download. Your pictures never leave your computer.</li>
          </ol>
          <p>
            {'More information and source available on '}
            <a href="https://github.com/javierbyte/pintr">Github</a>.
          </p>
        </section>

        <SiteFooter />
      </main>
      <GoogleAnalytics gaId="G-M2FT27FXS2" />
    </>
  );
}
