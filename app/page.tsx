'use client';

import { useEffect, useRef } from 'react';

export default function Page() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    // The DOM is now mounted, so main.ts's top-level querySelector/listener
    // wiring (and final startNewDrawing()) runs against the rendered elements.
    import('../main');
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
              min="0"
              max="100"
              defaultValue="50"
            />
          </div>

          <div className="input">
            <label htmlFor="contrast">Contrast</label>
            <input
              type="range"
              data-start-drawing
              id="contrast"
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
              min="0"
              max="100"
              defaultValue="50"
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
              step="0.25"
              min="0.5"
              max="5"
              defaultValue="1.5"
            />
          </div>
        </div>

        <div className="flex">
          <button id="download">Download PNG</button>
          <button id="downloadSvg">Download SVG</button>
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

        <footer className="instructions">
          Created by <a href="https://javier.xyz">javierbyte</a>. This site uses{' '}
          <a href="https://brutalita.com">Brutalita Sans</a>. Follow me on{' '}
          <a href="https://x.com/javierbyte">X</a> to stay updated.
        </footer>

        <div className="input-container">
          <div className="input">
            <label htmlFor="advancedOptions">Advanced options</label>
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

          <div className="input-container">
            <div className="input">
              <label htmlFor="smoothingAmount">Smoothing</label>
              <input
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
        </div>
      </main>
    </>
  );
}
