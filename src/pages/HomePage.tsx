import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Calendar,
  MapPin,
  Users,
  GraduationCap,
  Heart,
  Lightbulb,
  Network,
  BookOpen,
  Sparkles,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { daysUntil } from '@/lib/utils';

export default function HomePage() {
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    supabase
      .from('registrations')
      .select('id', { count: 'exact', head: true })
      .eq('registration_status', 'confirmed')
      .then(({ count }) => {
        if (count !== null) setParticipantCount(count);
      });
  }, []);

  const deadline = '2026-11-30';
  const daysLeft = daysUntil(deadline);

  return (
    <div>
      <HeroSection participantCount={participantCount} />
      <FeatureCards />
      <AboutSection />
      <GlanceSection daysLeft={daysLeft} />
      <CTASection />
    </div>
  );
}

function HeroSection({ participantCount }: { participantCount: number }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-jubilee-800 via-jubilee-700 to-jubilee-600 text-white">
      <div className="absolute inset-0 opacity-[0.03]">
        <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none">
          {Array.from({ length: 20 }).map((_, i) => (
            <circle
              key={i}
              cx={100 + (i % 5) * 160}
              cy={80 + Math.floor(i / 5) * 150}
              r={40 + (i % 3) * 20}
              fill="white"
            />
          ))}
        </svg>
      </div>

      <div className="absolute top-0 left-0 w-64 h-64 opacity-10">
        <svg viewBox="0 0 200 200">
          <path
            d="M20,100 Q60,20 100,60 T180,100 Q140,180 100,140 T20,100Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gold-400"
          />
          <path
            d="M40,80 C60,40 80,30 100,50 C120,30 140,40 160,80 C140,120 120,130 100,110 C80,130 60,120 40,80Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.3"
            className="text-gold-400"
          />
        </svg>
      </div>

      <div className="absolute bottom-0 right-0 w-80 h-80 opacity-10">
        <svg viewBox="0 0 200 200">
          <path
            d="M100,10 C130,30 170,50 180,100 C170,150 130,170 100,190 C70,170 30,150 20,100 C30,50 70,30 100,10Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-gold-400"
          />
        </svg>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div className="animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-gold-300 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              50th Golden Jubilee &middot; 1976 &mdash; 2026
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] mb-6">
              Golden Jubilee
              <br />
              <span className="text-gold-400">Celebration</span> 2026
            </h1>

            <p className="text-jubilee-200 text-lg lg:text-xl mb-2">
              Department of Government & Politics
            </p>
            <p className="text-jubilee-300 text-base mb-6">Jahangirnagar University</p>

            <p className="text-xl lg:text-2xl font-serif italic text-gold-300/90 mb-8">
              Reuniting Generations, Strengthening Our Bonds
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                <Calendar className="w-5 h-5 text-gold-400 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">18 December 2026</p>
                  <p className="text-jubilee-300 text-xs">Friday</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                <MapPin className="w-5 h-5 text-gold-400 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">Jahangirnagar University</p>
                  <p className="text-jubilee-300 text-xs">Savar, Dhaka</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                <Users className="w-5 h-5 text-gold-400 shrink-0" />
                <div>
                  <p className="text-white text-sm font-medium">All Generations</p>
                  <p className="text-jubilee-300 text-xs">8th &ndash; 55th Batch</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/register" className="btn-gold !text-base !py-3.5 !px-8">
                Register Now
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#about" className="btn-secondary !border-white/30 !text-white hover:!bg-white/10 !text-base !py-3.5 !px-8">
                Learn More
                <ChevronRight className="w-5 h-5" />
              </a>
            </div>

            {participantCount > 0 && (
              <p className="mt-6 text-jubilee-300 text-sm">
                <span className="text-gold-400 font-semibold">{participantCount}+</span> alumni
                already registered
              </p>
            )}
          </div>

          <div className="hidden lg:block relative">
            <div className="relative">
              <div className="w-full aspect-square max-w-lg mx-auto relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold-500/20 to-jubilee-600/20 border border-gold-500/20" />
                <div className="absolute inset-8 rounded-full bg-gradient-to-br from-jubilee-600/40 to-jubilee-800/40 border border-white/10 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-8xl font-serif font-bold text-gold-400 leading-none mb-2">
                      50<span className="text-4xl align-top">th</span>
                    </div>
                    <div className="text-sm uppercase tracking-[0.3em] text-gold-300 font-medium">
                      Golden Jubilee
                    </div>
                    <div className="w-16 h-px bg-gold-500/40 mx-auto my-3" />
                    <div className="text-jubilee-200 text-sm tracking-wider">1976 &mdash; 2026</div>
                    <div className="mt-6 font-serif italic text-gold-300/80 text-lg">
                      Same Campus,
                      <br />
                      New Stories
                    </div>
                  </div>
                </div>

                <svg className="absolute inset-0 w-full h-full animate-[spin_60s_linear_infinite]" viewBox="0 0 400 400">
                  <circle cx="200" cy="200" r="190" fill="none" stroke="rgba(201,168,76,0.15)" strokeWidth="0.5" strokeDasharray="4 8" />
                </svg>
              </div>

              <div className="absolute -top-4 -right-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 animate-fade-in">
                <GraduationCap className="w-5 h-5 text-gold-400 mb-1" />
                <p className="text-white text-xs font-medium">48 Batches</p>
              </div>
              <div className="absolute -bottom-4 -left-4 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Heart className="w-5 h-5 text-gold-400 mb-1" />
                <p className="text-white text-xs font-medium">21 Halls</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="w-full h-8 lg:h-12">
          <path d="M0,60 L0,30 Q360,0 720,30 T1440,30 L1440,60Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}

function FeatureCards() {
  const features = [
    { icon: Heart, title: 'Meet Classmates', desc: 'Reconnect with friends and faculty' },
    { icon: Lightbulb, title: 'Share Ideas', desc: 'Celebrate our legacy and future' },
    { icon: Network, title: 'Build Networks', desc: 'Stronger together for tomorrow' },
    { icon: BookOpen, title: 'Explore Our Department', desc: 'A journey of 50 years of impact' },
    { icon: Sparkles, title: 'Be Part of the Story', desc: 'Same campus, New stories' },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 stagger-children">
          {features.map((f) => (
            <div
              key={f.title}
              className="group card p-6 text-center hover:-translate-y-1 transition-all duration-300"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-jubilee-50 flex items-center justify-center group-hover:bg-jubilee-700 transition-colors duration-300">
                <f.icon className="w-6 h-6 text-jubilee-700 group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="font-serif text-lg font-semibold text-gray-900 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="py-16 lg:py-24 bg-cream-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-jubilee-700 rounded-2xl aspect-[3/4] flex items-end p-6">
                  <div>
                    <p className="font-serif text-gold-400 text-4xl font-bold">50</p>
                    <p className="text-white text-sm mt-1">Years of Excellence</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="bg-gold-100 rounded-2xl aspect-square flex items-center justify-center">
                    <div className="text-center">
                      <GraduationCap className="w-10 h-10 text-gold-600 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gold-800">Alumni Network</p>
                    </div>
                  </div>
                  <div className="bg-jubilee-100 rounded-2xl aspect-square flex items-center justify-center">
                    <div className="text-center">
                      <Users className="w-10 h-10 text-jubilee-700 mx-auto mb-2" />
                      <p className="text-sm font-medium text-jubilee-800">Community</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="section-label mb-3">A Golden Journey</p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
              More Than Memories
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              The Golden Jubilee Celebration 2026 is a homecoming for everyone who has been part of
              the Department of Government & Politics, Jahangirnagar University. Let's come together
              to reconnect, celebrate our shared journey, and inspire the next generation.
            </p>
            <p className="font-serif italic text-jubilee-700 text-lg mb-8">
              "সময়ের সেতুবন্ধন
              <br />
              আমাদের এক আড্ডায়"
            </p>
            <a href="#glance" className="btn-primary">
              About the Celebration
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function GlanceSection({ daysLeft }: { daysLeft: number }) {
  const items = [
    { icon: Calendar, label: '18 December 2026', sub: 'Friday' },
    { icon: MapPin, label: 'JU Campus', sub: 'Savar, Dhaka' },
    { icon: Users, label: '8th – 55th Batch', sub: 'All are welcome' },
    { icon: GraduationCap, label: 'Registration Fee', sub: 'Varies by batch' },
    { icon: Clock, label: 'Registration Deadline', sub: '30 November 2026' },
  ];

  return (
    <section id="glance" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="section-label mb-3">Event At A Glance</p>
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900">
            Everything You Need to Know
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-12">
          {items.map((item) => (
            <div key={item.label} className="card p-6 text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-jubilee-50 flex items-center justify-center">
                <item.icon className="w-6 h-6 text-jubilee-700" />
              </div>
              <p className="font-semibold text-gray-900 text-sm mb-1">{item.label}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
          ))}
        </div>

        {daysLeft > 0 && (
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-4">
              <span className="text-jubilee-700 font-semibold">{daysLeft} days</span> remaining
              until registration closes
            </p>
          </div>
        )}

        <div className="text-center">
          <Link to="/register" className="btn-gold !text-base !py-3.5 !px-10">
            Register Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section id="contact" className="py-16 lg:py-24 bg-jubilee-800 text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 600 400" preserveAspectRatio="none">
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={i}
              d={`M${50 + i * 50},${200 + Math.sin(i) * 80} Q${100 + i * 50},${100 + Math.cos(i) * 60} ${150 + i * 50},${200 + Math.sin(i + 1) * 80}`}
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          ))}
        </svg>
      </div>
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="section-label !text-gold-400 mb-3">Be Part of History</p>
        <h2 className="font-serif text-3xl lg:text-4xl font-bold mb-6">
          Don't Miss This Once-in-a-Lifetime Reunion
        </h2>
        <p className="text-jubilee-200 text-lg mb-8">
          Join thousands of alumni from across 48 batches as we celebrate 50 years of the Department
          of Government & Politics.
        </p>
        <Link to="/register" className="btn-gold !text-base !py-3.5 !px-10">
          Register Now
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </section>
  );
}
