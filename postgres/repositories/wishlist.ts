import { query } from "../lib/db";

export interface WishlistFolder {
  id: string;
  name: string;
  isDefault: boolean;
  itemCount: number;
}

async function ensureDefaultFolder(userId: string): Promise<string> {
  const { rows } = await query<{ id: string }>(
    `INSERT INTO wishlist_folders (user_id, name, is_default)
     VALUES ($1, 'My Wishlist', true)
     ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [userId]
  );
  return rows[0].id;
}

export async function getUserFolders(userId: string): Promise<WishlistFolder[]> {
  const { rows } = await query<{ id: string; name: string; isDefault: boolean; itemCount: number }>(
    `SELECT f.id, f.name, f.is_default AS "isDefault",
            COUNT(w.id)::int AS "itemCount"
     FROM wishlist_folders f
     LEFT JOIN wishlists w ON w.folder_id = f.id
     WHERE f.user_id = $1
     GROUP BY f.id
     ORDER BY f.is_default DESC, f.created_at ASC`,
    [userId]
  );
  if (rows.length === 0) {
    await ensureDefaultFolder(userId);
    return getUserFolders(userId);
  }
  return rows;
}

export async function createFolder(userId: string, name: string): Promise<WishlistFolder> {
  const { rows } = await query<{ id: string; name: string; isDefault: boolean }>(
    `INSERT INTO wishlist_folders (user_id, name, is_default)
     VALUES ($1, $2, false)
     RETURNING id, name, is_default AS "isDefault"`,
    [userId, name.trim()]
  );
  return { ...rows[0], itemCount: 0 };
}

export async function renameFolder(userId: string, folderId: string, name: string): Promise<void> {
  await query(
    `UPDATE wishlist_folders SET name = $3, updated_at = now() WHERE id = $1 AND user_id = $2`,
    [folderId, userId, name.trim()]
  );
}

export async function deleteFolder(userId: string, folderId: string): Promise<void> {
  // Never allow deleting the default folder — reassign its items instead of losing them
  const { rows } = await query<{ isDefault: boolean }>(
    `SELECT is_default AS "isDefault" FROM wishlist_folders WHERE id = $1 AND user_id = $2`,
    [folderId, userId]
  );
  if (!rows.length || rows[0].isDefault) return;
  await query(`DELETE FROM wishlist_folders WHERE id = $1 AND user_id = $2`, [folderId, userId]);
}

/** All product IDs across every folder — used for the navbar wishlist-count badge etc. */
export async function getUserWishlist(userId: string, folderId?: string): Promise<string[]> {
  const { rows } = await query<{ productId: string }>(
    folderId
      ? `SELECT product_id AS "productId" FROM wishlists WHERE user_id = $1 AND folder_id = $2 ORDER BY created_at DESC`
      : `SELECT product_id AS "productId" FROM wishlists WHERE user_id = $1 ORDER BY created_at DESC`,
    folderId ? [userId, folderId] : [userId]
  );
  return rows.map(r => r.productId);
}

export async function getWishlistCount(userId: string): Promise<number> {
  const { rows } = await query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM wishlists WHERE user_id = $1`,
    [userId]
  );
  return rows[0]?.count ?? 0;
}

/** Which of the user's folders currently contain this product — for the product-page picker. */
export async function getFoldersForProduct(userId: string, productId: string): Promise<string[]> {
  const { rows } = await query<{ folderId: string }>(
    `SELECT folder_id AS "folderId" FROM wishlists WHERE user_id = $1 AND product_id = $2`,
    [userId, productId]
  );
  return rows.map(r => r.folderId);
}

export async function isProductWishlisted(userId: string, productId: string): Promise<boolean> {
  const { rows } = await query(
    `SELECT 1 FROM wishlists WHERE user_id = $1 AND product_id = $2 LIMIT 1`,
    [userId, productId]
  );
  return rows.length > 0;
}

export async function addToWishlist(userId: string, productId: string, folderId?: string): Promise<void> {
  const resolvedFolderId = folderId || (await ensureDefaultFolder(userId));
  await query(
    `INSERT INTO wishlists (user_id, product_id, folder_id) VALUES ($1, $2, $3)
     ON CONFLICT (user_id, product_id, folder_id) DO NOTHING`,
    [userId, productId, resolvedFolderId]
  );
}

export async function removeFromWishlist(userId: string, productId: string, folderId?: string): Promise<boolean> {
  const resolvedFolderId = folderId || (await ensureDefaultFolder(userId));
  const { rowCount } = await query(
    `DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2 AND folder_id = $3`,
    [userId, productId, resolvedFolderId]
  );
  return (rowCount ?? 0) > 0;
}

/** Remove a product from every one of the user's folders (used by the wishlist page's × button). */
export async function removeFromAllFolders(userId: string, productId: string): Promise<void> {
  await query(`DELETE FROM wishlists WHERE user_id = $1 AND product_id = $2`, [userId, productId]);
}