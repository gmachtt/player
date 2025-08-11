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
  created_at: string;
  publicUrl: string;
  isDirectVideo: true;
  metadata?: {
    mimetype?: string;
    size?: number;
  };
}

type VideoItem = FileWithUrl | DirectVideo;

export default function ContentPage() {
  const [allVideos, setAllVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  // Convert various video URLs to embeddable format
  const getEmbedUrl = (url: string): string => {
    try {
      const urlObj = new URL(url);

      // YouTube URLs
      if (
        urlObj.hostname.includes("youtube.com") ||
        urlObj.hostname.includes("youtu.be")
      ) {
        let videoId = "";

        if (urlObj.hostname.includes("youtu.be")) {
          // Short URL format: https://youtu.be/VIDEO_ID
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes("youtube.com")) {
          // Long URL format: https://www.youtube.com/watch?v=VIDEO_ID
          videoId = urlObj.searchParams.get("v") || "";
        }

        if (videoId) {
          return `https://www.youtube.com/embed/${videoId}`;
        }
      }

      // Yandex Video URLs - return original URL as they require authentication for embedding
      if (urlObj.hostname.includes("yandex")) {
        return url;
      }

      // Vimeo URLs
      if (urlObj.hostname.includes("vimeo.com")) {
        const videoId = urlObj.pathname.split("/").pop();
        if (videoId) {
          return `https://player.vimeo.com/video/${videoId}`;
        }
      }

      // Dailymotion URLs
      if (urlObj.hostname.includes("dailymotion.com")) {
        const videoId = urlObj.pathname.split("/video/")[1]?.split("_")[0];
        if (videoId) {
          return `https://www.dailymotion.com/embed/video/${videoId}`;
        }
      }

      // Twitch URLs
      if (urlObj.hostname.includes("twitch.tv")) {
        const videoId = urlObj.pathname.split("/videos/")[1];
        if (videoId) {
          return `https://player.twitch.tv/?video=${videoId}&parent=${window.location.hostname}`;
        }
      }

      // If no conversion needed or recognized, return original URL
      return url;
    } catch (error) {
      // If URL parsing fails, return original URL
      return url;
    }
  };

  // Check if video should be embedded or opened in new tab
  const shouldEmbedVideo = (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      // Return false for Yandex videos as they require authentication
      return !urlObj.hostname.includes("yandex");
    } catch (error) {
      return true;
    }
  };

  // Get video platform name for display
  const getVideoPlatform = (url: string): string => {
    try {
      const urlObj = new URL(url);

      if (
        urlObj.hostname.includes("youtube.com") ||
        urlObj.hostname.includes("youtu.be")
      ) {
        return "YouTube";
      }
      if (urlObj.hostname.includes("yandex")) {
        return "Yandex Video";
      }
      if (urlObj.hostname.includes("vimeo.com")) {
        return "Vimeo";
      }
      if (urlObj.hostname.includes("dailymotion.com")) {
        return "Dailymotion";
      }
      if (urlObj.hostname.includes("twitch.tv")) {
        return "Twitch";
      }

      return "External";
    } catch (error) {
      return "External";
    }
  };

  // Extract video title from URL
  const getVideoTitle = (url: string): string => {
    try {
      const urlObj = new URL(url);

      // For YouTube, try to extract from URL parameters or use video ID
      if (
        urlObj.hostname.includes("youtube.com") ||
        urlObj.hostname.includes("youtu.be")
      ) {
        let videoId = "";

        if (urlObj.hostname.includes("youtu.be")) {
          videoId = urlObj.pathname.slice(1);
        } else if (urlObj.hostname.includes("youtube.com")) {
          videoId = urlObj.searchParams.get("v") || "";
        }

        return videoId ? `YouTube Video (${videoId})` : "YouTube Video";
      }

      // For Yandex Video
      if (urlObj.hostname.includes("yandex.com")) {
        const pathParts = urlObj.pathname.split("/");
        const videoId = pathParts[pathParts.length - 1];
        return videoId ? `Yandex Video (${videoId})` : "Yandex Video";
      }

      // For other platforms, use pathname or hostname
      if (urlObj.hostname.includes("vimeo.com")) {
        const videoId = urlObj.pathname.split("/").pop();
        return videoId ? `Vimeo Video (${videoId})` : "Vimeo Video";
      }

      // Fallback to hostname
      return urlObj.hostname.replace("www.", "");
    } catch (error) {
      return url.split("/").pop()?.split(".")[0] || "Untitled Video";
    }
  };

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/videos");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch videos");
      }

      setAllVideos(data.files || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const addVideoLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newVideoUrl.trim()) return;

    try {
      setIsAdding(true);

      const response = await fetch("/api/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newVideoUrl.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add video link");
      }

      setNewVideoUrl("");
      await fetchVideos(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add video link");
    } finally {
      setIsAdding(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check if it's a video file
      if (!file.type.startsWith("video/")) {
        setError("Please select a video file");
        return;
      }

      // Check file size (50MB limit)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError("File size must be less than 50MB");
        return;
      }

      setSelectedFile(file);
      setError(null);
    }
  };

  const uploadVideo = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/videos/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload video");
      }

      // Clear the selected file
      setSelectedFile(null);

      // Reset file input
      const fileInput = document.getElementById(
        "video-file-input"
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";

      // Refresh the video list
      await fetchVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload video");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteVideo = async (video: VideoItem) => {
    // Confirm deletion
    const confirmMessage = video.isDirectVideo
      ? `Are you sure you want to delete the video link "${video.name}"?`
      : `Are you sure you want to delete the video file "${video.name}"? This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(video.id);
      setError(null);

      const params = new URLSearchParams({
        id: video.id,
        isDirectVideo: video.isDirectVideo ? "true" : "false",
      });

      // Add fileName for storage files
      if (!video.isDirectVideo) {
        params.append("fileName", video.name);
      }

      const response = await fetch(`/api/videos?${params}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete video");
      }

      // Refresh the video list
      await fetchVideos();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete video");
    } finally {
      setDeletingId(null);
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
              onClick={fetchVideos}
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

        {/* Upload Video Form */}
        <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Upload Video File</h2>
          <div className="space-y-4">
            <div>
              <input
                id="video-file-input"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="block w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-foreground file:text-background hover:file:bg-opacity-80 file:cursor-pointer"
                disabled={isUploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported formats: MP4, WebM, MOV, AVI (Max: 50MB)
              </p>
            </div>

            {selectedFile && (
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={uploadVideo}
                  disabled={isUploading}
                  className="px-4 py-2 bg-foreground text-background rounded hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? "Uploading..." : "Upload Video"}
                </button>
              </div>
            )}

            {isUploading && uploadProgress > 0 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-foreground h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
          </div>
        </div>

        {/* Add Video Link Form */}
        <div className="mb-8 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Add Video Link</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Supports YouTube, Vimeo, Dailymotion, Twitch, Yandex Video, and
            direct video URLs
          </p>
          <form onSubmit={addVideoLink} className="flex gap-2">
            <input
              type="url"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="Enter video URL (e.g., https://www.youtube.com/watch?v=k0WfnIRLvr4)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-foreground"
              disabled={isAdding}
              required
            />
            <button
              type="submit"
              disabled={isAdding || !newVideoUrl.trim()}
              className="px-4 py-2 bg-foreground text-background rounded hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAdding ? "Adding..." : "Add Video"}
            </button>
          </form>
        </div>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {allVideos.map((file) => (
              <div
                key={file.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300"
              >
                {/* Video Preview */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative w-full">
                  {isVideoFile(file) ? (
                    file.isDirectVideo ? (
                      shouldEmbedVideo(file.url) ? (
                        <div className="relative w-full h-0 pb-[56.25%]">
                          <iframe
                            src={getEmbedUrl(file.url)}
                            className="absolute top-0 left-0 w-full h-full"
                            frameBorder="0"
                            scrolling="no"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        // For non-embeddable videos (like Yandex), show a preview with link
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                          <div className="text-6xl mb-4">
                            {getFileIcon(file)}
                          </div>
                          <p className="text-sm mb-2">
                            {getVideoPlatform(file.url)} video
                          </p>
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-foreground text-background px-4 py-2 rounded hover:bg-opacity-80 transition-colors text-sm"
                          >
                            Open in {getVideoPlatform(file.url)}
                          </a>
                        </div>
                      )
                    ) : (
                      <video
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        playsInline
                      >
                        <source
                          src={file.publicUrl}
                          type={file.metadata?.mimetype || "video/mp4"}
                        />
                        Your browser does not support the video tag.
                      </video>
                    )
                  ) : (
                    <div className="text-6xl opacity-50 flex items-center justify-center h-full">
                      {getFileIcon(file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="p-3 sm:p-4">
                  <h3
                    className="font-semibold text-base sm:text-lg mb-2 truncate"
                    title={
                      file.isDirectVideo ? getVideoTitle(file.url) : file.name
                    }
                  >
                    {getFileIcon(file)}{" "}
                    {file.isDirectVideo ? getVideoTitle(file.url) : file.name}
                    {file.isDirectVideo && (
                      <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        {getVideoPlatform(file.url)}
                      </span>
                    )}
                  </h3>

                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm opacity-70">
                    {file.metadata?.size && (
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span>{formatFileSize(file.metadata?.size || 0)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Type:</span>
                      <span className="truncate ml-2">
                        {file.isDirectVideo
                          ? getVideoPlatform(file.url)
                          : file.metadata?.mimetype || "video/mp4"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Created:</span>
                      <span>{formatDate(file.created_at)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 sm:mt-4 flex gap-2">
                    <a
                      href={file.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-foreground text-background text-center py-1.5 sm:py-2 px-3 sm:px-4 rounded text-xs sm:text-sm font-medium hover:bg-opacity-80 transition-colors"
                    >
                      {file.isDirectVideo ? "Open Original" : "Open Video"}
                    </a>
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(file.publicUrl)
                      }
                      className="p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                    <button
                      onClick={() => deleteVideo(file)}
                      disabled={deletingId === file.id}
                      className="p-1.5 sm:p-2 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Video"
                    >
                      {deletingId === file.id ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      )}
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
            onClick={fetchVideos}
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
