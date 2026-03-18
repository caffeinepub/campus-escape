import { Leaf } from "lucide-react";
import { SiFacebook, SiInstagram, SiX } from "react-icons/si";

export default function Footer() {
  const year = new Date().getFullYear();
  const hostname = encodeURIComponent(window.location.hostname);
  const caffeineUrl = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${hostname}`;

  return (
    <footer className="border-t border-border bg-background mt-20">
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <Leaf className="w-5 h-5" />
            <span className="font-display">Farm to Home</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
            {["About", "FAQ", "Contact", "Careers", "Terms"].map((l) => (
              <a
                key={l}
                href="/"
                className="hover:text-foreground transition-colors"
              >
                {l}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-4 text-muted-foreground">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-foreground transition-colors"
            >
              <SiInstagram className="w-5 h-5" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="hover:text-foreground transition-colors"
            >
              <SiFacebook className="w-5 h-5" />
            </a>
            <a
              href="https://x.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              className="hover:text-foreground transition-colors"
            >
              <SiX className="w-4 h-4" />
            </a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            © {year}. Built with ❤️ using{" "}
            <a
              href={caffeineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              caffeine.ai
            </a>
          </span>
          <a href="/" className="hover:text-foreground transition-colors">
            Privacy Policy
          </a>
        </div>
      </div>
    </footer>
  );
}
