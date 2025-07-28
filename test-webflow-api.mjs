/**
 * Test Webflow API to Mnemo Migration
 *
 * This script fetches the first 5 posts from the actual Webflow API
 * and creates them in the Mnemo database using our integrated mapper
 * with CDN upload functionality.
 */

import { promises as fs } from 'fs';
import path from 'path';

// Webflow API Configuration
const WEBFLOW_API_TOKEN =
  'd2eac7bfcd8cc230db56e0dd9f9c7c7f4652db6195ad674c0b7939bb438fb33c';
const WEBFLOW_SITE_ID = '64c04c9d60ed5b6e4e6aa123'; // You'll need to provide this
const WEBFLOW_COLLECTION_ID = '66b8f2e4e8c4a2b1234567'; // You'll need to provide this for your posts collection

// Mnemo API Configuration
const MNEMO_API_BASE = 'http://localhost:3000/api';
const MNEMO_API_TOKEN = 'your-mnemo-api-token'; // You'll need to provide this

/**
 * Fetch collection ID for posts from Webflow
 */
async function getWebflowCollections() {
  try {
    const response = await fetch(
      `https://api.webflow.com/v2/sites/${WEBFLOW_SITE_ID}/collections`,
      {
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
          'accept-version': '1.0.0'
        }
      }
    );

    if (!response.ok) {
      throw new Error(
        `Webflow API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log('📋 Available Webflow Collections:');
    data.collections?.forEach((collection) => {
      console.log(`   - ${collection.displayName} (ID: ${collection.id})`);
    });

    return data.collections;
  } catch (error) {
    console.error('❌ Error fetching Webflow collections:', error);
    throw error;
  }
}

/**
 * Fetch posts from Webflow API
 */
async function fetchWebflowPosts(collectionId, limit = 5) {
  try {
    console.log(`🔍 Fetching ${limit} posts from Webflow API...`);

    const response = await fetch(
      `https://api.webflow.com/v2/collections/${collectionId}/items?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${WEBFLOW_API_TOKEN}`,
          'accept-version': '1.0.0'
        }
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Webflow API error: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const data = await response.json();
    console.log(
      `✅ Successfully fetched ${data.items?.length || 0} posts from Webflow`
    );

    // Save raw response for debugging
    await fs.writeFile(
      path.join(
        process.cwd(),
        `webflow-api-response-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
      ),
      JSON.stringify(data, null, 2)
    );

    return data.items || [];
  } catch (error) {
    console.error('❌ Error fetching Webflow posts:', error);
    throw error;
  }
}

/**
 * Create post in Mnemo using our mapper
 */
async function createPostInMnemo(webflowPost) {
  try {
    // Import our mapper function
    const { postWebflowMapperToMnemoData } = await import(
      './lib/mappers/postWebflowMapperToMnemoData.js'
    );

    console.log(
      `📝 Mapping Webflow post: "${webflowPost.fieldData?.name || webflowPost.id}"`
    );

    // Map with CDN upload enabled
    const mappedPost = await postWebflowMapperToMnemoData(
      webflowPost,
      true, // Enable CDN upload
      'posts', // Collection name
      {
        // CDN configuration for Community Jameel
        bucket: 'mnemo',
        projectId: 'cj-tech-381914',
        basePath: 'website/collection'
      }
    );

    console.log(`✅ Successfully mapped post with CDN uploads`);

    // Create in Mnemo database
    console.log(`🚀 Creating post in Mnemo database...`);

    const response = await fetch(`${MNEMO_API_BASE}/collection-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Add authorization if needed
        // 'Authorization': `Bearer ${MNEMO_API_TOKEN}`
      },
      body: JSON.stringify(mappedPost)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Mnemo API error: ${response.status} ${response.statusText}\n${errorText}`
      );
    }

    const createdPost = await response.json();
    console.log(
      `✅ Successfully created post in Mnemo: "${createdPost.title}"`
    );

    return {
      success: true,
      webflowId: webflowPost.id,
      mnemoId: createdPost.id,
      title: createdPost.title,
      slug: createdPost.slug,
      mapped: mappedPost,
      created: createdPost
    };
  } catch (error) {
    console.error(`❌ Error creating post in Mnemo:`, error);
    return {
      success: false,
      webflowId: webflowPost.id,
      title: webflowPost.fieldData?.name || 'Unknown',
      error: error.message
    };
  }
}

/**
 * Test the complete migration pipeline
 */
async function testWebflowToMnemoMigration() {
  console.log('🎯 WEBFLOW API TO MNEMO MIGRATION TEST');
  console.log('='.repeat(70));
  console.log(
    `Using Webflow API Token: ${WEBFLOW_API_TOKEN.substring(0, 20)}...`
  );
  console.log(`Target: First 5 posts with CDN upload\n`);

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    posts: [],
    errors: []
  };

  try {
    // Step 1: Get available collections
    console.log('📋 Step 1: Discovering Webflow collections...');
    const collections = await getWebflowCollections();

    // Find posts/blog collection (you may need to adjust this logic)
    const postsCollection = collections?.find(
      (c) =>
        c.displayName?.toLowerCase().includes('post') ||
        c.displayName?.toLowerCase().includes('blog') ||
        c.displayName?.toLowerCase().includes('news') ||
        c.slug?.includes('post')
    );

    if (!postsCollection) {
      console.log('\n❗ Could not automatically find posts collection.');
      console.log(
        'Please update WEBFLOW_COLLECTION_ID in the script with the correct collection ID.'
      );
      console.log('Available collections listed above.');
      return;
    }

    console.log(
      `✅ Found posts collection: "${postsCollection.displayName}" (${postsCollection.id})`
    );

    // Step 2: Fetch posts from Webflow
    console.log('\n📥 Step 2: Fetching posts from Webflow API...');
    const webflowPosts = await fetchWebflowPosts(postsCollection.id, 5);

    if (!webflowPosts.length) {
      console.log('❗ No posts found in Webflow collection');
      return;
    }

    results.total = webflowPosts.length;
    console.log(`✅ Retrieved ${webflowPosts.length} posts from Webflow`);

    // Step 3: Process each post
    console.log('\n🔄 Step 3: Processing posts through migration pipeline...');

    for (let i = 0; i < webflowPosts.length; i++) {
      const post = webflowPosts[i];
      console.log(`\n--- Processing Post ${i + 1}/${webflowPosts.length} ---`);

      const result = await createPostInMnemo(post);
      results.posts.push(result);

      if (result.success) {
        results.successful++;
        console.log(`✅ Post ${i + 1} completed successfully`);
      } else {
        results.failed++;
        results.errors.push(result.error);
        console.log(`❌ Post ${i + 1} failed: ${result.error}`);
      }

      // Add delay between requests to be respectful to APIs
      if (i < webflowPosts.length - 1) {
        console.log('⏳ Waiting 2 seconds before next post...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    // Step 4: Generate report
    console.log('\n📊 Step 4: Generating migration report...');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportPath = `webflow-api-migration-report-${timestamp}.json`;

    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: results.total,
        successful: results.successful,
        failed: results.failed,
        successRate: `${((results.successful / results.total) * 100).toFixed(1)}%`
      },
      webflowAPI: {
        token: `${WEBFLOW_API_TOKEN.substring(0, 20)}...`,
        collectionId: postsCollection.id,
        collectionName: postsCollection.displayName
      },
      mnemoAPI: {
        endpoint: MNEMO_API_BASE,
        cdnEnabled: true,
        cdnConfig: {
          bucket: 'mnemo',
          projectId: 'cj-tech-381914',
          basePath: 'website/collection'
        }
      },
      posts: results.posts,
      errors: results.errors
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    // Final summary
    console.log('\n🎉 MIGRATION COMPLETE!');
    console.log('='.repeat(50));
    console.log(
      `✅ Successfully migrated: ${results.successful}/${results.total} posts`
    );
    console.log(
      `❌ Failed migrations: ${results.failed}/${results.total} posts`
    );
    console.log(
      `📊 Success rate: ${((results.successful / results.total) * 100).toFixed(1)}%`
    );
    console.log(`📁 Report saved: ${reportPath}`);

    if (results.successful > 0) {
      console.log('\n📋 Successfully Created Posts:');
      results.posts
        .filter((p) => p.success)
        .forEach((post, index) => {
          console.log(`   ${index + 1}. "${post.title}" (${post.slug})`);
          console.log(`      Webflow ID: ${post.webflowId}`);
          console.log(`      Mnemo ID: ${post.mnemoId}`);
        });
    }

    if (results.failed > 0) {
      console.log('\n❌ Failed Posts:');
      results.posts
        .filter((p) => !p.success)
        .forEach((post, index) => {
          console.log(`   ${index + 1}. "${post.title}"`);
          console.log(`      Error: ${post.error}`);
        });
    }

    console.log('\n🔗 Next Steps:');
    console.log(
      '   1. Review created posts at http://localhost:3000/collections'
    );
    console.log('   2. Verify CDN image uploads in Google Cloud Storage');
    console.log(
      '   3. Check that all relationships and metadata are preserved'
    );
    console.log('   4. Test bilingual content display');
    console.log('   5. If successful, proceed with full migration');
  } catch (error) {
    console.error('\n💥 MIGRATION FAILED:', error);
    results.errors.push(error.message);

    // Save error report
    const errorReport = {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      results: results
    };

    const errorReportPath = `webflow-api-migration-error-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    await fs.writeFile(errorReportPath, JSON.stringify(errorReport, null, 2));
    console.log(`📁 Error report saved: ${errorReportPath}`);
  }
}

// Run the test
testWebflowToMnemoMigration().catch(console.error);
