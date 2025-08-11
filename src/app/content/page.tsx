"use client";

import { useEffect, useState } from "react";

interface FileItem {
  name: string;
  bucket_id: string;
  owner: string;
  id: string;
  updated_at: string;
  created_at: string;
  last_accessed_at: string;
  metadata: Record<string, any>;
}

interface FileWithUrl extends FileItem {
  publicUrl: string;
  signedUrl?: string;
  isDirectVideo?: false;
}

interface DirectVideo {
  id: string;
  name: string;
  url: string;
  publicUrl: string;
  created_at: string;
  isDirectVideo: true;
  metadata?: {
    mimetype?: string;
    size?: number;
  };
}

type VideoItem = FileWithUrl | DirectVideo;

// Add your embed links here
const EMBED_LINKS = [
  "https://www.pornhub.com/embed/66987c55c5e70",
];

// Map embed links to DirectVideo objects
const DIRECT_VIDEOS: DirectVideo[] = EMBED_LINKS.map((url) => ({
  id: crypto.randomUUID(),
  url,
  name: url.split("/").pop()?.split(".")[0] || "Untitled Video",
  publicUrl: url,
  created_at: new Date().toISOString(),
  isDirectVideo: true,
  metadata: {
    mimetype: "video/mp4",
  },
}));

export default function ContentPage() {
  const [storageFiles, setStorageFiles] = useState<FileWithUrl[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Combine storage files with direct videos
  const allVideos: VideoItem[] = [...DIRECT_VIDEOS, ...storageFiles];

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/videos");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch files");
      }

      setStorageFiles(data.files || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isVideoFile = (file: VideoItem): boolean => {
    if (file.isDirectVideo) return true;
    return (
      file.metadata?.mimetype?.startsWith("video/") ||
      /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(file.name)
    );
  };

  const getFileIcon = (file: VideoItem): string => {
    if (isVideoFile(file)) return "🎬";
    if (file.metadata?.mimetype?.startsWith("image/")) return "🖼️";
    if (file.metadata?.mimetype?.startsWith("audio/")) return "🎵";
    if (file.metadata?.mimetype?.includes("pdf")) return "📄";
    return "📁";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
            <p className="mt-4 text-lg">Loading videos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4">
              <p className="font-bold">Error</p>
              <p>{error}</p>
            </div>
            <button
              onClick={fetchFiles}
              className="bg-foreground text-background px-4 py-2 rounded hover:bg-opacity-80 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Video Library</h1>
          <p className="text-lg opacity-70">
            Browse our video collection ({allVideos.length} videos)
          </p>
        </header>

        {allVideos.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 opacity-50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium mb-2">No videos found</h3>
            <p className="opacity-70">
              No videos are currently available in the library.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allVideos.map((file) => (
              <div
                key={file.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Video Preview */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative flex items-center justify-center">
                  {isVideoFile(file) ? (
                    file.isDirectVideo ? (
                      <iframe
                        src={file.url}
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        scrolling="no"
                        allowFullScreen
                        className="absolute inset-0"
                      />
                    ) : (
                      <video
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                      >
                        <source
                          src={file.publicUrl}
                          type={file.metadata?.mimetype || "video/mp4"}
                        />
                        Your browser does not support the video tag.
                      </video>
                    )
                  ) : (
                    <div className="text-6xl opacity-50">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="p-4">
                  <h3
                    className="font-semibold text-lg mb-2 truncate"
                    title={file.name}
                  >
                    {getFileIcon(file)} {file.name}
                    {file.isDirectVideo && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        External
                      </span>
                    )}
                  </h3>

                  <div className="space-y-2 text-sm opacity-70">
                    {file.metadata?.size && (
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{formatFileSize(file.metadata?.size || 0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="truncate ml-2">
                        {file.metadata?.mimetype || "video/mp4"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-4 flex gap-2">
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-foreground text-background text-center py-2 px-4 rounded hover:bg-opacity-80 transition-colors text-sm font-medium"
                    >
                      Open Video
                    </a>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(file.publicUrl)
                      }
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Copy URL"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchFiles}
            disabled={loading}
            className="bg-foreground text-background px-6 py-2 rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Loading..." : "Refresh Videos"}
          </button>
        </div>
      </div>
    </div>
  );
}
