'use client'
import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Share2, BookmarkPlus, Flag, MessageSquare, Eye } from 'lucide-react';
import Hls from "hls.js";

const CURRENCY_CONFIG = {
  Bitcoin: {
    name: "Bitcoin",
    symbol: "BTC",
    logo: "https://cdn.coinranking.com/bOabBYkcX/bitcoin_btc.svg",
    color: "bg-orange-500"
  },
  XRP: {
    name: "XRP",
    symbol: "XRP",
    logo: "https://cryptologos.cc/logos/xrp-xrp-logo.svg",
    color: "bg-blue-500"
  },
  Dogecoin: {
    name: "Dogecoin",
    symbol: "DOGE",
    logo: "https://cryptologos.cc/logos/dogecoin-doge-logo.svg",
    color: "bg-yellow-500"
  }
};

const Modal = ({ isOpen, onClose, children, isDark }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg p-6 max-w-md w-full mx-4`}>
        {children}
        <button onClick={onClose} className="mt-4 w-full bg-blue-600 text-white rounded-md py-2">Close</button>
      </div>
    </div>
  );
};

export default function EmbeddedPost({ post, isDark }) {
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [localLikeCount, setLocalLikeCount] = useState(post.likeCount || 0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const videoRef = useRef(null);

  const getCurrencyInfo = (postText) => {
    const currencies = Object.keys(CURRENCY_CONFIG);
    const foundCurrency = currencies.find(currency =>
      postText.toLowerCase().includes(currency.toLowerCase())
    );
    return foundCurrency ? CURRENCY_CONFIG[foundCurrency] : null;
  };

  const currencyInfo = getCurrencyInfo(post.record.text);

  useEffect(() => {
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

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString('default', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Function to handle YouTube URLs
  const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const shortUrlPattern = /youtu\.be\/([a-zA-Z0-9_-]+)/;
    const longUrlPattern = /youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;

    const shortMatch = url.match(shortUrlPattern);
    const longMatch = url.match(longUrlPattern);

    return shortMatch?.[1] || longMatch?.[1] || null;
  };

  // Enhanced text rendering with link support
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
      // Check for YouTube links
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

      // Check for general URLs
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

      // Check for hashtags
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

      // Check for mentions
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

      // Handle newlines
      if (segment === '\n') {
        return <br key={index} />;
      }

      return segment;
    });
  };

  // Function to render videos
  const renderVideo = () => {
    if (post.embed?.$type === 'app.bsky.embed.video#view') {
      return (
        <div className="mt-3 relative">
          {!isVideoLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          <div className="aspect-[9/16] relative">
            <video
              ref={videoRef}
              controls
              playsInline
              className="w-full h-full rounded-lg bg-black absolute inset-0"
              poster={post.embed.thumbnail}
              style={{
                aspectRatio: post.embed?.aspectRatio 
                  ? `${post.embed.aspectRatio.width}/${post.embed.aspectRatio.height}`
                  : '16/9' // Default aspect ratio if not provided
              }}
            >
              <source src={post.embed.playlist} type="application/x-mpegURL" />
              {/* Fallback source */}
              <source
                src={`https://video.bsky.app/watch/${encodeURIComponent(post.author.did)}/${post.embed.cid}/video.mp4`}
                type="video/mp4"
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      );
    }
    return null;
  };

  // Handle embedded images
  const renderImages = () => {
    if (post.embed?.$type === 'app.bsky.embed.images#view' && post.embed.images?.length > 0) {
      return (
        <div className={`grid gap-2 mt-3 ${post.embed.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.embed.images.map((img, index) => (
            <img
              key={index}
              src={img.fullsize || img.thumb}
              alt={'Post image'}
              className="rounded-lg w-full object-cover"
              style={{ maxHeight: post.embed.images.length > 1 ? '250px' : '500px' }}
              loading="lazy"
            />
          ))}
        </div>
      );
    }
    return null;
  };

  // Handle external embeds and YouTube
  // Update the renderExternalEmbed function
  const renderExternalEmbed = () => {
    if (post.embed?.$type === 'app.bsky.embed.external#view') {
      const { uri, title, description, thumb } = post.embed.external;

      // Check if it's a YouTube link
      const videoId = getYouTubeVideoId(uri);
      if (videoId) {
        return (
          <div className="mt-3">
            <div className="rounded-lg overflow-hidden border border-gray-200">
              <div className="relative aspect-w-16 aspect-h-32">
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={title || "YouTube video"}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-[300px] rounded-lg"
                ></iframe>
              </div>
              <div className="p-3 bg-white">
                <h4 className="font-medium text-gray-900">{title}</h4>
                {description && (
                  <p className="text-sm text-gray-600 mt-1">{description}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">youtube.com</p>
              </div>
            </div>
          </div>
        );
      }

      // Regular external link preview
      return (
        <a
          href={uri}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 block border rounded-lg overflow-hidden hover:bg-gray-50 transition-colors"
        >
          {thumb && (
            <div className="aspect-video relative">
              <img
                src={thumb}
                alt={title || "External content"}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>
          )}
          <div className="p-3">
            <h4 className="font-medium text-gray-900">{title}</h4>
            {description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              {new URL(uri).hostname.replace('www.', '')}
            </p>
          </div>
        </a>
      );
    }
    return null;
  };


  // Handle quoted posts
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

  const handleLike = async () => {
    try {
      setIsLiked(!isLiked);
      setLocalLikeCount(prev => isLiked ? prev - 1 : prev + 1);
      // Add any API call here to update like status
    } catch (error) {
      console.error('Error handling like:', error);
    }
  };

  const handleBookmark = async () => {
    try {
      setIsBookmarked(!isBookmarked);
      // Add any API call here to update bookmark status
    } catch (error) {
      console.error('Error handling bookmark:', error);
    }
  };

  const handleFollow = async () => {
    try {
      setIsFollowing(!isFollowing);
      // Add any API call here to update follow status
    } catch (error) {
      console.error('Error handling follow:', error);
    }
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
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
          setIsAlertOpen(true);
        }
      }
    } else {
      setIsAlertOpen(true);
    }
  };

  return (
    <div className={`border ${isDark ? 'bg-gray-900 border-gray-700 text-white' : 'bg-white border-gray-200'} rounded-lg p-4 hover:shadow-md transition-shadow`}>
 <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
      <div className="flex items-start space-x-3 mb-3 sm:mb-0 w-full">
        <a href={`/profile/${post.author.handle}`} className="flex-shrink-0">
          <img src={post.author.avatar} alt={post.author.displayName} className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
        </a>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-start w-full">
            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-center justify-between w-full">
                <a href={`/profile/${post.author.handle}`} className={`font-bold ${isDark ? 'text-white' : 'text-black'} hover:underline truncate max-w-[180px]`}>
                  {post.author.displayName || post.author.handle}
                </a>
                {currencyInfo && (
                  <div className="sm:hidden flex items-center space-x-2">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                      <img src={currencyInfo.logo} alt={currencyInfo.name} className="w-4 h-4" />
                      <span className={`text-xs font-medium ${isDark ? 'text-white' : 'text-black'}`}>{currencyInfo.name}</span>
                    </div>
                    <img src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Bluesky_Logo.svg" alt="Bluesky" className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2 text-sm mt-1">
                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'} truncate`}>@{post.author.handle}</span>
                <span className="hidden sm:inline text-gray-500">·</span>
                <time className="hidden sm:inline text-gray-500 hover:underline whitespace-nowrap">
                  {formatDistanceToNow(new Date(post.record.createdAt))} ago
                </time>
              </div>
              <div className="block sm:hidden text-sm mt-1">
                <time className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatDistanceToNow(new Date(post.record.createdAt))} ago
                </time>
              </div>
            </div>
          </div>
        </div>
      </div>
      {currencyInfo && (
        <div className="hidden sm:flex flex-col items-end space-y-2 ml-auto">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center  space-x-2 w-28 px-3 py-1 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <img src={currencyInfo.logo} alt={currencyInfo.name} className="w-5 h-5" />
              <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{currencyInfo.name}</span>
            </div>
            <img src="https://upload.wikimedia.org/wikipedia/commons/7/7a/Bluesky_Logo.svg" alt="Bluesky" className="w-5 h-5" />
          </div>
        </div>
      )}
    </div>

      <div className={`mt-3 text-[15px] whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
        {renderText(post.record.text)}
      </div>

      {/* Media content sections */}
      <div className="mt-3">
        {renderVideo()}
        {renderImages()}
        {renderExternalEmbed()}
        {renderQuote()}
      </div>

      <div className={`mt-3 flex items-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <time className="hover:underline" title={post.record.createdAt}>
          {new Date(post.record.createdAt).toLocaleString()}
        </time>
        <span className="mx-2">·</span>
        <span className="flex items-center">
          <Eye className="w-4 h-4 mr-1" />
          {post.viewer?.replyDisabled ? 'Limited audience' : 'Everybody can reply'}
        </span>
      </div>

      <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
        <button className="interaction-button group" aria-label="Reply">
          <MessageSquare className="w-5 h-5 group-hover:scale-110 transition-transform" />
          <span>1</span>
        </button>

        <button 
          onClick={handleLike}
          className={`interaction-button group ${isLiked ? 'text-red-500' : 'hover:text-red-500'}`}
        >
          <svg className="w-5 h-5 group-hover:scale-110 transition-transform" 
               fill={isLiked ? 'currentColor' : 'none'} 
               stroke="currentColor" 
               viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span>{localLikeCount}</span>
        </button>

        <button 
          onClick={handleBookmark}
          className={`interaction-button group ${isBookmarked ? 'text-yellow-500' : 'hover:text-yellow-500'}`}
        >
          <BookmarkPlus className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        <button onClick={handleShare} className="interaction-button group">
          <Share2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>

        <button className="interaction-button group">
          <Flag className="w-5 h-5 group-hover:scale-110 transition-transform" />
        </button>
      </div>

      <div className={`mt-3 pt-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <a
          href={`https://bsky.app/profile/${post.author.handle}/post/${post.uri.split('/').pop()}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center justify-center space-x-2 py-2 rounded-md transition-colors ${isDark ? 'text-blue-400 hover:bg-gray-800' : 'text-blue-500 hover:bg-blue-50'}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="text-sm">View post in Blue Sky</span>
        </a>
      </div>

      <Modal isOpen={isAlertOpen} onClose={() => setIsAlertOpen(false)} isDark={isDark}>
        <h2 className="text-xl font-semibold mb-4">Share Post</h2>
        <p className={`mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          Copy this link to share the post:
        </p>
        <input
          type="text"
          value={window.location.href}
          readOnly
          className={`w-full p-2 rounded mb-2 ${
            isDark 
              ? 'bg-gray-700 text-white border-gray-600' 
              : 'bg-gray-50 text-gray-900 border-gray-300'
          }`}
          onClick={e => e.target.select()}
        />
      </Modal>

      <style jsx>{`
        .interaction-button {
          @apply flex items-center space-x-1 transition-colors;
        }
        
        @media (max-width: 640px) {
          .interaction-button {
            @apply text-sm;
          }
        }
      `}</style>
    </div>
  );
}