"use client";

import { useEffect, useState } from "react";

// Media.cm API response interfaces
interface MediaCmFile {
  thumbnail: string;
  link: string;
  file_code: string;
  canplay: number;
  length: string;
  views: string;
  uploaded: string;
  public: string;
  fld_id: string;
  title: string;
}

interface MediaCmResponse {
  msg: string;
  server_time: string;
  status: number;
  result: {
    files: MediaCmFile[];
    results_total: number;
    pages: number;
    results: number;
  };
}

// Updated video item interface for Media.cm
interface VideoItem {
  id: string;
  name: string;
  thumbnail: string;
  link: string;
  canplay: number;
  length: string;
  views: string;
  uploaded: string;
  public: string;
  fld_id: string;
  title: string;
  publicUrl: string;
}

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

  // Fetch videos from Media.cm API
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      // Call Media.cm API to get file list
      const response = await fetch("/api/mediacm?action=file-list");
      const data: MediaCmResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.msg || "Failed to fetch videos");
      }

      if (data.status !== 200) {
        throw new Error(data.msg || "API request failed");
      }

      // Transform Media.cm response to our VideoItem format
      const videos: VideoItem[] = data.result.files.map((file) => ({
        id: file.file_code,
        name: file.title || file.file_code,
        thumbnail: file.thumbnail,
        link: file.link,
        canplay: file.canplay,
        length: file.length,
        views: file.views,
        uploaded: file.uploaded,
        public: file.public,
        fld_id: file.fld_id,
        title: file.title,
        publicUrl: file.link,
      }));

      setAllVideos(videos);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  // Add video link using Media.cm remote upload
  const addVideoLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newVideoUrl.trim()) return;

    try {
      setIsAdding(true);

      const response = await fetch("/api/mediacm?action=remote-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newVideoUrl.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add video link");
      }

      if (data.status !== 200) {
        throw new Error(data.msg || "Failed to add video link");
      }

      setNewVideoUrl("");
      await fetchVideos(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add video link");
    } finally {
      setIsAdding(false);
    }
  };

  // Handle file upload to Media.cm
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

      const response = await fetch("/api/mediacm", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload video");
      }

      if (data.status !== 200) {
        throw new Error(data.msg || "Failed to upload video");
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

  // Delete video from Media.cm
  const deleteVideo = async (video: VideoItem) => {
    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete the video "${video.title}"? This action cannot be undone.`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setDeletingId(video.id);
      setError(null);

      const response = await fetch(
        `/api/mediacm?action=delete&file_code=${video.id}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete video");
      }

      if (data.status !== 200) {
        throw new Error(data.msg || "Failed to delete video");
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

  const formatDuration = (seconds: string): string => {
    const totalSeconds = parseInt(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-foreground"></div>
            <p className="mt-3 sm:mt-4 text-base sm:text-lg">
              Loading videos from Media.cm...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
          <div className="text-center">
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 px-4 py-3 rounded mb-4 mx-auto max-w-lg">
              <p className="font-bold text-base sm:text-lg mb-1">Error</p>
              <p className="text-sm sm:text-base">{error}</p>
            </div>
            <button
              onClick={fetchVideos}
              className="bg-foreground text-background px-4 sm:px-6 py-2 sm:py-3 rounded hover:bg-opacity-80 transition-colors text-sm sm:text-base font-medium"
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
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
        <header className="mb-6 sm:mb-8 lg:mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-2 sm:mb-3">
            Media.cm Video Library
          </h1>
          <p className="text-base sm:text-lg opacity-70">
            Browse videos from Media.cm ({allVideos.length} videos)
          </p>
        </header>

        {/* Upload Video Form */}
        <div className="mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4">
            Upload Video to Media.cm
          </h2>
          <div className="space-y-3 sm:space-y-4">
            <div>
              <input
                id="video-file-input"
                type="file"
                accept="video/*"
                onChange={handleFileSelect}
                className="block w-full text-sm sm:text-base text-foreground file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-foreground file:text-background hover:file:bg-opacity-80 file:cursor-pointer"
                disabled={isUploading}
              />
              <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">
                Supported formats: MP4, WebM, MOV, AVI (Max: 50MB)
              </p>
            </div>

            {selectedFile && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm sm:text-base font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <button
                  onClick={uploadVideo}
                  disabled={isUploading}
                  className="w-full sm:w-auto px-4 py-2 bg-foreground text-background rounded hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
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
        <div className="mb-6 sm:mb-8 lg:mb-10 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold mb-3 sm:mb-4">
            Add Video Link
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4">
            Add videos from external URLs using Media.cm remote upload
          </p>
          <form
            onSubmit={addVideoLink}
            className="flex flex-col sm:flex-row gap-3 sm:gap-4"
          >
            <input
              type="url"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="Enter video URL (e.g., https://site.com/video.mp4)"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-foreground text-sm sm:text-base"
              disabled={isAdding}
              required
            />
            <button
              type="submit"
              disabled={isAdding || !newVideoUrl.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-foreground text-background rounded hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isAdding ? "Adding..." : "Add Video"}
            </button>
          </form>
        </div>

        {allVideos.length === 0 ? (
          <div className="text-center py-8 sm:py-12">
            <div className="mb-4 sm:mb-6">
              <svg
                className="mx-auto h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 opacity-50"
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
            <h3 className="text-lg sm:text-xl lg:text-2xl font-medium mb-2 sm:mb-3">
              No videos found
            </h3>
            <p className="text-sm sm:text-base opacity-70">
              No videos are currently available in your Media.cm account.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {allVideos.map((video) => (
              <div
                key={video.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-shadow duration-300 flex flex-col"
              >
                {/* Video Preview */}
                <div className="aspect-video bg-gray-100 dark:bg-gray-700 relative w-full">
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl sm:text-5xl lg:text-6xl opacity-50 flex items-center justify-center h-full">
                      🎬
                    </div>
                  )}

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-black bg-opacity-50 rounded-full p-3">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="p-3 sm:p-4 flex-1 flex flex-col">
                  <h3
                    className="font-semibold text-sm sm:text-base lg:text-lg mb-2 truncate"
                    title={video.title}
                  >
                    🎬 {video.title}
                  </h3>

                  <div className="space-y-1 sm:space-y-2 text-xs sm:text-sm opacity-70 flex-1">
                    {video.length && (
                      <div className="flex justify-between">
                        <span>Duration:</span>
                        <span>{formatDuration(video.length)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Views:</span>
                      <span>{video.views}</span>
                    </div>

                    <div className="flex justify-between">
                      <span>Status:</span>
                      <span
                        className={
                          video.canplay ? "text-green-600" : "text-yellow-600"
                        }
                      >
                        {video.canplay ? "Ready" : "Processing"}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Uploaded:</span>
                      <span>{formatDate(video.uploaded)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-3 sm:mt-4 flex gap-2">
                    <a
                      href={video.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-foreground text-background text-center py-1.5 sm:py-2 px-3 sm:px-4 rounded text-xs sm:text-sm font-medium hover:bg-opacity-80 transition-colors"
                    >
                      Watch Video
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(video.link)}
                      className="p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Copy URL"
                    >
                      <svg
                        className="w-3 h-3 sm:w-4 sm:h-4"
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
                      onClick={() => deleteVideo(video)}
                      disabled={deletingId === video.id}
                      className="p-1.5 sm:p-2 border border-red-300 dark:border-red-600 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete Video"
                    >
                      {deletingId === video.id ? (
                        <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4"
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
        <div className="mt-6 sm:mt-8 lg:mt-12 text-center">
          <button
            onClick={fetchVideos}
            disabled={loading}
            className="bg-foreground text-background px-6 py-2 sm:py-3 rounded-lg hover:bg-opacity-80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base font-medium"
          >
            {loading ? "Loading..." : "Refresh Videos"}
          </button>
        </div>
      </div>
    </div>
  );
}
