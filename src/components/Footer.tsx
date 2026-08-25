import { Phone, Mail, Globe, MapPin, Building2, Linkedin, Facebook, Instagram, Youtube, Twitter, Link2, BadgeCheck } from "lucide-react";

const SOCIAL_LINKS = [
  { href: "https://wa.me/923164467464", label: "WhatsApp", icon: null, brand: "bg-[#25D366] hover:bg-[#1ebe5d]", svg: true },
  { href: "https://www.linkedin.com/in/muhammad-haroon-9a9945366", label: "LinkedIn", icon: Linkedin, brand: "bg-[#0A66C2] hover:bg-[#0a4f94]" },
  { href: "https://www.facebook.com/share/1D676UBQw5/", label: "Facebook", icon: Facebook, brand: "bg-[#1877F2] hover:bg-[#135dbb]" },
  { href: "https://www.instagram.com/digiformationltd?igsh=ejBoMmFsOXFpMmdw", label: "Instagram", icon: Instagram, brand: "bg-gradient-to-br from-[#feda75] via-[#d62976] to-[#962fbf] hover:opacity-90" },
  { href: "https://www.youtube.com/@digiformationltd?si=wy_K54l1UISmVHJI", label: "YouTube", icon: Youtube, brand: "bg-[#FF0000] hover:bg-[#cc0000]" },
  { href: "https://x.com/Digiformation00", label: "X (Twitter)", icon: Twitter, brand: "bg-foreground hover:opacity-80" },
  { href: "https://www.threads.com/@digiformationltd?invite=0", label: "Threads", icon: null, brand: "bg-foreground hover:opacity-80", svg: true },
  { href: "https://pin.it/27w3dT5lp", label: "Pinterest", icon: null, brand: "bg-[#E60023] hover:bg-[#b8001c]", svg: true },
  { href: "https://linktr.ee/digiformationltd", label: "Linktree", icon: Link2, brand: "bg-[#43E660] hover:bg-[#36c152]" },
];

function WhatsAppIcon({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className} fill="currentColor">
      <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.673.244-1.03 0-.114 0-.114-.014-.215-.014-.143-2.106-.953-2.478-.953zm-2.92 6.453a8.74 8.74 0 0 1-4.43-1.214l-3.18.83.86-3.082a8.66 8.66 0 0 1-1.343-4.652c0-4.808 3.912-8.72 8.72-8.72 4.808 0 8.72 3.912 8.72 8.72 0 4.808-3.912 8.718-8.72 8.718zM16.19 4.74C9.985 4.74 4.965 9.76 4.965 15.965c0 1.86.45 3.66 1.317 5.293L4.5 27.5l6.42-1.66a11.46 11.46 0 0 0 5.27 1.297c6.205 0 11.225-5.02 11.225-11.225S22.395 4.74 16.19 4.74z" />
    </svg>
  );
}

function ThreadsIcon({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.465-8.184-4.281C2.35 17.119 1.75 13.89 1.71 12.05v-.052c0-1.84.59-5.07 2.27-7.65C5.83 1.49 8.58.024 12.18 0h.014c2.746.02 5.043.726 6.826 2.098 1.648 1.27 2.764 3.05 3.32 5.293l-2.17.545c-.44-1.74-1.26-3.08-2.49-4.06-1.42-1.14-3.24-1.73-5.41-1.75-2.81.02-4.97 1.13-6.42 3.3-1.4 2.07-1.88 4.88-1.88 6.47 0 1.59.48 4.4 1.88 6.47 1.45 2.17 3.61 3.28 6.42 3.3 2.03-.02 3.73-.55 5.06-1.59 1.37-1.07 2.18-2.62 2.42-4.62.13-1.07.01-2.07-.02-2.54h-7.4v-2.25h9.6l.03.41c.1 1.32.16 2.61-.02 4.2-.41 3.52-2.31 6.13-5.5 7.55-1.42.62-3.04.94-4.82.96z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.648 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12.017 24c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-card/30 backdrop-blur-sm">
      <div className="px-4 py-6 md:px-6 md:py-8">
        <div className="mx-auto max-w-6xl">
          {/* Top: Brand + About */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Brand block */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="text-sm font-bold text-foreground">Digiformation Ltd</span>
              </div>
              <p className="text-xs leading-relaxed text-muted-foreground">
                Officially registered UK corporate entity (Company No. 16994903). Specialized in
                UK Company Formation, USA LLC Registration, Corporate Compliance, Business Banking
                &amp; Payment Solutions, AI WhatsApp Sales Automation &amp; Custom Software
                Development.
              </p>
              <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                <span>Office 1006, 85 Dunstall Hill, Wolverhampton, United Kingdom</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">Founder:</span>
                <span>Muhammad Haroon</span>
              </div>
            </div>

            {/* Contact block */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Contact
              </h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>
                  <a
                    href="https://www.digiformation.co.uk/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <Globe className="h-3.5 w-3.5 text-primary/70" />
                    www.digiformation.co.uk
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@digiformation.co.uk"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <Mail className="h-3.5 w-3.5 text-primary/70" />
                    info@digiformation.co.uk
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/923164467464"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <Phone className="h-3.5 w-3.5 text-primary/70" />
                    +92 316 446 7464
                  </a>
                </li>
                <li>
                  <a
                    href="https://linktr.ee/digiformationltd"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
                  >
                    <Link2 className="h-3.5 w-3.5 text-primary/70" />
                    linktr.ee/digiformationltd
                  </a>
                </li>
              </ul>
            </div>

            {/* Product block */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/80">
                Product
              </h4>
              <div className="rounded-lg border border-border/60 bg-background/40 p-3">
                <p className="text-xs font-semibold text-foreground">
                  Universal WhatsApp AI Sales Agent
                </p>
                <p className="text-[10px] text-muted-foreground">v2.0 PRO</p>
                <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                  Business-agnostic conversational sales engine — Multi-account Baileys QR pairing,
                  8-stage deterministic sales state machine, Groq Whisper STT with Roman Urdu &amp;
                  English, persistent local SQLite memory, zero-hallucination pricing integrity.
                </p>
              </div>
              <a
                href="https://find-and-update.company-information.service.gov.uk/company/16994903"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />
                Verified on Companies House (GOV.UK)
              </a>
            </div>
          </div>

          {/* Social row */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 border-t border-border/50 pt-5">
            {SOCIAL_LINKS.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                title={s.label}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-white shadow-sm transition-transform hover:scale-110 ${s.brand}`}
              >
                {s.svg ? (
                  s.label === "WhatsApp" ? (
                    <WhatsAppIcon className="h-4 w-4" />
                  ) : s.label === "Threads" ? (
                    <ThreadsIcon className="h-4 w-4" />
                  ) : (
                    <PinterestIcon className="h-4 w-4" />
                  )
                ) : (
                  <s.icon className="h-4 w-4" />
                )}
              </a>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-5 flex flex-col items-center gap-1 border-t border-border/50 pt-4 text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 Digiformation Ltd. All rights reserved.
            </p>
            <p className="text-[10px] text-muted-foreground/70">
              Designed &amp; engineered in-house by Digiformation Ltd — Wolverhampton, United Kingdom
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
