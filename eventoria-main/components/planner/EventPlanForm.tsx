"use client";

import React, { useState } from "react";
import styles from "./EventPlanForm.module.css";
import { formatCurrencyINR } from "@/lib/format";
import { LIMITS } from "@/lib/constants";
import type { EventPlanRequest, EventType } from "@/types/event";

export interface EventPlanFormProps {
  readonly onSubmit: (request: EventPlanRequest) => Promise<void>;
  readonly isLoading: boolean;
  readonly initialEventType?: EventType;
}

const PRESET_PLANS = [
  {
    name: "👑 Royal Palace Wedding (250 guests, ₹20 Lakh)",
    request: {
      eventType: "wedding" as EventType,
      guestCount: 250,
      budget: 2000000,
      date: "2026-11-20",
      city: "Jaipur",
      description: "A grand traditional wedding with regal mandap decor, authentic Rajasthani catering, and live folk music.",
      preferences: ["Pure vegetarian menu", "Royal traditional decor", "Live acoustic shehnai", "Drone photography"],
    },
  },
  {
    name: "🎈 Superhero Birthday (40 guests, ₹60K)",
    request: {
      eventType: "birthday" as EventType,
      guestCount: 40,
      budget: 60000,
      date: "2026-09-12",
      city: "Bengaluru",
      description: "Fun superhero-themed party for kids with games, DIY craft stations, and custom tiered cake.",
      preferences: ["Superhero theme", "Cupcake station", "Magic show & games", "Custom return favors"],
    },
  },
  {
    name: "🎪 Diwali Community Mela (500 guests, ₹4.5L)",
    request: {
      eventType: "community" as EventType,
      guestCount: 500,
      budget: 450000,
      date: "2026-10-31",
      city: "Delhi",
      description: "Festive neighborhood festival with food stalls, diyas, cultural dance performances, and community lighting.",
      preferences: ["Eco-friendly decor", "Stage & AV sound system", "First aid & safety station", "Volunteer badges"],
    },
  },
];

const EVENT_TYPES: Array<{ type: EventType; icon: string; title: string; desc: string }> = [
  { type: "wedding", icon: "💍", title: "Wedding Gala", desc: "Ceremonies, venues, catering & rituals" },
  { type: "birthday", icon: "🎂", title: "Birthday Party", desc: "Themes, entertainment & celebrations" },
  { type: "community", icon: "🏛️", title: "Community Event", desc: "Logistics, permits & public activities" },
];

const SUGGESTED_TAGS: Record<EventType, string[]> = {
  wedding: ["Pure vegetarian catering", "Outdoor garden lawn", "Live classical shehnai", "Drone cinematography", "Sangeet choreographer", "Eco-friendly favors"],
  birthday: ["Interactive magic show", "Custom designer cake", "Polaroid photo booth", "DIY arts & crafts table", "Themed return favors", "DJ & dance party"],
  community: ["Local artisan food stalls", "Stage & PA sound system", "First aid booths", "Volunteer badges", "Eco-friendly waste mgmt", "Cultural dance showcase"],
};

export const EventPlanForm: React.FC<EventPlanFormProps> = ({ onSubmit, isLoading, initialEventType = "wedding" }) => {
  const [eventType, setEventType] = useState<EventType>(initialEventType);
  const [guestCount, setGuestCount] = useState(150);
  const [budget, setBudget] = useState(1200000);
  const [date, setDate] = useState("2026-12-15");
  const [city, setCity] = useState("Bengaluru");
  const [description, setDescription] = useState("");
  const [preferences, setPreferences] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const handleApplyPreset = (preset: typeof PRESET_PLANS[0]) => {
    setEventType(preset.request.eventType);
    setGuestCount(preset.request.guestCount);
    setBudget(preset.request.budget);
    setDate(preset.request.date);
    setCity(preset.request.city);
    setDescription(preset.request.description);
    setPreferences([...preset.request.preferences]);
    setFormError(null);
  };

  const togglePreference = (tag: string) => {
    setPreferences(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!city.trim()) { setFormError("Please provide an event location / city."); return; }
    if (guestCount < LIMITS.MIN_GUESTS || guestCount > LIMITS.MAX_GUESTS) {
      setFormError(`Guest count must be between ${LIMITS.MIN_GUESTS} and ${LIMITS.MAX_GUESTS}.`); return;
    }
    if (budget < LIMITS.MIN_BUDGET || budget > LIMITS.MAX_BUDGET) {
      setFormError(`Budget must be between INR ${LIMITS.MIN_BUDGET} and INR ${LIMITS.MAX_BUDGET}.`); return;
    }
    await onSubmit({ eventType, guestCount, budget, date, city: city.trim(), description: description.trim(), preferences });
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Design Your Master Event</h2>
        <p className={styles.formSubtitle}>Set parameters and let Gemini AI build your complete celebration plan.</p>
      </div>

      {/* Presets */}
      <div className={styles.presetBar}>
        <span className={styles.presetLabel}>⚡ Quick Demo Presets</span>
        <div className={styles.presetChips}>
          {PRESET_PLANS.map(p => (
            <button key={p.name} type="button" className={styles.presetChip} onClick={() => handleApplyPreset(p)}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {formError && (
        <div id="form-error" className={styles.errorMessageAlert} role="alert">{formError}</div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {/* Step 1: Event type */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionHeading}>1 — Select Celebration Domain</h3>
          <div className={styles.typeGrid} role="radiogroup" aria-label="Celebration type">
            {EVENT_TYPES.map(ev => (
              <button
                key={ev.type}
                type="button"
                role="radio"
                aria-checked={eventType === ev.type}
                onClick={() => setEventType(ev.type)}
                className={`${styles.typeButton} ${eventType === ev.type ? styles.typeButtonSelected : ""}`}
              >
                <span className={styles.typeIcon}>{ev.icon}</span>
                <span className={styles.typeTitle}>{ev.title}</span>
                <span className={styles.typeDesc}>{ev.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Budget & Guest sliders */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionHeading}>2 — Financial & Scale Parameters</h3>
          <div className={styles.sliderGrid}>
            <div className={styles.sliderCard}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>Total Budget (₹)</span>
                <span className={`${styles.sliderValue} ${styles.sliderValueGold}`}>
                  {formatCurrencyINR(budget, { compact: true })}
                </span>
              </div>
              <input
                type="range"
                min={LIMITS.MIN_BUDGET}
                max={LIMITS.MAX_BUDGET}
                step="10000"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                className={`${styles.slider} ${styles.sliderGold}`}
                aria-label="Total budget"
                aria-valuetext={formatCurrencyINR(budget)}
                aria-invalid={!!formError && formError.toLowerCase().includes("budget")}
                aria-describedby={formError && formError.toLowerCase().includes("budget") ? "form-error" : undefined}
              />
            </div>
            <div className={styles.sliderCard}>
              <div className={styles.sliderHeader}>
                <span className={styles.sliderLabel}>Guest Count</span>
                <span className={`${styles.sliderValue} ${styles.sliderValueCyan}`}>{guestCount} Guests</span>
              </div>
              <input
                type="range"
                min={LIMITS.MIN_GUESTS}
                max={LIMITS.MAX_GUESTS}
                step="10"
                value={guestCount}
                onChange={e => setGuestCount(Number(e.target.value))}
                className={`${styles.slider} ${styles.sliderCyan}`}
                aria-label="Guest count"
                aria-valuetext={`${guestCount} guests`}
                aria-invalid={!!formError && formError.toLowerCase().includes("guest")}
                aria-describedby={formError && formError.toLowerCase().includes("guest") ? "form-error" : undefined}
              />
            </div>
          </div>
        </div>

        {/* Step 3: Location & date */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionHeading}>3 — Logistics & Venue Details</h3>
          <div className={styles.inputGrid}>
            <div className={styles.fieldGroup}>
              <label htmlFor="event-city" className={styles.label}>
                Host City <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="event-city"
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                className={styles.input}
                placeholder="e.g. Bengaluru, Jaipur..."
                required
                aria-invalid={!!formError && formError.toLowerCase().includes("city")}
                aria-describedby={formError && formError.toLowerCase().includes("city") ? "form-error" : undefined}
              />
            </div>
            <div className={styles.fieldGroup}>
              <label htmlFor="event-date" className={styles.label}>
                Event Date <span className={styles.requiredMark}>*</span>
              </label>
              <input
                id="event-date"
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                className={styles.input}
                required
              />
            </div>
          </div>
        </div>

        {/* Step 4: Vision */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionHeading}>4 — Vision, Theme & Preferences</h3>
          <div className={styles.fieldGroup} style={{ marginBottom: "var(--space-4)" }}>
            <label htmlFor="description" className={styles.label}>Vision & Theme Notes</label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className={styles.textarea}
              placeholder="Describe ambiance, rituals, dietary requirements, cultural elements..."
              maxLength={LIMITS.MAX_DESCRIPTION_LENGTH}
            />
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Quick Preference Tags</label>
            <div className={styles.tagCloud}>
              {SUGGESTED_TAGS[eventType].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => togglePreference(tag)}
                  className={`${styles.tagButton} ${preferences.includes(tag) ? styles.tagButtonActive : ""}`}
                >
                  {preferences.includes(tag) ? "✓ " : "+ "}{tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={isLoading} className={styles.submitButton}>
          {isLoading ? "🔄 Generating Master Plan..." : "🚀 Launch GenAI Plan Engine"}
        </button>
      </form>
    </div>
  );
};
