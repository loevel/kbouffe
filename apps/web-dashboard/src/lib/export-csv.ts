function escapeCell(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (typeof value === "number") return String(value);
    const str = String(value);
    if (str.includes(",") || str.includes("\n") || str.includes('"')) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

export function exportToCSV(data: object[], filename: string): void {
    if (data.length === 0) return;

    const fn = filename.endsWith(".csv") ? filename : `${filename}.csv`;
    const rows = data as Record<string, unknown>[];
    const headers = Object.keys(rows[0]);

    const lines = [
        headers.join(","),
        ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
    ];

    const csv = lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fn;
    a.click();
    URL.revokeObjectURL(url);
}
