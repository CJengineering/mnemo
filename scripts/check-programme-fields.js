#!/usr/bin/env node

/**
 * Simple script to check programme fields structure
 * Just logs the first few programmes to see available fields
 */

// Configuration
const API_BASE_URL = 'https://mnemo-app-e4f6j5kdsq-ew.a.run.app';

/**
 * Fetch programmes and analyze field structure
 */
async function analyzeProgrammeFields() {
  try {
    console.log('🔍 Fetching programmes to analyze field structure...\n');

    const response = await fetch(`${API_BASE_URL}/api/collection-items?type=programme`);
    
    if (!response.ok) {
      console.error(`❌ Failed to fetch programmes: ${response.status}`);
      return;
    }

    const data = await response.json();
    const programmes = data.items || data.collectionItems || [];
    
    console.log(`✅ Found ${programmes.length} programmes\n`);
    
    if (programmes.length === 0) {
      console.log('No programmes found');
      return;
    }

    // Analyze first few programmes
    const samplesToCheck = Math.min(3, programmes.length);
    
    console.log('📊 PROGRAMME FIELD STRUCTURE ANALYSIS');
    console.log('=====================================\n');
    
    // Collect all unique fields from all programmes
    const allFields = new Set();
    
    for (let i = 0; i < samplesToCheck; i++) {
      const programme = programmes[i];
      const data = programme.data || programme;
      const title = data.title || data.name || `Programme ${i + 1}`;
      
      console.log(`📋 Programme ${i + 1}: ${title}`);
      console.log(`   Fields (${Object.keys(data).length}):`, Object.keys(data).sort());
      console.log('');
      
      // Add to all fields set
      Object.keys(data).forEach(field => allFields.add(field));
    }
    
    console.log('🔍 ALL UNIQUE FIELDS ACROSS PROGRAMMES:');
    console.log('=======================================');
    const sortedFields = Array.from(allFields).sort();
    console.log(`Total unique fields: ${sortedFields.length}`);
    console.log('Fields:', sortedFields);
    console.log('');
    
    // Check which fields might be missing from our form
    const currentFormFields = [
      'title', 'slug', 'status', 'description', 'type',
      'nameArabic', 'shortNameEnglish', 'shortNameArabic',
      'missionEnglish', 'missionArabic', 
      'summaryEnglish', 'summaryArabic',
      'researchEnglish', 'researchArabic',
      'yearEstablished', 'yearClosed', 'order',
      'headquartersEnglish', 'headquartersArabic',
      'latitude', 'longitude',
      'logoSvgDark', 'logoSvgLight', 'heroSquare', 'heroWide',
      'website', 'linkedin', 'instagram', 'twitter',
      'features', 'partners', 'leadership', 'relatedProgrammes',
      'lab', 'pushToGR'
    ];
    
    const apiFields = Array.from(allFields);
    const missingInForm = apiFields.filter(field => !currentFormFields.includes(field));
    const extraInForm = currentFormFields.filter(field => !apiFields.includes(field));
    
    console.log('❓ FIELD COMPARISON:');
    console.log('==================');
    console.log(`📝 Current form has: ${currentFormFields.length} fields`);
    console.log(`🌐 API data has: ${apiFields.length} unique fields`);
    console.log('');
    console.log('❌ Missing from form (in API but not in form):');
    console.log(missingInForm.length > 0 ? missingInForm : '   None');
    console.log('');
    console.log('➕ Extra in form (in form but not in API):');
    console.log(extraInForm.length > 0 ? extraInForm : '   None');
    console.log('');
    
    // Show detailed sample data
    console.log('📄 DETAILED SAMPLE DATA:');
    console.log('========================');
    
    const sampleProgramme = programmes[0];
    const sampleData = sampleProgramme.data || sampleProgramme;
    
    console.log('Sample programme data structure:');
    Object.keys(sampleData).sort().forEach(field => {
      const value = sampleData[field];
      let valuePreview = '';
      
      if (typeof value === 'string') {
        valuePreview = `"${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`;
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          valuePreview = `array[${value.length}]`;
        } else {
          valuePreview = `{${Object.keys(value).join(', ')}}`;
        }
      } else {
        valuePreview = String(value);
      }
      
      console.log(`   ${field}: ${valuePreview}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the analysis
analyzeProgrammeFields();
