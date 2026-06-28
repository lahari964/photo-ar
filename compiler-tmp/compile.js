const { Compiler } = require('mind-ar/src/image-target/compiler');
const { loadImage } = require('canvas');
const fs = require('fs');

async function compile() {
  console.log('Loading image...');
  const image = await loadImage('../photos/lahari paragliding.jpeg');
  
  console.log('Compiling image target...');
  const compiler = new Compiler();
  await compiler.compileImageTargets([image], (progress) => {
    console.log('Progress: ' + progress.toFixed(2));
  });
  
  console.log('Exporting data...');
  const exportedBuffer = await compiler.exportData();
  
  fs.writeFileSync('../public/lahari-paragliding.mind', new Uint8Array(exportedBuffer));
  console.log('Done! Saved to public/lahari-paragliding.mind');
}

compile().catch(console.error);
