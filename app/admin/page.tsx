import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import AdminPanel from "@/components/admin/AdminPanel";

export default function AdminPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/10 to-gray-900">
            <Navbar />
            <div className="pt-24 pb-12">
                <AdminPanel />
            </div>
            <Footer />
        </main>
    );
}
