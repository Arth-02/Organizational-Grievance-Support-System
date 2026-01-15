import { Link } from 'react-router-dom';
import { 
  Linkedin, 
  Mail, 
  Phone,
  MapPin
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Custom SVG icons for social media (replacing deprecated Lucide icons)
 * These provide better accessibility and theme compatibility
 */
const XIcon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const GitHubIcon = ({ className }) => (
  <svg 
    viewBox="0 0 24 24" 
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
  </svg>
);

/**
 * Footer link columns configuration
 * Requirements: 9.2 - Links organized in columns: Product, Company, Resources, Legal
 */
const footerLinks = {
  product: {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features' },
      { label: 'Pricing', href: '#pricing' },
      { label: 'Integrations', href: '#integrations' },
      { label: 'Changelog', href: '#changelog' },
      { label: 'Roadmap', href: '#roadmap' },
    ],
  },
  company: {
    title: 'Company',
    links: [
      { label: 'About Us', href: '#about' },
      { label: 'Careers', href: '#careers' },
      { label: 'Blog', href: '#blog' },
      { label: 'Press', href: '#press' },
      { label: 'Partners', href: '#partners' },
    ],
  },
  resources: {
    title: 'Resources',
    links: [
      { label: 'Documentation', href: '#docs' },
      { label: 'Help Center', href: '#help' },
      { label: 'API Reference', href: '#api' },
      { label: 'Community', href: '#community' },
      { label: 'Webinars', href: '#webinars' },
    ],
  },
  legal: {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '#privacy' },
      { label: 'Terms of Service', href: '#terms' },
      { label: 'Cookie Policy', href: '#cookies' },
      { label: 'Security', href: '#security' },
      { label: 'GDPR', href: '#gdpr' },
    ],
  },
};

/**
 * Social media links configuration
 * Requirements: 9.3 - Include social media links
 * Using custom SVG icons for better accessibility and theme compatibility
 */
const socialLinks = [
  { icon: XIcon, href: 'https://twitter.com', label: 'X (Twitter)' },
  { icon: FacebookIcon, href: 'https://facebook.com', label: 'Facebook' },
  { icon: Linkedin, href: 'https://linkedin.com', label: 'LinkedIn' },
  { icon: GitHubIcon, href: 'https://github.com', label: 'GitHub' },
];


/**
 * Footer - Comprehensive footer with links, social media, and contact info
 *
 * Responsive Design (Requirement 10.1):
 * - Mobile (320px-767px): Single column, stacked sections
 * - Tablet (768px-1023px): 2-column layout
 * - Desktop (1024px+): 6-column layout with brand section spanning 2 columns
 *
 * Requirements:
 * - 9.1: Include application logo and brief description
 * - 9.2: Contain links organized in columns: Product, Company, Resources, Legal
 * - 9.3: Include social media links
 * - 9.4: Display copyright information with current year
 * - 9.5: Include contact information or support link
 * - 11.1: WCAG 2.1 AA accessibility standards
 * - 11.2: Keyboard navigation support
 * - 11.3: Proper ARIA labels and semantic HTML
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (e, href) => {
    // Handle internal anchor links with smooth scroll
    if (href.startsWith('#')) {
      e.preventDefault();
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      
      if (element) {
        const navbarHeight = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
  };

  return (
    <footer 
      className="bg-muted/30 border-t border-border/50"
      role="contentinfo"
      aria-label="Site footer"
    >
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8 lg:gap-12">
          {/* Brand Section - Requirement 9.1 */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link 
              to="/" 
              className="text-xl sm:text-2xl font-bold text-primary hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              aria-label="OrgX Home"
            >
              OrgX
            </Link>
            <p className="mt-3 sm:mt-4 text-muted-foreground text-xs sm:text-sm leading-relaxed max-w-xs">
              Streamline your organization&apos;s workflow with our comprehensive platform 
              for project management, grievance handling, and team collaboration.
            </p>
            
            {/* Contact Info - Requirement 9.5 */}
            <address className="mt-4 sm:mt-6 space-y-2 sm:space-y-3 not-italic">
              <a 
                href="mailto:support@orgx.com" 
                className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                <span>support@orgx.com</span>
              </a>
              <a 
                href="tel:+1234567890" 
                className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
              >
                <Phone className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                <span>+1 (234) 567-890</span>
              </a>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                <span>San Francisco, CA</span>
              </div>
            </address>

            {/* Social Links - Requirement 9.3 */}
            <nav className="mt-4 sm:mt-6" aria-label="Social media links">
              <ul className="flex items-center gap-3 sm:gap-4">
                {socialLinks.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'p-1.5 sm:p-2 rounded-lg text-muted-foreground inline-flex',
                        'hover:text-foreground hover:bg-muted transition-all',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                      )}
                      aria-label={`Follow us on ${social.label}`}
                    >
                      <social.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Link Columns - Requirement 9.2 */}
          {Object.values(footerLinks).map((column) => (
            <nav key={column.title} aria-label={`${column.title} links`}>
              <h3 className="font-semibold text-foreground mb-3 sm:mb-4 text-sm sm:text-base">
                {column.title}
              </h3>
              <ul className="space-y-2 sm:space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className={cn(
                        'text-xs sm:text-sm text-muted-foreground',
                        'hover:text-foreground transition-colors',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded'
                      )}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      {/* Bottom Bar - Requirement 9.4 */}
      <div className="border-t border-border/50">
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
            {/* Copyright - Requirement 9.4 */}
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              &copy; {currentYear} OrgX. All rights reserved.
            </p>

            {/* Additional Bottom Links */}
            <nav aria-label="Legal links">
              <ul className="flex items-center gap-4 sm:gap-6">
                <li>
                  <a
                    href="#privacy"
                    onClick={(e) => handleLinkClick(e, '#privacy')}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Privacy
                  </a>
                </li>
                <li>
                  <a
                    href="#terms"
                    onClick={(e) => handleLinkClick(e, '#terms')}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Terms
                  </a>
                </li>
                <li>
                  <a
                    href="#cookies"
                    onClick={(e) => handleLinkClick(e, '#cookies')}
                    className="text-xs sm:text-sm text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Cookies
                  </a>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
