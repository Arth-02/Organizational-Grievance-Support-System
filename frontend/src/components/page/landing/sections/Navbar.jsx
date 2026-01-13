import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { cn } from '@/lib/utils';

/**
 * Navigation links for smooth scrolling to sections
 * Requirement 1.2: Include navigation links to Features, Pricing, and About sections
 */
const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Testimonials', href: '#testimonials' },
];

/**
 * Navbar - Fixed navigation with scroll-aware styling and mobile responsiveness
 * 
 * Requirements:
 * - 1.1: Display logo/brand name on the left
 * - 1.2: Include navigation links to Features, Pricing, and About sections
 * - 1.3: Include Login and "Get Started" CTA buttons on the right
 * - 1.4: Fixed position with scroll-aware background blur effect
 * - 1.5: Mobile hamburger menu with slide-in animation
 * - 1.6: Smooth scroll to sections on navigation link click
 * - 11.2: Keyboard navigation support for accessibility
 */
const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);
  const firstMenuItemRef = useRef(null);
  const lastMenuItemRef = useRef(null);

  // Handle scroll detection for background styling
  // Using passive event listener for better scroll performance
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 10);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const handleNavClick = useCallback((e, href) => {
    e.preventDefault();
    const targetId = href.replace('#', '');
    const element = document.getElementById(targetId);
    
    if (element) {
      const navbarHeight = 80; // Account for fixed navbar
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navbarHeight;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }

    // Close mobile menu after navigation
    setIsMobileMenuOpen(false);
  }, []);

  // Focus management and keyboard handling for mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isMobileMenuOpen) return;

      // Close on Escape
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
        menuButtonRef.current?.focus();
        return;
      }

      // Trap focus within mobile menu
      if (e.key === 'Tab') {
        const focusableElements = document.querySelectorAll(
          '#mobile-menu a[tabindex="0"], #mobile-menu button[tabindex="0"]'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
      // Focus first menu item when menu opens
      setTimeout(() => {
        firstMenuItemRef.current?.focus();
      }, 100);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-background/80 backdrop-blur-lg border-b border-border/50 shadow-sm'
          : 'bg-transparent'
      )}
    >
      <nav className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo/Brand - Requirement 1.1 */}
        <Link 
          to="/" 
          className="text-2xl font-bold text-primary hover:opacity-90 transition-opacity"
          aria-label="OGSS Home"
        >
          OGSS
        </Link>

        {/* Desktop Navigation Links - Requirement 1.2 */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Auth Buttons - Requirement 1.3 */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          <Link to="/login">
            <Button variant="ghost" size="sm">
              Login
            </Button>
          </Link>
          <Link to="/register">
            <Button size="sm">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Button - Requirement 1.5 */}
        <button
          ref={menuButtonRef}
          type="button"
          className="md:hidden p-2 text-foreground hover:bg-muted rounded-lg transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-menu"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </nav>

      {/* Mobile Menu - Requirement 1.5 (slide-in animation) */}
      <div
        id="mobile-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={cn(
          'md:hidden fixed inset-x-0 top-20 bottom-0 bg-background/95 backdrop-blur-lg transition-all duration-300 ease-in-out',
          isMobileMenuOpen
            ? 'opacity-100 translate-y-0 pointer-events-auto'
            : 'opacity-0 -translate-y-4 pointer-events-none'
        )}
        aria-hidden={!isMobileMenuOpen}
      >
        <div className="container mx-auto px-4 py-6 flex flex-col gap-6">
          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-4" aria-label="Mobile navigation">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                ref={index === 0 ? firstMenuItemRef : null}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  'text-lg font-medium text-muted-foreground hover:text-foreground transition-all py-2 border-b border-border/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded',
                  isMobileMenuOpen && 'animate-in fade-in slide-in-from-left-4'
                )}
                style={{ animationDelay: `${index * 50}ms` }}
                tabIndex={isMobileMenuOpen ? 0 : -1}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile Auth Buttons */}
          <div className="flex flex-col gap-3 pt-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/50">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <Link 
              to="/login" 
              tabIndex={isMobileMenuOpen ? 0 : -1}
              onClick={() => setIsMobileMenuOpen(false)}
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
            >
              <Button variant="outline" className="w-full" size="lg">
                Login
              </Button>
            </Link>
            <Link 
              to="/register" 
              ref={lastMenuItemRef}
              tabIndex={isMobileMenuOpen ? 0 : -1}
              onClick={() => setIsMobileMenuOpen(false)}
              className="focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
            >
              <Button className="w-full" size="lg">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
