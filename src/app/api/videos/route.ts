import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const fileName = searchParams.get("fileName");
    const isDirectVideo = searchParams.get("isDirectVideo") === "true";

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    // If it's a direct video link, delete from database
    if (isDirectVideo) {
      const { error } = await supabaseAdmin
        .from("video_links")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Database delete error:", error);
        return NextResponse.json(
          { error: `Failed to delete video link: ${error.message}` },
          { status: 500 }
        );
      }
    } else {
      // If it's a storage file, delete from storage bucket
      if (!fileName) {
        return NextResponse.json(
          { error: "File name is required for storage files" },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin.storage
        .from("videos")
        .remove([fileName]);

      if (error) {
        console.error("Storage delete error:", error);
        return NextResponse.json(
          { error: `Failed to delete file: ${error.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
