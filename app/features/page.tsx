import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Features from "@/components/landing/Features";

export default function FeaturesPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/10 to-gray-900">
            <Navbar />
            <div className="pt-24 pb-12">
                <Features />
            </div>
            <Footer />
        </main>
    );
}
