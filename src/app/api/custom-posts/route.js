// src/app/api/custom-posts/route.js
import axios from 'axios';

const BLUESKY_SERVICE = 'https://bsky.social';
const BLUESKY_USERNAME = process.env.BLUESKY_USERNAME;
const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD;

const POST_TYPES = [
  {
    name: "Image Posts",
    queries: ["photo album", "photography"],
    type: "images"
  },
  {
    name: "Video Content",
    queries: ["video watch", "video post"],
    type: "video"
  },
  {
    name: "YouTube Links",
    queries: ["youtube.com watch"],
    type: "youtube"
  },
  {
    name: "Reposted Content",
    queries: ["RT post"],
    type: "repost"
  }
];

async function getAuthToken() {
  try {
    const response = await axios.post(`${BLUESKY_SERVICE}/xrpc/com.atproto.server.createSession`, {
      identifier: BLUESKY_USERNAME,
      password: BLUESKY_APP_PASSWORD
    });
    return response.data.accessJwt;
  } catch (error) {
    console.error('Auth error:', error.response?.data || error.message);
    throw error;
  }
}

async function fetchBlueskyPosts(query, type, authToken) {
  try {
    const response = await axios.get('https://bsky.social/xrpc/app.bsky.feed.searchPosts', {
      params: {
        q: query,
        limit: 60,
     
      },
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    const posts = response.data.posts || [];
    
    // Filter posts based on type
    return posts.filter(post => {
      switch (type) {
        case 'images':
          return post.embed?.$type === 'app.bsky.embed.images#view';
        case 'video':
          return post.embed?.$type === 'app.bsky.embed.video#view';
        case 'youtube':
          return post.record.text?.includes('youtube.com') || 
                 post.record.text?.includes('youtu.be');
        case 'repost':
          return post.record.$type === 'app.bsky.feed.repost';
        default:
          return true;
      }
    });
  } catch (error) {
    console.error(`Error fetching ${type} posts:`, error);
    return [];
  }
}

export async function GET() {
  try {
    const authToken = await getAuthToken();
    const allPosts = [];

    for (const postType of POST_TYPES) {
      const posts = [];
      
      for (const query of postType.queries) {
        const fetchedPosts = await fetchBlueskyPosts(query, postType.type, authToken);
        posts.push(...fetchedPosts);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      }

      if (posts.length > 0) {
        allPosts.push({
          category: postType.name,
          type: postType.type,
          posts: posts.slice(0, 5) // Limit to 5 posts per category
        });
      }
    }

    return Response.json({
      success: true,
      data: allPosts
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}