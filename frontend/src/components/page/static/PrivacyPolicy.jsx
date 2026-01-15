import AnimatedSection from '../landing/components/AnimatedSection';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-32 pb-16">
        <div className="container px-4 md:px-6 max-w-4xl mx-auto">
          <AnimatedSection animation="fade-up">
            <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
            <p className="text-muted-foreground mb-8">Last updated: {new Date().toLocaleDateString()}</p>
            
            <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">1. Introduction</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Welcome to OrgX (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access our platform.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">2. Information We Collect</h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  We collect information that you provide directly to us when you register for an account, report a grievance, or communicate with us. This may include:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                  <li>Personal identifiers (Name, Email address, Phone number)</li>
                  <li>Professional information (Job title, Department, Organization)</li>
                  <li>Grievance verification data (Images, Documents, Descriptions)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">3. How We Use Your Information</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2 text-muted-foreground mt-2">
                  <li>Provide, maintain, and improve our services.</li>
                  <li>Process and route grievances to the appropriate departments.</li>
                  <li>Send you technical notices, updates, and support messages.</li>
                  <li>Monitor and analyze trends, usage, and activities in connection with our services.</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">4. Data Security</h2>
                <p className="text-muted-foreground leading-relaxed">
                  We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold mb-4 text-foreground">5. Contact Us</h2>
                <p className="text-muted-foreground leading-relaxed">
                  If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@orgx.com" className="text-primary hover:underline">privacy@orgx.com</a>.
                </p>
              </section>
            </div>
          </AnimatedSection>
        </div>
      </main>
    </div>
  );
};

export default PrivacyPolicy;
