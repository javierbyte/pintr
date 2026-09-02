'use client';

import { useEffect } from 'react';
import { GoogleAnalytics } from '@next/third-parties/google';

import SiteFooter from './site-footer';

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
            <div id="srcImg" role="img" aria-label="Source image"></div>
            <div className="label">Source</div>
          </div>
        </div>

        <canvas id="src" style={{ display: 'none' }}></canvas>

        <div className="input-container">
          <div className="input">
            <label htmlFor="lines">Lines</label>
            <input
              type="range"
              data-start-drawing
              id="lines"
              step="1"
              min="0"
              max="100"
              defaultValue="35"
            />
          </div>

          <div className="input">
            <label htmlFor="contrast">Contrast</label>
            <input
              type="range"
              data-start-drawing
              id="contrast"
              step="10"
              min="0"
              max="100"
              defaultValue="50"
            />
          </div>

          <div className="input">
            <label htmlFor="definition">Definition</label>
            <input
              type="range"
              data-start-drawing
              id="definition"
              step="10"
              min="0"
              max="100"
              defaultValue="55"
            />
          </div>

          <div className="input">
            <label htmlFor="singleLine">Single Line</label>
            <input
              type="range"
              data-start-drawing
              className="toggle"
              id="singleLine"
              min="0"
              max="1"
              defaultValue="1"
            />
          </div>

          <div className="input">
            <label htmlFor="strokeWidth">Stroke width</label>
            <input
              type="range"
              data-start-drawing
              id="strokeWidth"
              step="1"
              min="0"
              max="100"
              defaultValue="40"
            />
          </div>

          <div className="input">
            <label htmlFor="advancedOptions">Advanced</label>
            <input
              data-start-drawing
              type="range"
              className="toggle"
              id="advancedOptions"
              min="0"
              max="1"
              defaultValue="0"
            />
          </div>
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
            <div className="input">
              <label htmlFor="padding">Padding</label>
              <input
                type="range"
                data-start-drawing
                id="padding"
                min="0"
                max="25"
                defaultValue="0"
              />
            </div>
          </div>

          <div className="input-container extend-image--container">
            <div className="input">
              <label htmlFor="extendImage">Extend original image</label>
              <input
                data-start-drawing
                type="range"
                className="toggle"
                id="extendImage"
                min="0"
                max="1"
                defaultValue="0"
              />
            </div>
          </div>

          <div className="folder">
            <div className="input-container folder--tab">
              <div className="input">
                <label htmlFor="vignette">Vignette</label>
                <input
                  data-start-drawing
                  type="range"
                  className="toggle"
                  id="vignette"
                  min="0"
                  max="1"
                  defaultValue="0"
                />
              </div>
            </div>

            <div className="vignette-options--container folder--sheet">
              <div className="input-container">
                <div className="input">
                  <label htmlFor="vignetteDistance">Vignette distance</label>
                  <input
                    type="range"
                    data-start-drawing
                    id="vignetteDistance"
                    min="0"
                    max="100"
                    defaultValue="50"
                  />
                </div>
              </div>

              <div className="input-container">
                <div className="input">
                  <label htmlFor="vignetteHardness">Vignette hardness</label>
                  <input
                    type="range"
                    data-start-drawing
                    id="vignetteHardness"
                    min="0"
                    max="100"
                    defaultValue="50"
                  />
                </div>
              </div>

              <div className="input-container">
                <div className="input">
                  <label htmlFor="vignetteSquare">Vignette square</label>
                  <input
                    data-start-drawing
                    type="range"
                    className="toggle"
                    id="vignetteSquare"
                    min="0"
                    max="1"
                    defaultValue="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="input-container">
            <div className="input">
              <label htmlFor="smoothingAmount">Smoothing</label>
              <input
                data-start-drawing
                type="range"
                id="smoothingAmount"
                min="0"
                max="100"
                defaultValue="0"
              />
            </div>
          </div>

          <div
            className="padding experimental--smooth-svg--container--warning"
            style={{ display: 'none' }}
          >
            Smoothing only applies to &quot;single line&quot; drawings.
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
          <div className="input">
            <label htmlFor="transparentBackground">
              Transparent background
            </label>
            <input
              data-start-drawing
              type="range"
              className="toggle"
              id="transparentBackground"
              min="0"
              max="1"
              defaultValue="1"
            />
          </div>
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
            More information and source available on{' '}
            <a href="https://github.com/javierbyte/pintr">Github</a>.
          </p>
        </section>

        <SiteFooter />
      </main>
      <GoogleAnalytics gaId="G-M2FT27FXS2" />
    </>
  );
}
