/**
 * GET /api/admin/backup/export
 * Full or partial system backup — super admin only.
 *
 * Query params:
 *   tables   = comma-separated list (all | restaurants,users,orders,...)
 *   format   = json (default) | csv (only for single table)
 *   from     = ISO date string (optional, filters by created_at)
 *   to       = ISO date string (optional)
 */
import { NextRequest, NextResponse } from "next/server";
import { withAdmin } from "@/lib/api/helpers";

const EXPORTABLE_TABLES = [
    "restaurants",
    "users",
    "orders",
    "order_items",
    "products",
    "categories",
    "reviews",
    "marketplace_services",
    "marketplace_purchases",
    "platform_integrations",
    "restaurant_notifications",
    "social_accounts",
    "social_posts",
] as const;

type ExportableTable = (typeof EXPORTABLE_TABLES)[number];

/** Convert array of objects to CSV string */
function toCSV(rows: Record<string, any>[]): string {
    if (!rows.length) return "";
    const headers = Object.keys(rows[0]);
    const escape = (v: any) => {
        const s = v === null || v === undefined ? "" : String(v);
        return s.includes(",") || s.includes('"') || s.includes("\n")
            ? `"${s.replace(/"/g, '""')}"`
            : s;
    };
    return [
        headers.join(","),
        ...rows.map(row => headers.map(h => escape(row[h])).join(",")),
    ].join("\n");
}

export async function GET(request: NextRequest) {
    const auth = await withAdmin();
    if (auth.error) return auth.error;
    const { supabase } = auth.ctx;
    const db = supabase as any;

    const { searchParams } = new URL(request.url);
    const tablesParam = searchParams.get("tables") ?? "all";
    const format = (searchParams.get("format") ?? "json") as "json" | "csv";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Resolve which tables to export
    const tablesToExport: ExportableTable[] =
        tablesParam === "all"
            ? [...EXPORTABLE_TABLES]
            : tablesParam
                  .split(",")
                  .map(t => t.trim())
                  .filter((t): t is ExportableTable =>
                      EXPORTABLE_TABLES.includes(t as ExportableTable)
                  );

    if (tablesToExport.length === 0) {
        return NextResponse.json({ error: "Aucune table valide spécifiée" }, { status: 400 });
    }

    if (format === "csv" && tablesToExport.length > 1) {
        return NextResponse.json(
            { error: "Le format CSV ne supporte qu'une seule table à la fois" },
            { status: 400 }
        );
    }

    try {
        const snapshot: Record<string, any[]> = {};
        let totalRows = 0;

        for (const table of tablesToExport) {
            let query = db.from(table).select("*");

            // Apply date filter if table has created_at
            if (from) query = query.gte("created_at", from);
            if (to) query = query.lte("created_at", to);

            // Exclude sensitive columns for security
            if (table === "platform_integrations") {
                query = db
                    .from(table)
                    .select("id, key_name, is_secret, category, label, description, updated_at")
                    .order("category");
            }

            // Limit per table to 50k rows for safety
            query = query.limit(50000);

            const { data, error } = await query;
            if (error) {
                console.warn(`[backup] Error fetching ${table}:`, error.message);
                snapshot[table] = [];
            } else {
                snapshot[table] = data ?? [];
                totalRows += snapshot[table].length;
            }
        }

        const date = new Date().toISOString().split("T")[0];
        const time = new Date().toISOString().split("T")[1].slice(0, 8).replace(/:/g, "-");

        if (format === "csv") {
            const table = tablesToExport[0];
            const csv = toCSV(snapshot[table]);
            return new NextResponse(csv, {
                status: 200,
                headers: {
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": `attachment; filename="kbouffe-backup-${table}-${date}.csv"`,
                    "X-Export-Rows": String(totalRows),
                },
            });
        }

        // JSON export
        const payload = {
            backup_metadata: {
                version: "1.0",
                exported_at: new Date().toISOString(),
                tables: tablesToExport,
                total_rows: totalRows,
                date_filter: from || to ? { from, to } : null,
                platform: "kBouffe",
                warning: "Ce fichier contient des données sensibles. Ne pas partager.",
            },
            data: snapshot,
        };

        const scopeLabel =
            tablesParam === "all" ? "full" : tablesToExport.join("-");
        const filename = `kbouffe-backup-${scopeLabel}-${date}-${time}.json`;

        return new NextResponse(JSON.stringify(payload, null, 2), {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="${filename}"`,
                "X-Export-Rows": String(totalRows),
                "X-Export-Tables": tablesToExport.join(","),
            },
        });
    } catch (err) {
        console.error("[GET /api/admin/backup/export]", err);
        return NextResponse.json({ error: "Erreur lors de la génération du backup" }, { status: 500 });
    }
}
