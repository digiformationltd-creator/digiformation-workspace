import { Phone, Mail, Globe } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-card/30 backdrop-blur-sm">
      <div className="px-4 py-4 md:px-6 md:py-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Left: copyright */}
          <p className="text-xs text-muted-foreground text-center md:text-left">
            All Rights Reserved — Digiformation Ltd
          </p>

          {/* Right: contact links */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4">
            <a
              href="https://wa.me/923164467464"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              title="Chat on WhatsApp"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] shadow-sm transition-transform hover:scale-110 hover:bg-[#1ebe5d]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 32 32"
                className="h-5 w-5"
                fill="white"
              >
                <path d="M19.11 17.205c-.372 0-1.088 1.39-1.518 1.39a.63.63 0 0 1-.315-.1c-.802-.402-1.504-.817-2.163-1.447-.545-.516-1.146-1.29-1.46-1.963a.426.426 0 0 1-.073-.215c0-.33.99-.945.99-1.49 0-.143-.73-2.09-.832-2.335-.143-.372-.214-.487-.6-.487-.187 0-.36-.043-.53-.043-.302 0-.53.115-.746.315-.688.645-1.032 1.318-1.06 2.264v.114c-.015.99.472 1.977 1.017 2.78 1.23 1.82 2.506 3.41 4.554 4.34.616.287 2.035.888 2.722.888.817 0 2.15-.515 2.478-1.318.13-.33.244-.673.244-1.03 0-.114 0-.114-.014-.215-.014-.143-2.106-.953-2.478-.953zm-2.92 6.453a8.74 8.74 0 0 1-4.43-1.214l-3.18.83.86-3.082a8.66 8.66 0 0 1-1.343-4.652c0-4.808 3.912-8.72 8.72-8.72 4.808 0 8.72 3.912 8.72 8.72 0 4.808-3.912 8.718-8.72 8.718zM16.19 4.74C9.985 4.74 4.965 9.76 4.965 15.965c0 1.86.45 3.66 1.317 5.293L4.5 27.5l6.42-1.66a11.46 11.46 0 0 0 5.27 1.297c6.205 0 11.225-5.02 11.225-11.225S22.395 4.74 16.19 4.74z" />
              </svg>
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
