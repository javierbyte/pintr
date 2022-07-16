export default function liveSvg(container) {
  const internal = {
    toFlush: [],
  };

  function clear() {
    container.innerHTML = `<svg viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg" stroke="black"></svg>`;
    internal.toFlush = [];
  }

  function lineBuffer(from, to) {
    internal.toFlush.push([from, to]);
  }

  function stroke() {
    let stringTmp = ``;

    internal.toFlush.forEach(([from, to]) => {
      stringTmp += `<line x1="${from[0]}" y1="${from[1]}" x2="${to[0]}" y2="${to[1]}"/>`;
    });

    container.querySelector('svg').innerHTML += stringTmp;
    internal.toFlush = [];
  }

  clear();

  return {
    clear,
    lineBuffer,
    stroke,
  };
}
