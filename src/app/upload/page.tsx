"use client";

import { useState } from "react";

interface UploadResult {
  msg: string;
  status: number;
  files?: Array<{
    filecode: string;
    filename: string;
    status: string;
  }>;
  error?: string;
}

// interface DirectUrlResult {
//   versions: Array<{
//     url: string;
//     name: string;
//     size: string;
//   }>;
//   file_length: string;
//   player_img: string;
//   hls_direct?: string;
// }

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  // const [directUrls, setDirectUrls] = useState<{
  //   [filecode: string]: DirectUrlResult;
  // }>({});

  // const fetchDirectUrl = async (filecode: string) => {
  //   try {
  //     // You'll need to add your API key here
  //     const apiKey = process.env.NEXT_PUBLIC_MEDIA_CM_API_KEY || "YOUR_API_KEY";
  //     const response = await fetch(
  //       `https://media.cm/api/file/direct_link?key=${apiKey}&file_code=${filecode}&hls=1`
  //     );
  //     const data = await response.json();

  //     if (data.status === 200) {
  //       setDirectUrls((prev) => ({
  //         ...prev,
  //         [filecode]: data.result,
  //       }));
  //       console.log(`Direct URL for ${filecode}:`, data.result);
  //     } else {
  //       console.error(`Failed to get direct URL for ${filecode}:`, data);
  //     }
  //   } catch (error) {
  //     console.error(`Error fetching direct URL for ${filecode}:`, error);
  //   }
  // };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file");
      return;
    }

    setUploading(true);
    setResult(null);
    setUploadProgress(0);
    setProcessing(false);

    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress(progress);
          console.log(
            `Upload progress: ${progress}% (${event.loaded} / ${event.total} bytes)`
          );

          // Show processing spinner when upload reaches 100%
          if (progress === 100) {
            setProcessing(true);
          }
        }
      });

      // Track load start
      xhr.upload.addEventListener("loadstart", () => {
        console.log("Upload started");
      });

      // Track load end
      xhr.upload.addEventListener("loadend", () => {
        console.log("Upload completed");
      });

      // Handle response
      xhr.addEventListener("load", () => {
        try {
          const data = JSON.parse(xhr.responseText);
          setResult(data);
          console.log("Upload response:", data);

          // Fetch direct URLs for all uploaded files
          // if (data.status === 200 && data.files) {
          //   data.files.forEach((file: any) => {
          //     if (file.status === "OK") {
          //       // Wait a bit for Media.cm to process the file
          //       setTimeout(() => fetchDirectUrl(file.filecode), 2000);
          //     }
          //   });
          // }
        } catch (error) {
          const errorResult = {
            msg: "Invalid response",
            status: xhr.status,
            error: "Invalid JSON",
          };
          setResult(errorResult);
          console.error("Upload error - invalid JSON:", error);
        }
        setUploading(false);
        setProcessing(false);
        resolve();
      });

      // Handle errors
      xhr.addEventListener("error", () => {
        const errorResult = {
          msg: "Upload failed",
          status: 500,
          error: "Network error",
        };
        setResult(errorResult);
        setUploading(false);
        setProcessing(false);
        console.error("Upload error - network error");
        reject(new Error("Network error"));
      });

      xhr.addEventListener("abort", () => {
        const errorResult = {
          msg: "Upload cancelled",
          status: 0,
          error: "Upload was cancelled",
        };
        setResult(errorResult);
        setUploading(false);
        setProcessing(false);
        console.log("Upload was cancelled");
        reject(new Error("Upload cancelled"));
      });

      // Open and send request
      xhr.open("POST", "/api/mediacm");

      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (description) formData.append("description", description);

      xhr.send(formData);
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Upload Video to Media.cm</h1>

      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Video File</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Title (optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border rounded-md"
            placeholder="Enter video title..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2 border rounded-md h-24"
            placeholder="Enter video description..."
          />
        </div>

        <button
          type="submit"
          disabled={uploading || !file}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          {uploading ? "Uploading..." : "Upload Video"}
        </button>
      </form>

      {/* Progress bar */}
      {uploading && (
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Upload Progress</span>
            <span className="flex items-center gap-2">
              {uploadProgress}%
              {processing && (
                <div className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              )}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          {processing && (
            <p className="text-sm text-blue-600 mt-2">
              Processing file with Media.cm...
            </p>
          )}
        </div>
      )}

      {result && (
        <div className="mt-6 p-4 border rounded-md">
          <h2 className="font-medium mb-2">Upload Result:</h2>

          {result.status === 200 && result.files ? (
            <div className="space-y-2">
              <p className="text-green-600">✅ Upload successful!</p>
              {result.files.map((file, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded">
                  <p>
                    <strong>File:</strong> {file.filename}
                  </p>
                  <p>
                    <strong>Code:</strong> {file.filecode}
                  </p>
                  <p>
                    <strong>Status:</strong> {file.status}
                  </p>
                  <p>
                    <strong>Link:</strong>
                    <a
                      href={`https://media.cm/${file.filecode}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline ml-1"
                    >
                      https://media.cm/{file.filecode}
                    </a>
                  </p>

                  {/* Direct URLs Section */}
                  {/* {directUrls[file.filecode] && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-400">
                      <p className="font-medium text-blue-800 mb-2">
                        🎬 Direct Video URLs:
                      </p>
                      <div className="space-y-2">
                        {directUrls[file.filecode].versions.map(
                          (version, vIndex) => (
                            <div key={vIndex} className="text-sm">
                              <span className="font-medium">
                                {version.name.toUpperCase()} Quality:
                              </span>
                              <a
                                href={version.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline ml-2 break-all"
                              >
                                {version.url}
                              </a>
                              <span className="text-gray-500 ml-2">
                                (
                                {Math.round(
                                  parseInt(version.size) / 1024 / 1024
                                )}
                                MB)
                              </span>
                            </div>
                          )
                        )}
                        {directUrls[file.filecode].hls_direct && (
                          <div className="text-sm">
                            <span className="font-medium">HLS Stream:</span>
                            <a
                              href={directUrls[file.filecode].hls_direct}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline ml-2 break-all"
                            >
                              {directUrls[file.filecode].hls_direct}
                            </a>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Duration: {directUrls[file.filecode].file_length}{" "}
                        seconds
                      </p>
                    </div>
                  )} */}

                  {/* Loading state for direct URLs */}
                  {/* {!directUrls[file.filecode] && file.status === "OK" && (
                    <div className="mt-3 p-2 bg-yellow-50 rounded border-l-4 border-yellow-400">
                      <p className="text-yellow-800 text-sm">
                        🔄 Fetching direct URLs... (this may take a few seconds)
                      </p>
                    </div>
                  )} */}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-red-600">
              ❌ Upload failed: {result.error || result.msg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
