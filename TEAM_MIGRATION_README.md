# Team Images Migration Script

This script migrates team member images from Webflow's CDN to your Google Cloud Storage bucket.

## Prerequisites

1. **Environment Setup**: Make sure your `PRIVATE_GCL` environment variable is set with your Google Cloud credentials
2. **Node.js**: Ensure you have Node.js installed
3. **Dependencies**: The script uses `@google-cloud/storage` which should already be installed in your project

## Usage

### 1. Prepare Your Data File

Your JSON file should contain an array of team members with this structure:

```json
[
  {
    "id": "unique-id",
    "fieldData": {
      "name": "Team Member Name",
      "slug": "optional-slug", // If not provided, will be auto-generated from name
      "role": "Their Role",
      "bio": "Their bio text",
      "image_url": "https://uploads-ssl.webflow.com/path/to/image.jpg"
    }
  }
]
```

### 2. Run the Migration

```bash
# Make the script executable (optional)
chmod +x migrate-team-images.js

# Run with your team data file
node migrate-team-images.js your-team-data.json

# Or run with the example file
node migrate-team-images.js example-team-data.json
```

### 3. What the Script Does

The script will:

1. **Download** each image from the `image_url` in your JSON
2. **Upload** to Google Cloud Storage in the path: `website/collection/team/[slug]/[original-filename]`
3. **Update** the `image_url` field with the new CDN URL: `https://cdn.communityjameel.io/website/collection/team/[slug]/[filename]`
4. **Generate** multiple output files:
   - `*_migrated.json` - Clean JSON with updated URLs (ready for database import)
   - `*_backup.json` - Backup of original data
   - `*_migration_report.json` - Detailed migration report with success/failure info

### 4. Features

- **Concurrency Control**: Processes 5 images at a time to avoid overwhelming servers
- **Error Handling**: Continues processing even if some images fail
- **Progress Tracking**: Shows detailed progress for each team member
- **Slug Generation**: Auto-generates slugs from names if not provided
- **File Preservation**: Keeps original filenames
- **Comprehensive Reporting**: Detailed success/failure reports

### 5. Example Output Structure

Images will be organized in Google Cloud Storage like this:

```
website/
  collection/
    team/
      sarah-johnson/
        sarah-johnson.jpg
      ahmed-al-rashid/
        ahmed-al-rashid.png
      maria-rodriguez/
        maria-rodriguez.webp
```

### 6. Sample Console Output

```
🚀 Starting team images migration...
📂 Input file: rawDataTeams.json
☁️  Target bucket: mnemo
🌐 CDN base URL: https://cdn.communityjameel.io
⚡ Concurrency limit: 5

📋 Loaded 25 team members

🚀 Processing batch 1/5

🔄 Processing [1/25]: Dr. Sarah Johnson
  📥 Downloading: https://uploads-ssl.webflow.com/.../sarah-johnson.jpg
  📤 Uploading to: website/collection/team/sarah-johnson/sarah-johnson.jpg
  ✅ Success: https://cdn.communityjameel.io/website/collection/team/sarah-johnson/sarah-johnson.jpg

============================================================
📊 MIGRATION REPORT
============================================================
Total processed: 25
✅ Successful: 23
❌ Failed: 1
⚠️  Skipped: 1

✨ Migration completed!
============================================================

💾 Backup created: rawDataTeams_backup.json
📝 Migrated data saved: rawDataTeams_migrated.json
📊 Detailed report saved: rawDataTeams_migration_report.json
```

### 7. Troubleshooting

- **Missing PRIVATE_GCL**: Make sure your Google Cloud credentials environment variable is set
- **Download failures**: Check if the Webflow URLs are still valid
- **Upload failures**: Verify your Google Cloud Storage permissions
- **Invalid filenames**: The script handles most URL formats automatically

### 8. Safety Features

- **Automatic backup** of original data
- **Detailed error logging** for failed migrations
- **Continues processing** even if individual items fail
- **Comprehensive reporting** for audit trails
- **No data loss** - original data is preserved

The script is designed to be safe to run multiple times - it will simply re-process the images if needed.
