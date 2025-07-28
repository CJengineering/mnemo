#!/usr/bin/env node

/**
 * Check for Duplicate Slugs in Posts
 * 
 * This script fetches all posts from the external API and checks for duplicates by slug
 */

const https = require('https');

const MNEMO_API_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app/api/collection-items';

// Fetch data from API
function fetchData(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (error) {
          reject(new Error(`Failed to parse JSON from ${url}: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`Failed to fetch from ${url}: ${error.message}`));
    });
  });
}

async function checkDuplicateSlugs() {
  console.log('🔍 Checking for duplicate slugs in posts...');
  console.log(`📡 Fetching from: ${MNEMO_API_URL}`);
  
  try {
    const response = await fetchData(MNEMO_API_URL);
    const allItems = response.collectionItems || [];
    
    console.log(`📋 Total collection items found: ${allItems.length}`);
    
    // Filter only posts
    const posts = allItems.filter(item => item.type === 'post');
    console.log(`📄 Posts found: ${posts.length}`);
    
    if (posts.length === 0) {
      console.log('⚠️  No posts found to check');
      return;
    }
    
    // Group posts by slug
    const slugGroups = {};
    posts.forEach(post => {
      const slug = post.slug;
      if (!slugGroups[slug]) {
        slugGroups[slug] = [];
      }
      slugGroups[slug].push(post);
    });
    
    // Find duplicates
    const duplicateSlugs = Object.entries(slugGroups).filter(([slug, posts]) => posts.length > 1);
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 DUPLICATE SLUGS REPORT');
    console.log('='.repeat(80));
    
    if (duplicateSlugs.length === 0) {
      console.log('✅ No duplicate slugs found! All posts have unique slugs.');
    } else {
      console.log(`❌ Found ${duplicateSlugs.length} duplicate slug(s):`);
      
      duplicateSlugs.forEach(([slug, duplicatePosts], index) => {
        console.log(`\n${index + 1}. Slug: "${slug}" (${duplicatePosts.length} posts)`);
        
        duplicatePosts.forEach((post, postIndex) => {
          console.log(`   ${postIndex + 1}. ID: ${post.id}`);
          console.log(`      Title: ${post.title || post.data?.title || 'No title'}`);
          console.log(`      Created: ${post.createdAt || 'Unknown'}`);
          console.log(`      Status: ${post.status || 'Unknown'}`);
          if (post.data?.webflowId) {
            console.log(`      Webflow ID: ${post.data.webflowId}`);
          }
          if (post.data?.datePublished) {
            console.log(`      Date Published: ${post.data.datePublished}`);
          }
        });
      });
      
      console.log('\n💡 RECOMMENDATIONS:');
      console.log('1. Review the duplicate posts above');
      console.log('2. Check if they are truly duplicates or if one should have a different slug');
      console.log('3. Consider deleting the unwanted duplicates');
      console.log('4. If keeping both, update one of the slugs to make it unique');
    }
    
    // Show summary statistics
    console.log('\n📊 SUMMARY:');
    console.log(`   Total posts: ${posts.length}`);
    console.log(`   Unique slugs: ${Object.keys(slugGroups).length}`);
    console.log(`   Duplicate slugs: ${duplicateSlugs.length}`);
    console.log(`   Posts with duplicate slugs: ${duplicateSlugs.reduce((sum, [, posts]) => sum + posts.length, 0)}`);
    
    console.log('\n✨ Check completed!');
    console.log('='.repeat(80));
    
    // Save detailed report
    if (duplicateSlugs.length > 0) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportFile = `duplicate-slugs-report-${timestamp}.json`;
      const report = {
        timestamp: new Date().toISOString(),
        totalPosts: posts.length,
        uniqueSlugs: Object.keys(slugGroups).length,
        duplicateSlugsCount: duplicateSlugs.length,
        duplicates: duplicateSlugs.map(([slug, posts]) => ({
          slug,
          count: posts.length,
          posts: posts.map(post => ({
            id: post.id,
            title: post.title || post.data?.title,
            createdAt: post.createdAt,
            status: post.status,
            webflowId: post.data?.webflowId,
            datePublished: post.data?.datePublished
          }))
        }))
      };
      
      const fs = require('fs');
      fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
      console.log(`💾 Detailed report saved: ${reportFile}`);
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the check
checkDuplicateSlugs();
