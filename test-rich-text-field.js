// Quick test to verify the issue with the rich text field
// The problem appears to be with how the key prop handles HTML content

// Example data from API (what we confirmed works)
const exampleSummaryFromAPI =
  '<p id=""><a href="https://www.savethechildren.org/" id="">Save the Children</a> and partners announced a $15 million emergency response to support vulnerable children and families affected by the conflict in Lebanon. The funds will provide essential services including emergency shelter, food assistance, clean water, education support, and protection services for children across affected areas.</p>';

// The WebflowRichTextField component uses:
// key={`${name}-${field.value?.length || 0}`}

console.log('Summary content:', exampleSummaryFromAPI);
console.log('Content length:', exampleSummaryFromAPI.length);
console.log('Key would be:', `summary-${exampleSummaryFromAPI.length}`);

// This creates key like: "summary-418"
// When content changes, the key changes, causing remount
// But the rich text editor may not be properly handling the initial HTML content
// especially when it contains complex HTML with links and attributes

console.log(
  'The issue: When the editor remounts due to key change, it needs to properly parse and display the initial HTML content'
);
