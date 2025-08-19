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

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      alert("Please select a file");
      return;
    }

    setUploading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (title) formData.append("title", title);
      if (description) formData.append("description", description);

      const response = await fetch("/api/mediacm", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ msg: "Upload failed", status: 500, error: "Network error" });
    } finally {
      setUploading(false);
    }
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
