import AnimatedSection from '../landing/components/AnimatedSection';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-32 pb-16">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <AnimatedSection animation="fade-up">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Acceptance of Terms</h2>
                <p className="text-muted-foreground leading-relaxed">
                  By accessing and using OrgX, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, given the nature of the service, you must not use our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">2. User Responsibilities</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Provide accurate and current information.</li>
                  <li>Use the grievances reporting system responsibly and truthfully.</li>
                  <li>Not use the service for any illegal or unauthorized purpose.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">3. Service Availability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We strive to ensure our services are available 24/7, but we do not guarantee uninterrupted access. We reserve the right to modify, suspend, or discontinue any part of the service at any time with or without notice.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Intellectual Property</h2>
                <p className="text-muted-foreground leading-relaxed">
                  All content, features, and functionality of OrgX—including but not limited to design, code, and text—are the exclusive property of OrgX and are protected by copyright and other intellectual property laws.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Limitation of Liability</h2>
                <p className="text-muted-foreground leading-relaxed">
                  In no event shall OrgX be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">6. Contact</h2>
                <p className="text-muted-foreground leading-relaxed">
                  For any questions regarding these Terms, please contact us at <a href="mailto:legal@orgx.com" className="text-primary hover:underline">legal@orgx.com</a>.
                </p>
              </section>
            </div>
          </AnimatedSection>
        </div>
      </main>
    </div>
  );
};

export default TermsOfService;
