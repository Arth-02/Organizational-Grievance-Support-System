import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  const location = useLocation();
  const navigate = useNavigate();

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
    
    // If not on home page, navigate to home with hash
    if (location.pathname !== '/') {
      navigate(`/${href}`);
      setIsMobileMenuOpen(false);
      return;
    }

    // If on home page, scroll to section
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
  }, [location.pathname, navigate]);

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
        'fixed left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-in-out',
        isScrolled
          ? 'top-4 w-[90%] md:w-[95%] max-w-5xl rounded-full border border-slate-200/20 dark:border-slate-800/40 bg-background/60 backdrop-blur-xl shadow-lg supports-[backdrop-filter]:bg-background/40'
          : 'top-0 w-full max-w-[100vw] rounded-none border-b border-transparent bg-transparent'
      )}
    >
      <nav className={cn(
        "container px-4 flex items-center justify-between transition-all duration-500",
        isScrolled ? "h-16" : "h-20"
      )}>
        {/* Logo/Brand - Requirement 1.1 */}
        <Link
          to="/" 
          className="flex items-center gap-2 group"
          aria-label="OrgX Home"
        >
          <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <div className="absolute inset-0 rounded-lg bg-primary/20 blur opacity-0 group-hover:opacity-100 transition-opacity" />
            <img 
              src="/header-logo.png" 
              alt="OrgX Logo" 
              className="h-6 w-6 object-contain relative z-10"
            />
          </div>
          <span className="text-xl font-bold bg-[linear-gradient(to_right,#3258cd,#3581d0,#3bb0b3,#4fc097,#7fcf78)] bg-clip-text text-transparent">
            OrgX
          </span>
        </Link>

        {/* Desktop Navigation Links - Requirement 1.2 */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:bg-muted/50 px-3 py-2 rounded-md"
            >
              {link.label}
            </Link>
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
          'md:hidden fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl transition-all duration-300 ease-in-out',
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        aria-hidden={!isMobileMenuOpen}
        style={{ top: '0px' }} // Override to ensure full coverage
      >
        <div className="container mx-auto px-4 pt-28 pb-6 flex flex-col gap-6 h-full overflow-y-auto">
          {/* Mobile Navigation Links */}
          <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
            {navLinks.map((link, index) => (
              <a
                key={link.href}
                ref={index === 0 ? firstMenuItemRef : null}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                className={cn(
                  'text-2xl font-bold text-muted-foreground hover:text-foreground transition-all py-3 px-4 rounded-xl hover:bg-muted/50',
                  isMobileMenuOpen ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0'
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
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
