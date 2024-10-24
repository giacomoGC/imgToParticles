export default function extractPixelData(image) {
  // Create an off-screen canvas to extract pixel data
  const canvas = document.createElement('canvas');
  canvas.width = image.width;
  canvas.height = image.height;

  const context = canvas.getContext('2d');
  // Draw the image onto the canvas
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  // Get pixel data
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data; // This is a flat array containing the RGBA values of each pixel
  
  return data;
}