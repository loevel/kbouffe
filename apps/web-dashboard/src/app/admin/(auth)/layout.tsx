export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 font-sans">
            {children}
        </div>
    );
}
