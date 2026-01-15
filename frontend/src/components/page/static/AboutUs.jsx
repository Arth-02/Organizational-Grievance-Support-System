
import AnimatedSection from '../landing/components/AnimatedSection';
import { Building2, Users, Target, ShieldCheck } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-32 pb-16">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10" />
          
          <div className="container px-4 md:px-6 text-center">
            <AnimatedSection animation="fade-up">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-500 to-purple-600">
                Revolutionizing Organizational Support
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
                OrgX is dedicated to streamlining grievance management and project tracking for modern enterprises. We believe in transparency, efficiency, and empowering teams to perform their best.
              </p>
            </AnimatedSection>
          </div>
        </section>

        {/* Mission & Vision */}
        <section className="py-16 bg-muted/30">
          <div className="container px-4 md:px-6">
            <div className="grid md:grid-cols-2 gap-12">
              <AnimatedSection delay={0.2}>
                <div className="bg-card border border-border/50 p-8 rounded-2xl h-full">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center mb-6">
                    <Target className="w-6 h-6 text-blue-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    To provide organizations with the tools they need to resolve issues quickly, manage projects effectively, and foster a culture of open communication and continuous improvement.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={0.4}>
                <div className="bg-card border border-border/50 p-8 rounded-2xl h-full">
                   <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-6">
                    <Building2 className="w-6 h-6 text-purple-500" />
                  </div>
                  <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
                  <p className="text-muted-foreground leading-relaxed">
                    A world where every organization operates at peak efficiency, where grievances are heard and resolved instantly, and where project transparency drives unparalleled success.
                  </p>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* Core Values */}
        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
              <p className="text-muted-foreground">The principles that guide everything we build.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Transparency", icon: Users, desc: "We build systems that promote visible workflows and clear accountability." },
                { title: "Security", icon: ShieldCheck, desc: "Protecting your organizational data is our top priority with enterprise-grade security." },
                { title: "Efficiency", icon: Target, desc: "We obsess over reducing friction and automating repetitive tasks." }
              ].map((val, i) => (
                <AnimatedSection key={i} delay={i * 0.1 + 0.2}>
                   <div className="text-center p-6">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <val.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-3">{val.title}</h3>
                      <p className="text-muted-foreground">{val.desc}</p>
                   </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AboutUs;
