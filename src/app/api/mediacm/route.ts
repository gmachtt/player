import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.MEDIACM_API_KEY || "";
const BASE_URL = "https://media.cm/api";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  if (action === "upload-server") {
    try {
      const response = await fetch(`${BASE_URL}/upload/server?key=${API_KEY}`);
      const data = await response.json();

      if (data.status === 200) {
        return NextResponse.json({ uploadUrl: data.result });
      }

      return NextResponse.json(
        { error: "Failed to get upload server" },
        { status: 400 }
      );
    } catch (error) {
      console.error("API request failed:", error);
      return NextResponse.json(
        { error: "API request failed" },
        { status: 500 }
      );
    }
  }

  if (action === "file-list") {
    try {
      const response = await fetch(`${BASE_URL}/file/list?key=${API_KEY}`);
      const data = await response.json();

      if (data.status === 200) {
        return NextResponse.json(data);
      }

      return NextResponse.json(
        { error: "Failed to get file list" },
        { status: 400 }
      );
    } catch (error) {
      console.error("API request failed:", error);
      return NextResponse.json(
        { error: "API request failed" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  // Handle remote upload (adding video links)
  if (action === "remote-upload") {
    try {
      const { url } = await request.json();

      if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
      }

      // Use Media.cm remote upload API
      const response = await fetch(
        `${BASE_URL}/upload/url?key=${API_KEY}&url=${encodeURIComponent(url)}`
      );
      const data = await response.json();

      if (data.status === 200) {
        return NextResponse.json(data);
      }

      return NextResponse.json(
        { error: data.msg || "Failed to add video link" },
        { status: 400 }
      );
    } catch (error) {
      console.error("Remote upload failed:", error);
      return NextResponse.json(
        { error: "Remote upload failed" },
        { status: 500 }
      );
    }
  }

  // Handle file upload
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get upload server
    const serverResponse = await fetch(
      `${BASE_URL}/upload/server?key=${API_KEY}`
    );
    const serverData = await serverResponse.json();

    if (serverData.status !== 200) {
      return NextResponse.json(
        { error: "Failed to get upload server" },
        { status: 400 }
      );
    }

    // Upload to media.cm
    const uploadFormData = new FormData();
    uploadFormData.append("key", API_KEY);
    uploadFormData.append("file", file);
    if (title) uploadFormData.append("file_title", title);
    if (description) uploadFormData.append("file_descr", description);

    const uploadResponse = await fetch(serverData.result, {
      method: "POST",
      body: uploadFormData,
    });

    const uploadResult = await uploadResponse.json();
    return NextResponse.json(uploadResult);
  } catch (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const file_code = searchParams.get("file_code");

  if (action === "delete" && file_code) {
    try {
      const response = await fetch(
        `${BASE_URL}/file/delete?key=${API_KEY}&del_code=${file_code}`
      );
      const data = await response.json();

      if (data.status === 200) {
        return NextResponse.json(data);
      }

      return NextResponse.json(
        { error: data.msg || "Failed to delete video" },
        { status: 400 }
      );
    } catch (error) {
      console.error("Delete failed:", error);
      return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
  }

  return NextResponse.json(
    { error: "Invalid action or missing file_code" },
    { status: 400 }
  );
}
