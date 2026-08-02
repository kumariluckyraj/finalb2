import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/jwt";
import ExcelJS from "exceljs";
import { listVisitorSessionsForExport, listPageViewsForExport } from "@/postgres/repositories/analytics";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (user.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const days = parseInt(req.nextUrl.searchParams.get("days") ?? "30");
    const [sessions, pageViews] = await Promise.all([
      listVisitorSessionsForExport(days),
      listPageViewsForExport(days),
    ]);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Admin Export";
    workbook.created = new Date();

    const summarySheet = workbook.addWorksheet("Visitors Summary");
    summarySheet.columns = [
      { header: "Visitor ID", key: "visitor_id", width: 38 },
      { header: "First Seen", key: "first_seen", width: 20 },
      { header: "Last Seen", key: "last_seen", width: 20 },
      { header: "Visit Count", key: "visit_count", width: 12 },
      { header: "Landing Page", key: "landing_path", width: 24 },
      { header: "Last Page", key: "last_path", width: 24 },
      { header: "Referrer", key: "referrer", width: 28 },
      { header: "UTM Source", key: "utm_source", width: 16 },
      { header: "UTM Medium", key: "utm_medium", width: 16 },
      { header: "UTM Campaign", key: "utm_campaign", width: 16 },
      { header: "User Agent", key: "user_agent", width: 40 },
      { header: "Converted?", key: "converted", width: 12 },
    ];
    summarySheet.getRow(1).font = { bold: true };
    for (const s of sessions) {
      summarySheet.addRow({
        visitor_id: s.visitor_id,
        first_seen: new Date(s.first_seen).toLocaleString("en-IN"),
        last_seen: new Date(s.last_seen).toLocaleString("en-IN"),
        visit_count: s.visit_count,
        landing_path: s.landing_path,
        last_path: s.last_path,
        referrer: s.referrer || "Direct",
        utm_source: s.utm_source || "-",
        utm_medium: s.utm_medium || "-",
        utm_campaign: s.utm_campaign || "-",
        user_agent: s.user_agent || "-",
        converted: s.converted_user_id ? "Yes" : "No",
      });
    }

    const logSheet = workbook.addWorksheet("Page View Log");
    logSheet.columns = [
      { header: "Visitor ID", key: "visitor_id", width: 38 },
      { header: "Path", key: "path", width: 30 },
      { header: "Product ID", key: "product_id", width: 24 },
      { header: "Event Type", key: "event_type", width: 16 },
      { header: "Timestamp", key: "created_at", width: 20 },
    ];
    logSheet.getRow(1).font = { bold: true };
    for (const p of pageViews) {
      logSheet.addRow({
        visitor_id: p.visitor_id,
        path: p.path,
        product_id: p.product_id || "-",
        event_type: p.event_type,
        created_at: new Date(p.created_at).toLocaleString("en-IN"),
      });
    }

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="anonymous-visitors-${new Date().toISOString().slice(0, 10)}.xlsx"`,
      },
    });
  } catch (err) {
    console.error("GET /api/admin/analytics/visitors/export error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}