#!/usr/bin/env node
/**
 * Icon Generation Script for Electron Apps
 *
 * Converts SVG to all required icon formats:
 * - PNG at various sizes (16, 32, 64, 128, 256, 512, 1024)
 * - ICO for Windows
 * - ICNS for macOS
 *
 * Usage: node scripts/generate-icons.cjs [input.svg] [output-dir]
 * Defaults: assets/icon.svg -> assets/
 */

const sharp = require('sharp');
const png2icons = require('png2icons');
const fs = require('fs');
const path = require('path');

// Icon sizes needed for electron-builder
const PNG_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024];

// Default paths
const DEFAULT_INPUT = path.join(__dirname, '..', 'assets', 'icon.svg');
const DEFAULT_OUTPUT_DIR = path.join(__dirname, '..', 'assets');

async function generateIcons(inputSvg, outputDir) {
  console.log('🎨 Icon Generation Script');
  console.log('========================');
  console.log(`Input:  ${inputSvg}`);
  console.log(`Output: ${outputDir}`);
  console.log('');

  // Validate input file
  if (!fs.existsSync(inputSvg)) {
    console.error(`❌ Input file not found: ${inputSvg}`);
    process.exit(1);
  }

  // Create output directory if needed
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Read SVG content
  const svgBuffer = fs.readFileSync(inputSvg);

  // Track generated files
  const generated = [];

  // Generate PNGs at all sizes
  console.log('📐 Generating PNG files...');
  for (const size of PNG_SIZES) {
    const outputPath = path.join(outputDir, `icon-${size}.png`);
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    generated.push(`icon-${size}.png`);
    console.log(`   ✓ ${size}x${size}px`);
  }

  // Generate main icon.png at 512px (standard size for electron-builder)
  const mainPngPath = path.join(outputDir, 'icon.png');
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(mainPngPath);
  generated.push('icon.png');
  console.log('   ✓ icon.png (512x512)');

  // Read the 1024px PNG for ICNS/ICO generation
  const png1024Buffer = fs.readFileSync(path.join(outputDir, 'icon-1024.png'));

  // Generate ICNS for macOS
  console.log('\n🍎 Generating ICNS for macOS...');
  try {
    const icnsBuffer = png2icons.createICNS(png1024Buffer, png2icons.BICUBIC2, 0);
    if (icnsBuffer) {
      const icnsPath = path.join(outputDir, 'icon.icns');
      fs.writeFileSync(icnsPath, icnsBuffer);
      generated.push('icon.icns');
      console.log('   ✓ icon.icns');
    } else {
      console.log('   ⚠ ICNS generation returned null');
    }
  } catch (err) {
    console.error(`   ❌ Failed to generate ICNS: ${err.message}`);
  }

  // Generate ICO for Windows
  console.log('\n🪟 Generating ICO for Windows...');
  try {
    const icoBuffer = png2icons.createICO(png1024Buffer, png2icons.BICUBIC2, 0, true);
    if (icoBuffer) {
      const icoPath = path.join(outputDir, 'icon.ico');
      fs.writeFileSync(icoPath, icoBuffer);
      generated.push('icon.ico');
      console.log('   ✓ icon.ico');
    } else {
      console.log('   ⚠ ICO generation returned null');
    }
  } catch (err) {
    console.error(`   ❌ Failed to generate ICO: ${err.message}`);
  }

  // Summary
  console.log('\n✅ Icon generation complete!');
  console.log(`   Generated ${generated.length} files:`);
  generated.forEach(file => console.log(`   - ${file}`));

  return generated;
}

// Main execution
const args = process.argv.slice(2);
const inputSvg = args[0] || DEFAULT_INPUT;
const outputDir = args[1] || DEFAULT_OUTPUT_DIR;

generateIcons(inputSvg, outputDir).catch(err => {
  console.error('❌ Fatal error:', err);
  process.exit(1);
});
