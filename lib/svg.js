export function generateSvg(coords) {
  return `<svg viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg" stroke="black">
${coords
  .map((coord) => {
    return `<line x1="${coord[0][0]}" y1="${coord[0][1]}" x2="${coord[1][0]}" y2="${coord[1][1]}"/>`;
  })
  .join("\n")}
</svg>
  `;
}

export function generatePolySvg(coords) {
  return `<svg viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg">
  <polyline points="${coords
    .map((coordPair) => coordPair[0].join(","))
    .join(" ")}" fill="none" stroke="black" />
</svg>
  `;
}
