import { MessageCircle, Phone, Mail, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-card/30 backdrop-blur-sm">
      <div className="px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left: copyright */}
          <p className="text-xs text-muted-foreground text-center md:text-left">
            All Rights Reserved — Digi Formation LTD
          </p>

          {/* Right: contact links */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <a
              href="https://wa.me/digiformationltd"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </a>

            <a
              href="tel:0316-4467464"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Phone className="h-3.5 w-3.5" />
              0316-4467464
            </a>

            <a
              href="mailto:info@digiformation.uk"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" />
              info@digiformation.uk
            </a>

            <a
              href="https://www.digiformation.uk"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <Globe className="h-3.5 w-3.5" />
              www.digiformation.uk
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
