const { drizzle } = require('drizzle-orm/postgres-js');
const postgres = require('postgres');
const { collectionItem } = require('./lib/db');
const { eq } = require('drizzle-orm');

async function checkDatabase() {
  try {
    const client = postgres(process.env.LOCAL_POSTGRES_URL);
    const db = drizzle(client);
    
    // Get the most recent post to see its data
    const posts = await db.select().from(collectionItem).where(eq(collectionItem.type, 'post')).limit(1);
    
    if (posts.length > 0) {
      console.log('🔍 Found post:', posts[0].title);
      console.log('📊 Data structure keys:', Object.keys(posts[0].data || {}));
      
      // Check specifically for bodyEnglish
      if (posts[0].data && posts[0].data.bodyEnglish) {
        console.log('✅ bodyEnglish found! Length:', posts[0].data.bodyEnglish.length);
        console.log('📝 bodyEnglish preview:', posts[0].data.bodyEnglish.substring(0, 200) + '...');
      } else {
        console.log('❌ bodyEnglish NOT found in data field');
      }
      
      if (posts[0].data && posts[0].data.bodyArabic) {
        console.log('✅ bodyArabic found! Length:', posts[0].data.bodyArabic.length);
      } else {
        console.log('❌ bodyArabic NOT found in data field');
      }
      
      console.log('\n📋 Full data structure:');
      console.log(JSON.stringify(posts[0].data, null, 2));
    } else {
      console.log('⚠️ No posts found in database');
    }
    
    await client.end();
  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkDatabase();
