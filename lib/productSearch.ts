export type ProductSortKey = "newest" | "price-asc" | "price-desc" | "discount-desc" | "name-asc";

export interface ProductSearchOptions {
  q?: string;
  category?: string;
  sort?: string;
  minPrice?: string | null;
  maxPrice?: string | null;
  inStock?: string | null;
  limit?: string | null;
}

export interface ProductQueryPlan {
  whereSql: string;
  params: unknown[];
  orderBySql: string;
  limit: number;
}

function escapeRegex(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function parseNumber(value: string | null | undefined) {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function buildProductQuery(options: ProductSearchOptions): ProductQueryPlan {
  const conditions: string[] = [];
  const params: unknown[] = [];
  const q = options.q?.trim();
  const category = options.category?.trim();

  if (category) {
    params.push(category);
    conditions.push(`category = $${params.length}`);
  }

  if (q) {
    const like = `%${escapeRegex(q)}%`;
    params.push(like);
    const param = `$${params.length}`;
    conditions.push(
      `(
        name ILIKE ${param} ESCAPE '\\' OR
        description ILIKE ${param} ESCAPE '\\' OR
        brand ILIKE ${param} ESCAPE '\\' OR
        author ILIKE ${param} ESCAPE '\\' OR
        flavor ILIKE ${param} ESCAPE '\\' OR
        material ILIKE ${param} ESCAPE '\\' OR
        category ILIKE ${param} ESCAPE '\\'
      )`
    );
  }

  const minPrice = parseNumber(options.minPrice);
  const maxPrice = parseNumber(options.maxPrice);
  if (minPrice !== null || maxPrice !== null) {
    if (minPrice !== null) {
      params.push(minPrice);
      conditions.push(`price >= $${params.length}`);
    }
    if (maxPrice !== null) {
      params.push(maxPrice);
      conditions.push(`price <= $${params.length}`);
    }
  }

  if (options.inStock === "true") {
    conditions.push(`(stock IS NULL OR stock > 0)`);
  }

  const sortKey = (options.sort as ProductSortKey | undefined) ?? (q ? "newest" : "newest");
  if (sortKey === "price-asc") {
    return { whereSql: buildWhere(conditions), params, orderBySql: "ORDER BY price ASC, created_at DESC", limit: clampLimit(options.limit) };
  }
  if (sortKey === "price-desc") {
    return { whereSql: buildWhere(conditions), params, orderBySql: "ORDER BY price DESC, created_at DESC", limit: clampLimit(options.limit) };
  }
  if (sortKey === "discount-desc") {
    return { whereSql: buildWhere(conditions), params, orderBySql: "ORDER BY discount DESC, created_at DESC", limit: clampLimit(options.limit) };
  }
  if (sortKey === "name-asc") {
    return { whereSql: buildWhere(conditions), params, orderBySql: "ORDER BY name ASC, created_at DESC", limit: clampLimit(options.limit) };
  }

  return { whereSql: buildWhere(conditions), params, orderBySql: "ORDER BY created_at DESC", limit: clampLimit(options.limit) };
}

function buildWhere(conditions: string[]) {
  return conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
}

export function clampLimit(value: string | null | undefined) {
  const parsed = parseNumber(value);
  if (parsed === null) return 48;
  return Math.max(1, Math.min(100, Math.floor(parsed)));
}
