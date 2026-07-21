import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import { createProduct, listProductsByVendor } from "@/postgres/repositories/products";
import { toApiProduct } from "@/lib/apiTransform";

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);

    if (user.role !== "vendor" && user.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();

    const {
      name,
      description,
      category,
      actualPrice,
      price,
      discount,
      image,
      weight,
      dimensions,
      size,
      brand,
      author,
      material,
      flavor,
      maxCoinRedemptionPercent,
      stock,
    } = body;

    if (
      !name ||
      !description ||
      !category ||
      !actualPrice ||
      !price ||
      !image
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate and normalize maxCoinRedemptionPercent (0-100, default 10)
    let coinPercent = 10;
    if (maxCoinRedemptionPercent !== undefined && maxCoinRedemptionPercent !== "") {
      const parsed = Number(maxCoinRedemptionPercent);
      if (Number.isNaN(parsed) || parsed < 0 || parsed > 100) {
        return NextResponse.json(
          { error: "Max coin redemption percent must be between 0 and 100" },
          { status: 400 }
        );
      }
      coinPercent = parsed;
    }

    let stockValue: number | undefined;
    if (stock !== undefined && stock !== "") {
      const parsedStock = Number(stock);
      if (Number.isNaN(parsedStock) || parsedStock < 0) {
        return NextResponse.json(
          { error: "Stock must be a non-negative number" },
          { status: 400 }
        );
      }
      stockValue = parsedStock;
    }

    const product = await createProduct({
      vendorId: user.userId,
      name,
      description,
      category,
      actualPrice: Number(actualPrice),
      price: Number(price),
      discount: Number(discount),
      image,
      weight,
      dimensions,
      size,
      brand,
      author,
      material,
      flavor,
      maxCoinRedemptionPercent: coinPercent,
      ...(stockValue !== undefined ? { stock: stockValue } : {}),
    });

    return NextResponse.json(
      {
        message: "Product created successfully",
        product: toApiProduct(product),
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await verifyToken(token);

    const products = await listProductsByVendor(user.userId);

    return NextResponse.json({ products: products.map(toApiProduct) });
  } catch (err) {
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
