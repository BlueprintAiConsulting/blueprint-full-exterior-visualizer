// This script will run in the browser to extract the zoomed image for a specific color
const scrapeColor = async (colorName) => {
  // Find the swatch button
  const swatchButtons = Array.from(document.querySelectorAll('.color-swatch, button[aria-label*="color"]'));
  console.log("Found buttons:", swatchButtons.length);
  return swatchButtons.map(b => b.getAttribute('aria-label') || b.textContent);
};
scrapeColor();
