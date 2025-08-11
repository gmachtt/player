import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: files, error } = await supabaseAdmin.storage
      .from("videos")
      .list("", {
        limit: 100,
        offset: 0,
        sortBy: { column: "created_at", order: "desc" },
      });

    if (error) {
      return NextResponse.json(
        { error: `Failed to fetch files: ${error.message}` },
        { status: 500 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json({ files: [] });
    }

    const filesWithUrls = files.map((file) => {
      const { data: urlData } = supabaseAdmin.storage
        .from("videos")
        .getPublicUrl(file.name);

      return {
        ...file,
        publicUrl: urlData.publicUrl,
      };
    });

    return NextResponse.json({
      files: filesWithUrls,
      total: filesWithUrls.length,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
