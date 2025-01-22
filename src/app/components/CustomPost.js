'use client';
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Share2, BookmarkPlus, Flag, MessageSquare } from 'lucide-react';
import Hls from "hls.js";

// Modal Component
const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        {children}
        <button 
          onClick={onClose}
          className="mt-4 w-full bg-gray-900 text-white rounded-md py-2 hover:bg-gray-800 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export function CustomPost({ post }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount || 0);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const shortUrlPattern = /youtu\.be\/([a-zA-Z0-9_-]+)/;
    const longUrlPattern = /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
    const shortMatch = url.match(shortUrlPattern);
    const longMatch = url.match(longUrlPattern);
    return shortMatch?.[1] || longMatch?.[1] || null;
  };

  const renderText = (text) => {
    if (!text) return null;

    const patterns = {
      url: /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g,
      youtube: /(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)(\S*)/g,
      hashtag: /#[\w]+/g,
      mention: /@[\w.]+/g,
      email: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi,
    };

    const segments = text.split(/(\s+|\n+|(?=https?:\/\/)|(?<=\s)(?=[#@]))/);

    return segments.map((segment, index) => {
      if (segment.match(patterns.youtube)) {
        const videoId = getYouTubeVideoId(segment);
        return (
          <a 
            key={index}
            href={`https://youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {segment}
          </a>
        );
      }

      if (segment.match(patterns.url)) {
        return (
          <a 
            key={index}
            href={segment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {segment}
          </a>
        );
      }

      if (segment.match(patterns.hashtag)) {
        return (
          <a 
            key={index}
            href={`https://bsky.app/search?q=${encodeURIComponent(segment)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {segment}
          </a>
        );
      }

      if (segment.match(patterns.mention)) {
        const handle = segment.slice(1);
        return (
          <a 
            key={index}
            href={`https://bsky.app/profile/${handle}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline"
          >
            {segment}
          </a>
        );
      }

      if (segment.match(patterns.email)) {
        return (
          <a 
            key={index}
            href={`mailto:${segment}`}
            className="text-blue-600 hover:underline break-all"
          >
            {segment}
          </a>
        );
      }

      if (segment === '\n') {
        return <br key={index} />;
      }

      return segment;
    });
  };

  const renderVideo = () => {
    const videoRef = React.useRef(null);

    React.useEffect(() => {
      let hls;

      if (post.embed?.playlist && videoRef.current) {
        const isHls = post.embed.playlist.endsWith('.m3u8');

        if (isHls && Hls.isSupported()) {
          hls = new Hls();
          hls.loadSource(post.embed.playlist);
          hls.attachMedia(videoRef.current);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setIsVideoLoaded(true);
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = post.embed.playlist;
          videoRef.current.addEventListener('loadeddata', () => {
            setIsVideoLoaded(true);
          });
        }
      }

      return () => {
        if (hls) {
          hls.destroy();
        }
      };
    }, [post.embed?.playlist]);

    if (post.embed?.$type === 'app.bsky.embed.video#view') {
      return (
        <div className="mt-3 relative">
          {!isVideoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          <video
            ref={videoRef}
            controls
            playsInline
            className="w-full rounded-lg max-h-[500px] bg-black"
            poster={post.embed.thumbnail}
            style={{
              aspectRatio: `${post.embed.aspectRatio.width}/${post.embed.aspectRatio.height}`,
            }}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }
    return null;
  };

  const renderEmbeddedImages = () => {
    if (post.embed?.$type === 'app.bsky.embed.images#view' && post.embed.images?.length > 0) {
      return (
        <div className={`mt-3 grid gap-2 ${post.embed.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.embed.images.map((img, index) => (
            <img
              key={index}
              src={img.fullsize || img.thumb}
              alt={img.alt || 'Post image'}
              className="rounded-lg w-full object-cover"
              style={{ maxHeight: post.embed.images.length > 1 ? '250px' : '500px' }}
              loading="lazy"
              onError={(e) => (e.target.style.display = 'none')}
            />
          ))}
        </div>
      );
    }
    return null;
  };

  const renderExternalEmbed = () => {
    if (post.record.embed?.external) {
      const { uri, title, description, thumb } = post.record.embed.external;

      const videoId = getYouTubeVideoId(uri);
      if (videoId) {
        return (
          <div className="mt-3">
            <iframe
              className="w-full aspect-video rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        );
      }

      return (
        <a
          href={uri}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block border rounded-lg overflow-hidden hover:bg-gray-50"
        >
          {thumb && (
            <img
              src={thumb}
              alt={title || "External content"}
              className="w-full h-48 object-cover"
              onError={(e) => (e.target.style.display = 'none')}
            />
          )}
          <div className="p-3">
            <h4 className="font-medium">{title}</h4>
            {description && <p className="text-gray-600 text-sm mt-1">{description}</p>}
          </div>
        </a>
      );
    }
    return null;
  };

  const renderQuote = () => {
    if (post.embed?.$type === 'app.bsky.embed.record#view') {
      const quoted = post.embed.record;
      return (
        <div className="mt-3 border rounded p-3 bg-gray-50">
          <div className="flex items-center space-x-2">
            {quoted.author?.avatar && (
              <img 
                src={quoted.author.avatar} 
                alt="" 
                className="w-5 h-5 rounded-full"
                onError={(e) => (e.target.style.display = 'none')}
              />
            )}
            <span className="font-medium">{quoted.author?.displayName}</span>
            <span className="text-gray-500">@{quoted.author?.handle}</span>
          </div>
          <div className="mt-2 text-gray-600">{quoted.value?.text}</div>
        </div>
      );
    }
    return null;
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLocalLikeCount(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.author.displayName}`,
          text: post.record.text,
          url: window.location.href,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      setIsAlertOpen(true);
    }
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-3">
        <a href={`/profile/${post.author.handle}`} className="flex-shrink-0">
          {post.author.avatar && (
            <img
              src={post.author.avatar}
              alt={post.author.handle}
              className="w-10 h-10 rounded-full hover:opacity-90 transition-opacity"
              onError={(e) => (e.target.style.display = 'none')}
            />
          )}
        </a>
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <a href={`/profile/${post.author.handle}`} className="hover:underline">
              <span className="font-medium truncate">
                {post.author.displayName || post.author.handle}
              </span>
            </a>
            <span className="text-gray-500 truncate">
              @{post.author.handle}
            </span>
            <span className="text-gray-500">·</span>
            <time className="text-gray-500 hover:underline" title={new Date(post.record.createdAt).toLocaleString()}>
              {formatDistanceToNow(new Date(post.record.createdAt))} ago
            </time>
          </div>
        </div>
      </div>

      <div className="mt-3">
        <p className="text-gray-900 whitespace-pre-wrap">{renderText(post.record.text)}</p>
      </div>

      {renderVideo()}
      {renderEmbeddedImages()}
      {renderExternalEmbed()}
      {renderQuote()}

      <div className="mt-3 flex items-center justify-between text-gray-500 border-t pt-3">
        <button 
          className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
          aria-label="Reply"
        >
          <MessageSquare className="w-5 h-5" />
          <span>{post.replyCount}</span>
        </button>

        <button 
          className={`flex items-center space-x-2 transition-colors ${
            isLiked ? 'text-red-500' : 'hover:text-red-500'
          }`}
          onClick={handleLike}
          aria-label={isLiked ? 'Unlike' : 'Like'}
        >
          <svg className="w-5 h-5" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
            />
          </svg>
          <span>{localLikeCount}</span>
        </button>

        <button 
          className={`flex items-center space-x-2 transition-colors ${
            isBookmarked ? 'text-yellow-500' : 'hover:text-yellow-500'
          }`}
          onClick={handleBookmark}
          aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
        >
          <BookmarkPlus className="w-5 h-5" />
        </button>

        <button 
          className="flex items-center space-x-2 hover:text-blue-500 transition-colors"
          onClick={handleShare}
          aria-label="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>

        <button 
          className="flex items-center space-x-2 hover:text-red-500 transition-colors"
          aria-label="Report"
        >
          <Flag className="w-5 h-5" />
        </button>
      </div>

      <Modal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)}>
        <h2 className="text-xl font-semibold mb-4">Share Post</h2>
        <p className="text-gray-600 mb-2">Copy this link to share the post:</p>
        <input 
          type="text" 
          value={window.location.href}
          readOnly
          className="w-full p-2 border rounded bg-gray-50 mb-2"
          onClick={e => e.target.select()}
        />
      </Modal>
    </div>
  );
}

export default CustomPost;
