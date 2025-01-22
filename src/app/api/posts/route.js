import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
// Bluesky API credentials
const BLUESKY_SERVICE = 'https://bsky.social';
const BLUESKY_USERNAME = process.env.BLUESKY_USERNAME;
const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD;

// Specific currencies we want to track
const CURRENCIES = [
  { name: "Bitcoin", symbol: "BTC" },
  { name: "XRP", symbol: "XRP" },
  { name: "Dogecoin", symbol: "DOGE" }
];

// Function to get Bluesky auth token
async function getAuthToken() {
  try {
    console.log('Attempting to get auth token...');
    const response = await axios.post(`${BLUESKY_SERVICE}/xrpc/com.atproto.server.createSession`, {
      identifier: BLUESKY_USERNAME,
      password: BLUESKY_APP_PASSWORD
    });
    console.log('Auth token received successfully');
    return response.data.accessJwt;
  } catch (error) {
    console.error('Error getting auth token:', error.response?.data || error.message);
    throw error;
  }
}

// Function to fetch Bluesky posts
async function fetchBlueskyPosts(query, authToken) {
  try {
    console.log(`Fetching posts for query: ${query}`);
    const response = await axios.get('https://bsky.social/xrpc/app.bsky.feed.searchPosts', {
      params: {
        q: query,
        limit: 60,
        sort: 'latest' 
         },
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });
    console.log(`Found ${response.data.posts?.length || 0} posts for ${query}`);
    return response.data.posts || [];
  } catch (error) {
    console.error(`Error fetching posts for ${query}:`, error.response?.data || error.message);
    return [];
  }
}

async function saveToJsonFile(data) {
  try {
    // Determine the temporary directory based on the environment
    const tmpDir = process.platform === 'win32' ? path.join(os.tmpdir()) : '/tmp';
    const filePath = path.join(tmpDir, 'bluesky-posts.json');

    // Write data to the file
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(`Saved results to ${filePath}`);
    return filePath;
  } catch (error) {
    console.error('Error saving to JSON file:', error);
    throw error;
  }
}
// Function to save data to JSON file
// async function saveToJsonFile(data) {
//   try {
//     // Get the project root directory
//     const projectRoot = process.cwd();
    
//     // Create data directory if it doesn't exist
//     const dataDir = path.join(projectRoot, 'data');
//     try {
//       await fs.mkdir(dataDir, { recursive: true });
//     } catch (err) {
//       if (err.code !== 'EEXIST') throw err;
//     }

//     // Save to JSON file
//     const filePath = path.join(dataDir, 'bluesky-posts.json');
//     await fs.writeFile(
//       filePath,
//       JSON.stringify(data, null, 2)
//     );
//     console.log(`Saved results to ${filePath}`);
//     return filePath;
//   } catch (error) {
//     console.error('Error saving to JSON file:', error);
//     throw error;
//   }
// }

export async function GET() {
  try {
    console.log('Starting fetch-posts request...');
    const authToken = await getAuthToken();
    const allPosts = [];

    console.log(`Processing ${CURRENCIES.length} currencies...`);
    for (const currency of CURRENCIES) {
      console.log(`Processing currency: ${currency.name}`);
      const posts = await fetchBlueskyPosts(currency.name, authToken);
      if (posts.length > 0) {
        allPosts.push({
          currency: currency.name,
          posts: posts
        });
        console.log(`Added ${posts.length} posts for ${currency.name}`);
      }
      // Add a small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Save the data to a JSON file
    const savedFilePath = await saveToJsonFile(allPosts);

    return Response.json({ 
      success: true, 
      message: 'Posts fetched and saved successfully',
      postsCount: allPosts.length,
      filePath: savedFilePath,
      data: allPosts
    });
  } catch (error) {
    console.error('Error in fetch-posts route:', error);
    return Response.json({ 
      success: false, 
      error: error.message,
      details: error.response?.data
    }, { status: 500 });
  }
}