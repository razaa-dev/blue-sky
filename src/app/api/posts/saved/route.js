import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join('/tmp', 'bluesky-posts.json');

    // Check if the file exists
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);

    return Response.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error reading file:', error);
    return Response.json({
      success: false,
      error: 'Failed to read saved posts',
    }, { status: 500 });
  }
}
// import { promises as fs } from 'fs';
// import path from 'path';

// export async function GET() {
//   try {
//     const projectRoot = process.cwd();
//     const filePath = path.join(projectRoot, 'data', 'bluesky-posts.json');
    
//     const fileContent = await fs.readFile(filePath, 'utf-8');
//     const data = JSON.parse(fileContent);

//     return Response.json({
//       success: true,
//       data: data
//     });
//   } catch (error) {
//     return Response.json({
//       success: false,
//       error: 'Failed to read saved posts'
//     }, { status: 500 });
//   }
// } 