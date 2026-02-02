/**
 * Export Oral Usage to CSV
 * Fetches all oralUsage records from Wix and exports them to a CSV file
 */

import { wixService, OralUsage } from './wixService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Check if a field name indicates a date/datetime value
 */
function isDateField(fieldName: string): boolean {
  const dateFieldPatterns = [
    '_createdDate', '_updatedDate', 'createDate',
  ];
  return dateFieldPatterns.includes(fieldName);
}

/**
 * Format date value to Excel-friendly format
 */
function formatDateValue(value: string): string {
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      // Invalid date, return as-is
      return value;
    }
    // Format as YYYY-MM-DD HH:MM:SS (Excel friendly)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  } catch {
    return value;
  }
}

/**
 * Convert an array of objects to CSV string
 */
function arrayToCsv(data: OralUsage[], headers: string[]): string {
  // Create CSV header
  const csvHeader = headers.join(',');

  // Convert each object to CSV row
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header as keyof OralUsage];

      // Handle undefined or null values
      if (value === undefined || value === null) {
        return '';
      }

      // Handle arrays - convert to JSON string
      if (Array.isArray(value)) {
        const arrayStr = JSON.stringify(value);
        return `"${arrayStr.replace(/"/g, '""')}"`;
      }

      // Special handling for date/datetime fields
      if (isDateField(header)) {
        const formattedDate = formatDateValue(value as string);
        // Don't quote the formatted date unless it contains special characters
        return formattedDate;
      }

      // Handle objects (non-array) - convert to JSON string
      if (typeof value === 'object') {
        const objStr = JSON.stringify(value);
        return `"${objStr.replace(/"/g, '""')}"`;
      }

      // Handle strings
      const stringValue = String(value);



      // Handle strings that contain commas, quotes, or newlines
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }

      return stringValue;
    }).join(',');
  });

  return [csvHeader, ...csvRows].join('\n');
}

/**
 * Main function to fetch and export oralUsage data
 */
async function exportOralUsageToCsv() {
  try {
    console.log('Starting oralUsage export...');
    console.log('Fetching data from Wix...');

    // Fetch all oralUsage records
    const oralUsageData = await wixService.getAllOralUsage();

    if (oralUsageData.length === 0) {
      console.log('No oralUsage records found.');
      return;
    }

    // Get all unique keys from all records as headers
    const headersSet = new Set<string>();
    oralUsageData.forEach(record => {
      Object.keys(record).forEach(key => headersSet.add(key));
    });

    // Sort headers alphabetically for consistent column order
    const headers = Array.from(headersSet).sort();

    console.log(`Found ${oralUsageData.length} records with ${headers.length} columns`);

    // Convert to CSV
    const csvContent = arrayToCsv(oralUsageData, headers);

    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '.cache', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `oralUsage_${timestamp}.csv`;
    const filepath = path.join(outputDir, filename);

    // Write to file
    fs.writeFileSync(filepath, csvContent, 'utf-8');

    console.log(`✓ Successfully exported ${oralUsageData.length} records to ${filepath}`);
    console.log(`✓ Columns (${headers.length}): ${headers.join(', ')}`);

  } catch (error) {
    console.error('✗ Error exporting oralUsage:', error);
    process.exit(1);
  }
}

// Run the export if this file is executed directly
if (require.main === module) {
  exportOralUsageToCsv();
}

export { exportOralUsageToCsv };
