import { NextRequest, NextResponse } from "next/server";
import { query } from "@/postgres/lib/db";
import { getAuthUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { rows } = await query(
      "SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC, created_at DESC",
      [user.userId]
    );

    return NextResponse.json({ addresses: rows });
  } catch (error: any) {
    console.error("Fetch addresses error:", error);
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = body;

    if (!full_name || !phone || !address_line1 || !city || !state || !pincode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (is_default) {
      // Unset other defaults
      await query("UPDATE user_addresses SET is_default = false WHERE user_id = $1", [user.userId]);
    }

    const { rows } = await query(
      `INSERT INTO user_addresses (user_id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [user.userId, full_name, phone, address_line1, address_line2 || "", city, state, pincode, !!is_default]
    );

    return NextResponse.json({ address: rows[0] });
  } catch (error: any) {
    console.error("Create address error:", error);
    return NextResponse.json({ error: "Failed to create address" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, full_name, phone, address_line1, address_line2, city, state, pincode, is_default } = body;

    if (!id || !full_name || !phone || !address_line1 || !city || !state || !pincode) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (is_default) {
      await query("UPDATE user_addresses SET is_default = false WHERE user_id = $1", [user.userId]);
    }

    const { rows } = await query(
      `UPDATE user_addresses SET full_name=$1, phone=$2, address_line1=$3, address_line2=$4, city=$5, state=$6, pincode=$7, is_default=$8, updated_at=NOW() 
       WHERE id=$9 AND user_id=$10 RETURNING *`,
      [full_name, phone, address_line1, address_line2 || "", city, state, pincode, !!is_default, id, user.userId]
    );

    if (rows.length === 0) return NextResponse.json({ error: "Address not found" }, { status: 404 });
    return NextResponse.json({ address: rows[0] });
  } catch (error: any) {
    console.error("Update address error:", error);
    return NextResponse.json({ error: "Failed to update address" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user?.userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing address ID" }, { status: 400 });

    await query("DELETE FROM user_addresses WHERE id=$1 AND user_id=$2", [id, user.userId]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete address error:", error);
    return NextResponse.json({ error: "Failed to delete address" }, { status: 500 });
  }
}
