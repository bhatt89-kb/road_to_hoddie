import React from "react";
import Link from "next/link";
import styles from "./page.module.css";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function HomePage() {
  return (
    <div className="container">
      {/* Hero Section */}
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroContent}>
          <div className={styles.badgeWrapper}>
            <Badge variant="amber" icon="⚡">
              Powered by Google Gemini 2.5
            </Badge>
          </div>

          <h1 id="hero-title" className={styles.title}>
            Plan Unforgettable Celebrations with{" "}
            <span className={styles.titleGradient}>GenAI Precision</span>
          </h1>

          <p className={styles.subtitle}>
            Organize weddings, milestone birthdays, and community festivals with
            instant INR budget calculations, backward milestone schedules, verified vendor
            checklists, and personalized creative concepts.
          </p>

          <div className={styles.ctaGroup}>
            <Link href="/planner" tabIndex={-1}>
              <Button size="lg" variant="primary" rightIcon="→">
                Start Planning Your Event
              </Button>
            </Link>
            <Link href="/chat" tabIndex={-1}>
              <Button size="lg" variant="secondary" leftIcon="💬">
                Talk to AI Assistant
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Three Event Personas Showcase */}
      <section className={styles.section} aria-labelledby="event-types-title">
        <div className={styles.sectionHeader}>
          <h2 id="event-types-title" className={styles.sectionTitle}>
            Tailored for Every Type of Gathering
          </h2>
          <p className={styles.sectionSubtitle}>
            Whether hosting 20 close friends or coordinating a 1,000-guest community festival,
            Eventoria adapts its intelligence to your scale.
          </p>
        </div>

        <div className={styles.eventGrid}>
          {/* Wedding Card */}
          <Card
            hoverable
            className={styles.eventCard}
            headerAction={<Badge variant="amber">Tier 1: Comprehensive</Badge>}
          >
            <div className={styles.eventIcon} aria-hidden="true">
              💍
            </div>
            <h3 className={styles.pillarTitle}>Weddings & Multi-Day</h3>
            <p className={styles.pillarDescription}>
              Balanced budget allocation across mandap decor, authentic catering, photography, and ritual items.
            </p>
            <ul className={styles.eventFeatures}>
              <li className={styles.eventFeatureItem}>
                <span className={styles.checkmark} aria-hidden="true">✓</span>
                <span>180-day countdown timeline</span>
              </li>
              <li className={styles.eventFeatureItem}>
                <span className={styles.checkmark} aria-hidden="true">✓</span>
                <span>Vendor contract checks & questions</span>
              </li>
              <li className={styles.eventFeatureItem}>
                <span className={styles.checkmark} aria-hidden="true">✓</span>
                <span>Mandatory 8% contingency safety buffer</span>
              </li>
            </ul>
            <Link href="/planner?type=wedding" style={{ marginTop: "auto", display: "block" }}>
              <Button variant="outline" size="sm" fullWidth>
                Plan a Wedding
              </Button>
            </Link>
          </Card>

          {/* Birthday Card */}
          <Card
            hoverable
            className={styles.eventCard}
            headerAction={<Badge variant="emerald">Tier 2: Themed</Badge>}
          >
            <div className={styles.eventIcon} aria-hidden="true">
              🎂
            </div>
            <h3 className={styles.pillarTitle}>Milestone Birthdays</h3>
            <p className={styles.pillarDescription}>
              High-impact themes, engaging activities for guests, cake and custom dessert tables, and unique return favors.
            </p>
            <ul className={styles.eventFeatures}>
              <li className={styles.eventFeatureItem}>
                <span className={styles.checkmark} aria-hidden="true">✓</span>
                <span>Interactive DIY activity ideas</span>
              </li>
              <li className={styles.eventFeatureItem}>
                <span className={styles.checkmark} aria-hidden="true">✓</span>
                <span>Per-guest gift favor estimators</span>
              </li>
              <li className={styles.eventFeatureItem}>
                <span className={styles.checkmark} aria-hidden="true">✓</span>
                <span>30-day fast-track checklist</span>
              </li>
            </ul>
            <Link href="/planner?type=birthday" style={{ marginTop: "auto", display: "block" }}>
              <Button variant="outline" size="sm" fullWidth>
                Plan a Birthday
              </Button>
            </Link>
          </Card>

          {/* Community Gathering Card */}
          <Card
            hoverable
            className={styles.eventCard}
            headerAction={<Badge variant="sky">Tier 3: Logistics</Badge>}
          >
            <div className={styles.eventIcon} aria-hidden="true">
              🎪
            </div>
            <h3 className={styles.pillarTitle}>Community Festivals</h3>
            <p className={styles.pillarDescription}>
              Crowd logistics, volunteer coordination, municipal permits, safety stations, and transparent budget tracking.
            </p>
            <ul className={styles.eventFeatures}>
              <li className={styles.eventFeatureItem}>
                <span className={styles.checkmark} aria-hidden="true">✓</span>
                <span>Safety & permit checklists</span>
              </li>
              <li className={styles.eventFeatureItem}>
                <span className={styles.checkmark} aria-hidden="true">✓</span>
                <span>Volunteer & AV logistics</span>
              </li>
              <li className={styles.eventFeatureItem}>
                <span className={styles.checkmark} aria-hidden="true">✓</span>
                <span>Waste cleanup & water stations</span>
              </li>
            </ul>
            <Link href="/planner?type=community" style={{ marginTop: "auto", display: "block" }}>
              <Button variant="outline" size="sm" fullWidth>
                Plan Community Event
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* Four Core Pillars (Traceability to Challenge Statement) */}
      <section className={styles.section} aria-labelledby="pillars-title">
        <div className={styles.sectionHeader}>
          <h2 id="pillars-title" className={styles.sectionTitle}>
            Built Around Four Core Planning Deliverables
          </h2>
          <p className={styles.sectionSubtitle}>
            Every event plan generated is structured around the four essential pillars specified by the challenge.
          </p>
        </div>

        <div className={styles.pillarGrid}>
          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon} aria-hidden="true">
              ₹
            </div>
            <h3 className={styles.pillarTitle}>1. Dynamic INR Budgets</h3>
            <p className={styles.pillarDescription}>
              Every category percentage is mathematically calibrated. Adjust any individual amount in the UI, and
              the plan dynamically recalculates your remaining balance and highlights potential overspend risks.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon} aria-hidden="true">
              ⏳
            </div>
            <h3 className={styles.pillarTitle}>2. Backward Milestone Timelines</h3>
            <p className={styles.pillarDescription}>
              Instead of generic calendars, tasks are scheduled backwards from event day (e.g. 90 days before, 30 days before,
              week-of). Mark items as completed and track progress in real-time.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon} aria-hidden="true">
              📋
            </div>
            <h3 className={styles.pillarTitle}>3. Rigorous Vendor Checklists</h3>
            <p className={styles.pillarDescription}>
              Pre-built questions to ask before booking, specific contract clauses to verify (cancellations, overtime, taxes),
              and expected cost bands so you never negotiate blind.
            </p>
          </div>

          <div className={styles.pillarCard}>
            <div className={styles.pillarIcon} aria-hidden="true">
              💡
            </div>
            <h3 className={styles.pillarTitle}>4. Tiered Personalized Ideas</h3>
            <p className={styles.pillarDescription}>
              Creative concepts sorted into DIY (budget-friendly), Standard, and Premium tiers tailored specifically to your city,
              guest count, and chosen aesthetic.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className={styles.ctaBanner} aria-label="Get Started">
        <h2 className={styles.ctaBannerTitle}>Ready to Design Your Celebration?</h2>
        <p className={styles.ctaBannerText}>
          No registration required. Your plans are saved locally on your device with complete privacy.
        </p>
        <Link href="/planner" tabIndex={-1}>
          <Button size="lg" variant="primary">
            Create Your Plan in 60 Seconds
          </Button>
        </Link>
      </section>
    </div>
  );
}
