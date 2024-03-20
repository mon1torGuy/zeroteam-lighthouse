import fs from 'fs';
import { exec } from 'child_process';
import fetch from 'node-fetch';

// Function to escape special characters in a string
function escapeString(str) {
  return str.replace(/[^a-zA-Z0-9]/g, '_');
}

// Function to get the final URL after following redirects
async function getFinalUrl(url) {
  try {
    const response = await fetch(url);
    if (response.ok) {
      return response.url;
    } else {
      console.error(`Error fetching ${url}: ${response.status} ${response.statusText}`);
      return null;
    }
  } catch (error) {
    console.error(`Error fetching ${url}:`, error);
    return null;
  }
}

// Function to run Lighthouse audit for a website
async function runLighthouseAudit(websites, index) {
  if (index >= websites.length) {
    console.log('All Lighthouse audits completed.');
    return;
  }

  const { name, website_url } = websites[index];
  const finalUrl = await getFinalUrl(website_url);

  if (finalUrl) {
    const escapedName = escapeString(name);
    const command = `lighthouse "${finalUrl}" --output=json --output-path="./reports/report_${escapedName}.json"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error running Lighthouse for ${name}:`, error);
      } else {
        console.log(`Lighthouse report generated for ${name}`);
      }

      // Run Lighthouse audit for the next website
      runLighthouseAudit(websites, index + 1);
    });
  } else {
    console.error(`Skipping Lighthouse audit for ${name} due to invalid URL.`);
    // Run Lighthouse audit for the next website
    runLighthouseAudit(websites, index + 1);
  }
}

// Read the websites.json file
fs.readFile('websites.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading websites.json:', err);
    return;
  }

  try {
    const websites = JSON.parse(data);

    // Start running Lighthouse audits
    runLighthouseAudit(websites, 0);
  } catch (error) {
    console.error('Error parsing websites.json:', error);
  }
});