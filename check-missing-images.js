#!/usr/bin/env node

/**
 * Check Missing Programme Images Script
 *
 * This script fetches data from both APIs and identifies which programmes are missing images
 */

const https = require('https');

function fetchData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = '';

        response.on('data', (chunk) => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error(`Failed to parse JSON: ${error.message}`));
          }
        });

        response.on('error', reject);
      })
      .on('error', reject);
  });
}

async function main() {
  console.log('🔍 Checking for missing programme images...\n');

  try {
    // Fetch data from both endpoints
    console.log('📥 Fetching data from mnemo app...');
    const mnemoResponse = await fetchData(
      'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items'
    );

    console.log('📥 Fetching data from Community Jameel...');
    const cjResponse = await fetchData(
      'https://www.communityjameel.org/api/programmes'
    );

    // Handle different response formats
    const mnemoData =
      mnemoResponse.collectionItems ||
      mnemoResponse.data ||
      mnemoResponse ||
      [];
    const cjData = Array.isArray(cjResponse)
      ? cjResponse
      : cjResponse.data || cjResponse.programmes || [];

    console.log('📊 Raw data structure check:');
    console.log('- Mnemo response keys:', Object.keys(mnemoResponse || {}));
    console.log('- CJ response type:', typeof cjResponse);
    console.log('- CJ is array:', Array.isArray(cjResponse));

    // Filter programme items from mnemo data
    const programmes = Array.isArray(mnemoData)
      ? mnemoData.filter((item) => item.type === 'programme')
      : [];

    console.log(`\n📊 Analysis Results:`);
    console.log(
      `- Total items in mnemo: ${Array.isArray(mnemoData) ? mnemoData.length : 'Not an array'}`
    );
    console.log(`- Programme items in mnemo: ${programmes.length}`);
    console.log(
      `- Programmes in Community Jameel: ${Array.isArray(cjData) ? cjData.length : 'Not an array'}`
    );

    // Check for missing images in mnemo programmes
    console.log(`\n🖼️  Image Status in Mnemo Programmes:`);
    let missingImages = [];
    let hasImages = [];

    programmes.forEach((prog) => {
      const hasImage =
        prog.data?.heroImage?.url ||
        prog.data?.thumbnail?.url ||
        prog.data?.heroSquare?.url ||
        prog.data?.heroWide?.url;

      if (hasImage) {
        hasImages.push({
          title: prog.data?.title || prog.title,
          id: prog.id,
          images: {
            heroImage: prog.data?.heroImage?.url || null,
            thumbnail: prog.data?.thumbnail?.url || null,
            heroSquare: prog.data?.heroSquare?.url || null,
            heroWide: prog.data?.heroWide?.url || null
          }
        });
      } else {
        missingImages.push({
          title: prog.data?.title || prog.title,
          id: prog.id,
          slug: prog.data?.slug || prog.slug
        });
      }
    });

    console.log(`✅ Programmes with images: ${hasImages.length}`);
    console.log(`❌ Programmes missing images: ${missingImages.length}`);

    if (missingImages.length > 0) {
      console.log(`\n❌ Programmes Missing Images:`);
      missingImages.forEach((prog, index) => {
        console.log(`${index + 1}. ${prog.title} (ID: ${prog.id})`);
        if (prog.slug) console.log(`   Slug: ${prog.slug}`);
      });
    }

    if (hasImages.length > 0) {
      console.log(`\n✅ Sample Programmes With Images:`);
      hasImages.slice(0, 5).forEach((prog, index) => {
        console.log(`${index + 1}. ${prog.title} (ID: ${prog.id})`);
        Object.entries(prog.images).forEach(([key, url]) => {
          if (url) console.log(`   ${key}: ${url.substring(0, 60)}...`);
        });
      });
    }

    // Check Community Jameel programmes for comparison
    if (Array.isArray(cjData)) {
      console.log(`\n🔍 Community Jameel Programmes with Images:`);
      let cjWithImages = cjData.filter(
        (prog) =>
          prog.hero_image_square || prog.hero_image_wide || prog.hero_image
      );

      console.log(`✅ CJ programmes with images: ${cjWithImages.length}`);
      console.log(
        `❌ CJ programmes without images: ${cjData.length - cjWithImages.length}`
      );

      if (cjWithImages.length > 0) {
        console.log(`\n✅ Sample CJ Programmes With Images:`);
        cjWithImages.slice(0, 3).forEach((prog, index) => {
          console.log(`${index + 1}. ${prog.name}`);
          if (prog.hero_image_square)
            console.log(
              `   Square: ${prog.hero_image_square.substring(0, 60)}...`
            );
          if (prog.hero_image_wide)
            console.log(`   Wide: ${prog.hero_image_wide.substring(0, 60)}...`);
          if (prog.hero_image)
            console.log(`   Hero: ${prog.hero_image.substring(0, 60)}...`);
        });
      }
    } else {
      console.log(`\n⚠️  Community Jameel data is not in expected format`);
      console.log(`CJ Response structure:`, Object.keys(cjResponse || {}));
    }

    console.log(`\n📝 Summary:`);
    console.log(
      `- You may need to migrate/sync images from Community Jameel to Mnemo`
    );
    console.log(
      `- Check if image URLs are correctly mapped during data import`
    );
    console.log(
      `- Verify that image fields are properly populated in the form`
    );
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

main();
