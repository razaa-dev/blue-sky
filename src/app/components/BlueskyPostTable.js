import CustomPost from './CustomPost';

export default function BlueskyPostTable({ posts = [] }) {
  if (!Array.isArray(posts) || posts.length === 0) {
    return <div className="text-center p-4">No posts available</div>;
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Custom Posts */}
      <div className="space-y-6">
        {posts.map((currencyData) => (
          <div key={`custom-${currencyData.currency}`} className="space-y-4">
            <h3 className="text-lg font-medium text-gray-700">{currencyData.currency}</h3>
            {currencyData.posts.map((post) => (
              <CustomPost key={post.uri} post={post} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}