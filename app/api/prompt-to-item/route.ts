import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { type, prompt, existingData } = await request.json();

    // This is a mock AI generation endpoint
    // In a real implementation, you would integrate with OpenAI, Claude, or another AI service

    const generateMockData = (type: string, prompt: string) => {
      // Extract key information from the prompt
      const titleMatch = prompt.match(/(?:about|create|for)\s+([^,\.]+)/i);
      const suggestedTitle = titleMatch
        ? titleMatch[1].trim()
        : `AI Generated ${type}`;

      const baseData = {
        title: suggestedTitle,
        description: `AI-generated description based on: "${prompt}". This would be much more comprehensive and relevant in a real AI implementation with proper natural language processing.`,
        tags: ['ai-generated', type, 'sample'],
        content: `# ${suggestedTitle}\n\n*Generated from prompt: "${prompt}"*\n\nThis is AI-generated content that demonstrates how natural language prompts would be processed to create structured content.\n\n## Overview\n\nBased on your description, this ${type} addresses key aspects mentioned in your prompt.\n\n## Key Details\n\n- Automatically extracted relevant information\n- Generated appropriate fields for ${type} type\n- Structured content ready for editing\n\n## Next Steps\n\nReview and edit the generated content to match your specific requirements.`
      };

      // Add type-specific fields based on prompt analysis
      switch (type) {
        case 'event':
          return {
            ...baseData,
            eventDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0], // 7 days from now
            time: '14:00',
            city: 'Sample City',
            address: '123 Sample Street, Sample City',
            featured: false
          };

        case 'news':
          return {
            ...baseData,
            publishDate: new Date().toISOString().split('T')[0],
            author: 'AI Assistant',
            category: 'Technology',
            excerpt: 'A brief excerpt generated for this news article.',
            featured: false
          };

        case 'team':
          return {
            ...baseData,
            position: 'AI Generated Position',
            department: 'Sample Department',
            bio: 'This is a generated biography for a team member. It would include relevant experience and background.',
            email: 'sample@example.com'
          };

        case 'publication':
          return {
            ...baseData,
            authors: ['AI Assistant', 'Sample Author'],
            publicationDate: new Date().toISOString().split('T')[0],
            journal: 'Sample Journal',
            abstract: 'This is a generated abstract for the publication.',
            keywords: ['research', 'ai', 'sample']
          };

        case 'award':
          return {
            ...baseData,
            awardDate: new Date().toISOString().split('T')[0],
            recipient: 'Sample Recipient',
            category: 'Excellence',
            amount: '$10,000',
            criteria: 'Outstanding achievement in the field'
          };

        case 'programme':
          return {
            ...baseData,
            duration: '6 months',
            applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0],
            eligibility: 'Open to all qualified candidates',
            benefits:
              'Comprehensive learning experience and networking opportunities'
          };

        case 'innovation':
          return {
            ...baseData,
            innovationType: 'Technology',
            sector: 'Healthcare',
            stage: 'Development',
            impact: 'High potential for positive social impact',
            technologies: ['AI', 'Machine Learning', 'IoT']
          };

        case 'prize':
          return {
            ...baseData,
            prizeDate: new Date().toISOString().split('T')[0],
            winner: 'Sample Winner',
            category: 'Innovation',
            amount: '$5,000',
            criteria: 'Most innovative solution'
          };

        case 'partner':
          return {
            ...baseData,
            partnerType: 'Strategic',
            website: 'https://example.com',
            contactPerson: 'John Doe',
            email: 'contact@example.com',
            partnershipDate: new Date().toISOString().split('T')[0]
          };

        case 'source':
          return {
            ...baseData,
            sourceType: 'Research',
            url: 'https://example.com/source',
            author: 'Research Team',
            sourceDate: new Date().toISOString().split('T')[0],
            credibility: 'High'
          };

        default:
          return baseData;
      }
    };

    const generatedData = generateMockData(type, prompt);

    // Merge with existing data, prioritizing new generated content
    const mergedData = { ...existingData, ...generatedData };

    return NextResponse.json(mergedData);
  } catch (error) {
    console.error('Error in prompt-to-item API:', error);
    return NextResponse.json(
      { error: 'Failed to generate content' },
      { status: 500 }
    );
  }
}
