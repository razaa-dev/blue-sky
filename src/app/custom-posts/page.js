// src/app/custom-posts/page.js
'use client'
import { useEffect, useState } from 'react';
import CustomPost from '../components/CustomPost';

export default function CustomPosts() {
  const [postsData, setPostsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/api/custom-posts')
      .then(res => res.json())
      .then(response => {
        if (response.success && response.data) {
          setPostsData(response.data);
        } else {
          setError('No data available');
        }
        setLoading(false);
      })
      .catch(error => {
        console.error('Error:', error);
        setError('Failed to fetch posts');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center p-4">{error}</div>;
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Post Examples by Type</h1>
      
      <div className="grid grid-cols-1 gap-12">
        {postsData.map((category) => (
          <section key={category.type} className="space-y-6">
            <h2 className="text-2xl font-semibold text-gray-800">
              {category.category}
            </h2>
            <div className="grid gap-6">
              {category.posts.map((post) => (
                <CustomPost key={post.uri} post={post} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}