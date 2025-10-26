import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import HowItWorks from "@/components/landing/HowItWorks";

export default function HowItWorksPage() {
    return (
        <main className="min-h-screen bg-gradient-to-b from-gray-900 via-blue-900/10 to-gray-900">
            <Navbar />
            <div className="pt-24 pb-12">
                <HowItWorks />
            </div>
            <Footer />
        </main>
    );
}
