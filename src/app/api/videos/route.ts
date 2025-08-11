import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Fetch video links from database
    const { data: videoLinks, error: dbError } = await supabaseAdmin
      .from("video_links")
      .select("*")
      .order("created_at", { ascending: false });

    if (dbError) {
      console.error("Database error:", dbError);
    }

    // Fetch storage files
    const { data: files, error: storageError } = await supabaseAdmin.storage
      .from("videos")
      .list("", {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (storageError) {
      console.error("Storage error:", storageError);
    }

    // Process storage files
    const filesWithUrls =
      files?.map((file) => {
        const { data: urlData } = supabaseAdmin.storage
          .from("videos")
          .getPublicUrl(file.name);

        return {
          ...file,
          publicUrl: urlData.publicUrl,
          isDirectVideo: false,
        };
      }) || [];

    // Process database links
    const directVideos =
      videoLinks?.map((link) => ({
        id: link.id,
        name: link.url.split("/").pop()?.split(".")[0] || "Untitled Video",
        url: link.url,
        publicUrl: link.url,
        created_at: link.created_at,
        isDirectVideo: true,
        metadata: { mimetype: "video/mp4" },
      })) || [];

    return NextResponse.json({
      files: [...directVideos, ...filesWithUrls],
      total: directVideos.length + filesWithUrls.length,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("video_links")
      .insert({ url })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: `Failed to add video link: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
