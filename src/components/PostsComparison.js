import Image from 'next/image';

export default function PostsComparison({ postsData }) {
  return (
    <div className="space-y-8">
      {postsData.map((currencyData, index) => (
        <div key={index} className="space-y-4">
          <h2 className="text-2xl font-bold">{currencyData.currency}</h2>
          <div className="space-y-4">
            {currencyData.posts.map((post, postIndex) => (
              <PostCard key={postIndex} post={post} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function PostCard({ post }) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      <div className="flex items-start space-x-3">
        {post.author.avatar && (
          <Image
            src={post.author.avatar}
            alt={post.author.displayName || post.author.handle}
            width={48}
            height={48}
            className="rounded-full"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">
              {post.author.displayName || post.author.handle}
            </span>
            <span className="text-gray-500">@{post.author.handle}</span>
          </div>
          <p className="mt-2 text-gray-800">{post.record.text}</p>
          
          {/* Handle embedded content */}
          {post.embed && <EmbeddedContent embed={post.embed} />}
          
          <div className="flex space-x-4 mt-3 text-gray-500">
            <span>💬 {post.replyCount}</span>
            <span>🔄 {post.repostCount}</span>
            <span>❤️ {post.likeCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmbeddedContent({ embed }) {
  if (!embed) return null;

  switch (embed.$type) {
    case 'app.bsky.embed.images#view':
      return (
        <div className="mt-3 grid gap-2 grid-cols-1 sm:grid-cols-2">
          {embed.images.map((image, index) => (
            <div key={index} className="relative">
              <Image
                src={image.fullsize}
                alt={image.alt || ''}
                width={500}
                height={300}
                className="rounded-lg object-cover"
                unoptimized={true}
              />
            </div>
          ))}
        </div>
      );

    case 'app.bsky.embed.external#view':
      return (
        <a
          href={embed.external.uri}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block border rounded-lg p-4 hover:bg-gray-50"
        >
          {embed.external.thumb && (
            <div className="relative h-48 mb-2">
              <Image
                src={embed.external.thumb}
                alt={embed.external.title || ''}
                fill
                className="rounded-lg object-cover"
                unoptimized={true}
              />
            </div>
          )}
          <h3 className="font-bold">{embed.external.title}</h3>
          <p className="text-gray-600 text-sm">{embed.external.description}</p>
        </a>
      );

    case 'app.bsky.embed.record#view':
      return (
        <div className="mt-3 border rounded-lg p-4 bg-gray-50">
          <div className="flex items-center space-x-2">
            {embed.record.author?.avatar && (
              <Image
                src={embed.record.author.avatar}
                alt={embed.record.author.displayName || ''}
                width={32}
                height={32}
                className="rounded-full"
                unoptimized={true}
              />
            )}
            <span className="font-semibold">
              {embed.record.author?.displayName || embed.record.author?.handle}
            </span>
          </div>
          <p className="mt-2 text-gray-600">{embed.record.value?.text}</p>
        </div>
      );

    default:
      return null;
  }
}