import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Badge } from "@farmclub/design-system/Badge";
import { BulletList } from "@/components/ui/BulletList";
import { Button } from "@farmclub/design-system/Button";
import { ButtonLink } from "@farmclub/design-system/ButtonLink";
import { ContactFormShell } from "@/components/ui/ContactFormShell";
import { CtaBand } from "@/components/ui/CtaBand";
import { EmptyState } from "@farmclub/design-system/EmptyState";
import { FaqList } from "@/components/ui/FaqList";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { Field } from "@farmclub/design-system/Field";
import { fieldClass } from "@farmclub/design-system/form-classes";
import { Icon, iconNames } from "@farmclub/design-system/Icon";
import { IconDisc } from "@farmclub/design-system/IconDisc";
import type { DiscTone } from "@farmclub/design-system/IconDisc";
import { Logo } from "@farmclub/design-system/Logo";
import { Notice } from "@farmclub/design-system/Notice";
import { PasswordInput } from "@farmclub/design-system/PasswordInput";
import { PageHero } from "@/components/ui/PageHero";
import { ProgressBar } from "@farmclub/design-system/ProgressBar";
import { SectionIntro } from "@/components/ui/SectionIntro";
import { SectionLabel } from "@farmclub/design-system/SectionLabel";
import { Skeleton } from "@farmclub/design-system/Skeleton";
import { StepJourney } from "@/components/ui/StepJourney";
import { aboutPageContent } from "@/content/pages/about";
import { contactPageContent } from "@/content/pages/contact";
import { homePageContent } from "@/content/pages/home";
import { hubsPageContent } from "@/content/pages/hubs";
import { platformPageContent } from "@/content/pages/platform";

export const metadata: Metadata = {
  title: "Design System",
  description:
    "Live reference for the FARMCLUB OS tokens, type roles, components and section patterns.",
  robots: { index: false, follow: false },
};

/*
  The live counterpart to docs/design-system.md. Token names and values below
  mirror packages/design-system/styles/theme.css; change all three together.
*/

type Swatch = { name: string; className: string; value: string; use: string };

const greenSwatches: Swatch[] = [
  { name: "farm-green-950", className: "bg-farm-green-950", value: "#052a19", use: "Headings, CTA band, dark panels, footer" },
  { name: "farm-green-900", className: "bg-farm-green-900", value: "#06331f", use: "Capability bands, homepage CTA" },
  { name: "farm-green-800", className: "bg-farm-green-800", value: "#0a4a2d", use: "Primary button, links" },
  { name: "farm-green-700", className: "bg-farm-green-700", value: "#0b6a3e", use: "Discs, ticks, labels, focus border" },
  { name: "farm-green-600", className: "bg-farm-green-600", value: "#178452", use: "Rare accent" },
  { name: "farm-green-100", className: "bg-farm-green-100", value: "#e4ede6", use: "Success surface" },
  { name: "farm-green-50", className: "bg-farm-green-50", value: "#ecf1e9", use: "Pale discs" },
];

const goldSwatches: Swatch[] = [
  { name: "farm-gold-600", className: "bg-farm-gold-600", value: "#cd8e19", use: "Eyebrows on light" },
  { name: "farm-gold-500", className: "bg-farm-gold-500", value: "#ddae39", use: "Gold button, outer focus ring" },
  { name: "farm-gold-400", className: "bg-farm-gold-400", value: "#edbb59", use: "Eyebrows and icons on dark" },
];

const neutralSwatches: Swatch[] = [
  { name: "farm-cream-100", className: "bg-farm-cream-100", value: "#f4f5f1", use: "Alternate section, disabled fields" },
  { name: "farm-cream-50", className: "bg-farm-cream-50", value: "#f9f9f7", use: "Panels and bands" },
  { name: "farm-charcoal", className: "bg-farm-charcoal", value: "#14231c", use: "Body text" },
  { name: "farm-muted", className: "bg-farm-muted", value: "#5d6b64", use: "Supporting text" },
  { name: "farm-border", className: "bg-farm-border", value: "#e2e8e3", use: "Hairlines" },
  { name: "farm-border-strong", className: "bg-farm-border-strong", value: "#cfdad2", use: "Inputs, secondary button" },
];

const statusSwatches: Swatch[] = [
  { name: "farm-danger", className: "bg-farm-danger", value: "red 700", use: "Error text, invalid border" },
  { name: "farm-danger-strong", className: "bg-farm-danger-strong", value: "red 800", use: "Error banner text" },
  { name: "farm-danger-border", className: "bg-farm-danger-border", value: "red 300", use: "Error banner border" },
  { name: "farm-danger-surface", className: "bg-farm-danger-surface", value: "red 50", use: "Error banner fill" },
  { name: "farm-success", className: "bg-farm-success", value: "green-700", use: "Success border" },
  { name: "farm-success-surface", className: "bg-farm-success-surface", value: "green-100", use: "Success fill" },
  { name: "farm-info", className: "bg-farm-info", value: "green-950", use: "Notice text" },
  { name: "farm-info-border", className: "bg-farm-info-border", value: "border", use: "Notice border" },
  { name: "farm-info-surface", className: "bg-farm-info-surface", value: "cream-50", use: "Notice fill" },
  { name: "farm-warning", className: "bg-farm-warning", value: "#7a4f08", use: "Warning text" },
  { name: "farm-warning-surface", className: "bg-farm-warning-surface", value: "#fbf3e2", use: "Warning fill" },
];

const swatchGroups = [
  { label: "Green", swatches: greenSwatches },
  { label: "Gold", swatches: goldSwatches },
  { label: "Surfaces, text and borders", swatches: neutralSwatches },
  { label: "Status", swatches: statusSwatches },
];

const sampleCopy =
  "FARMCLUB OS connects learning, enterprise development, innovation and markets through one integrated platform.";

type TypeRole = {
  role: string;
  spec: string;
  use: string;
  as: "h3" | "p";
  className: string;
  sample: string;
};

const typeRoles: TypeRole[] = [
  { role: "type-display", spec: "2.15 → 3 → 3.75rem / 1.06", use: "Homepage hero h1", as: "h3", className: "type-display text-farm-green-950", sample: "Growing technology-enabled food enterprises" },
  { role: "type-h1", spec: "2.1 → 2.75 → 3.25rem / 1.08", use: "PageHero h1", as: "h3", className: "type-h1 text-farm-green-950", sample: "The Experience & Innovation Hub" },
  { role: "type-h2", spec: "1.75 → 2.1 → 2.4rem / 1.18", use: "Section heading", as: "h3", className: "type-h2 text-farm-green-950", sample: "Our Platform Ecosystem" },
  { role: "type-h2-panel", spec: "1.6 → 1.9rem / 1.25", use: "Split band and panel heading", as: "h3", className: "type-h2-panel text-farm-green-950", sample: "How the platform works" },
  { role: "type-h2-band", spec: "1.5 → 1.8rem / 1.375", use: "CTA and compact band heading", as: "h3", className: "type-h2-band text-farm-green-950", sample: "Ready to build with FARMCLUB OS?" },
  { role: "type-title", spec: "1.35rem / 1.65", use: "Form and aside panel title", as: "h3", className: "type-title text-farm-green-950", sample: "Send Us a Message" },
  { role: "type-eyebrow", spec: "0.75rem · 700 · uppercase · 0.16em", use: "SectionLabel only", as: "p", className: "type-eyebrow text-farm-gold-600", sample: "Platform ecosystem" },
  { role: "type-overline", spec: "0.75rem · 700 · uppercase · 0.14em", use: "Card labels, footer titles", as: "p", className: "type-overline text-farm-green-700", sample: "Learning path" },
  { role: "type-lead", spec: "1rem / 1.75rem", use: "Hero description", as: "p", className: "type-lead text-farm-muted", sample: sampleCopy },
  { role: "type-intro", spec: "0.975 → 1rem / 1.75rem", use: "SectionIntro description", as: "p", className: "type-intro text-farm-muted", sample: sampleCopy },
  { role: "type-body", spec: "0.95rem / 1.75rem", use: "Section paragraphs", as: "p", className: "type-body text-farm-muted", sample: sampleCopy },
  { role: "type-body-sm", spec: "0.875rem / 1.75rem", use: "Card, panel and FAQ copy", as: "p", className: "type-body-sm text-farm-muted", sample: sampleCopy },
  { role: "type-caption", spec: "0.75rem / 1.25rem", use: "Icon-row descriptions, notes", as: "p", className: "type-caption text-farm-muted", sample: sampleCopy },
];

const radii = [
  { name: "rounded-button", value: "8px", use: "Buttons, inputs, notices", className: "rounded-button" },
  { name: "rounded-card", value: "12px", use: "Cards, FAQ items", className: "rounded-card" },
  { name: "rounded-panel", value: "18px", use: "Panels, framed rows", className: "rounded-panel" },
  { name: "rounded-band", value: "20px", use: "Full-width bands", className: "rounded-band" },
  { name: "rounded-full", value: "full", use: "Discs, pills", className: "rounded-full" },
];

const elevations = [
  { name: "shadow-card", value: "0 1/2px + 0 10/28px · 4–6%", use: "Hover, open FAQ, framed icon row", className: "shadow-card" },
  { name: "shadow-raised", value: "0 18px 44px · 12%", use: "Menus and drawers", className: "shadow-raised" },
  { name: "shadow-float", value: "0 24px 60px · 18%", use: "Card floating over a photo", className: "shadow-float" },
  { name: "shadow-halo", value: "0 10px 30px · 10%", use: "Ring behind IconDisc halo", className: "shadow-halo" },
];

const spacingSteps = [
  { between: "Eyebrow → heading", token: "mt-3", bar: "h-3" },
  { between: "Heading → lead (sections)", token: "mt-4", bar: "h-4" },
  { between: "Heading → lead (heroes), card grid gap", token: "mt-5 · gap-5", bar: "h-5" },
  { between: "Lead → list", token: "mt-7", bar: "h-7" },
  { between: "Copy → lg actions", token: "mt-8", bar: "h-8" },
  { between: "Intro → grid", token: "mt-11", bar: "h-11" },
];

const whiteOnDark = [
  { name: "text-white", use: "Headings", className: "text-white" },
  { name: "text-white/85", use: "Hero lead, pills", className: "text-white/85" },
  { name: "text-white/72", use: "Body copy", className: "text-white/72" },
  { name: "text-white/62", use: "Captions", className: "text-white/62" },
  { name: "text-white/55", use: "Fine print", className: "text-white/55" },
];

const discTones: DiscTone[] = ["green", "pale", "outline", "gold"];
const discSizes = ["sm", "md", "lg"] as const;

const sections = [
  { id: "colour", label: "Colour" },
  { id: "type", label: "Type" },
  { id: "spacing", label: "Spacing" },
  { id: "shape", label: "Shape & elevation" },
  { id: "buttons", label: "Buttons" },
  { id: "badges", label: "Badges" },
  { id: "icons", label: "Icons" },
  { id: "intros", label: "Intros & labels" },
  { id: "cards", label: "Cards & lists" },
  { id: "journey", label: "Step journey" },
  { id: "faq", label: "FAQ" },
  { id: "forms", label: "Forms" },
  { id: "states", label: "Loading & empty" },
  { id: "logo", label: "Logo" },
  { id: "heroes", label: "Heroes" },
  { id: "cta", label: "CTA band" },
];

const photoCard = platformPageContent.useCases.items[0];

export default function DesignSystemPage() {
  return (
    <div className="bg-white">
      <div className="site-container py-14">
        <SectionIntro
          eyebrow="Internal reference"
          heading="FARMCLUB OS Design System"
          description="The live counterpart to docs/design-system.md: tokens, type roles and components rendered from the real code. Press Tab to see the two-tone focus ring on any link, button or field in the page content."
        />
        <nav aria-label="Design system sections" className="mt-8 flex flex-wrap gap-2">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="rounded-full border border-farm-border px-3.5 py-1.5 text-sm text-farm-green-800 transition-colors hover:border-farm-green-700 hover:text-farm-green-950"
            >
              {section.label}
            </a>
          ))}
        </nav>

        <Block
          id="colour"
          title="Colour"
          description="Brand-only palette: Tailwind's default colours are switched off. Use the farm-* classes shown."
        >
          {swatchGroups.map((group, index) => (
            <div key={group.label} className={index > 0 ? "mt-10" : undefined}>
              <DemoLabel>{group.label}</DemoLabel>
              <SwatchGrid swatches={group.swatches} />
            </div>
          ))}
          <DemoLabel className="mt-10">White on deep green</DemoLabel>
          <ul className="grid gap-4 rounded-card bg-farm-green-950 p-6 sm:grid-cols-5">
            {whiteOnDark.map((step) => (
              <li key={step.name}>
                <p className={`text-sm font-semibold ${step.className}`}>{step.name}</p>
                <p className={`type-caption ${step.className}`}>{step.use}</p>
              </li>
            ))}
          </ul>
        </Block>

        <Block
          id="type"
          title="Type roles"
          description="Headings use Poppins (500, 600 and 700 are loaded) through the base styles; everything else is Inter. Use a role on its own, never with text-*, leading-* or tracking-* utilities."
        >
          <div className="divide-y divide-farm-border border-y border-farm-border">
            {typeRoles.map(({ role, spec, use, as: Tag, className, sample }) => (
              <div key={role} className="grid gap-3 py-5 lg:grid-cols-[15rem_1fr] lg:gap-8">
                <div>
                  <p className="font-mono text-sm text-farm-green-800">{role}</p>
                  <p className="mt-1 type-caption text-farm-muted">{spec}</p>
                  <p className="type-caption text-farm-muted">{use}</p>
                </div>
                <Tag className={`max-w-3xl ${className}`}>{sample}</Tag>
              </div>
            ))}
          </div>
        </Block>

        <Block
          id="spacing"
          title="Spacing"
          description="The gaps used inside a section. Sections themselves use .site-container (1200px max, 1.25rem gutters, 2rem from 768px) and .section-padding (clamp 3.5–6rem top and bottom)."
        >
          <ul className="grid gap-3">
            {spacingSteps.map((step) => (
              <li
                key={step.token}
                className="grid items-center gap-2 sm:grid-cols-[16rem_7rem_1fr] sm:gap-6"
              >
                <p className="text-sm text-farm-green-950">{step.between}</p>
                <p className="font-mono text-sm text-farm-green-800">{step.token}</p>
                <div
                  className={`${step.bar} w-full max-w-md rounded-button border border-dashed border-farm-green-700 bg-farm-green-100`}
                />
              </li>
            ))}
          </ul>
        </Block>

        <Block
          id="shape"
          title="Shape, elevation and motion"
          description="Borders before shadows; shadows are tinted green-950. Tailwind's default radius, shadow and easing scales are switched off. Every transition uses ease-farm: 150ms colour (200ms on buttons), 200ms transform, 500ms image zoom, 620ms hero entrance (animate-rise)."
        >
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-5">
            {radii.map((radius) => (
              <div key={radius.name}>
                <div className={`h-20 border border-farm-border-strong bg-farm-cream-50 ${radius.className}`} />
                <p className="mt-2 font-mono text-sm text-farm-green-800">{radius.name}</p>
                <p className="type-caption text-farm-muted">
                  {radius.value} · {radius.use}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 rounded-card bg-farm-cream-50 p-6 sm:grid-cols-4">
            {elevations.map((elevation) => (
              <div key={elevation.name}>
                <div className={`h-20 rounded-card bg-white ${elevation.className}`} />
                <p className="mt-3 font-mono text-sm text-farm-green-800">{elevation.name}</p>
                <p className="type-caption text-farm-muted">
                  {elevation.value} · {elevation.use}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            <div className="surface-card p-6">
              <p className="text-sm font-semibold text-farm-green-950">.surface-card</p>
              <p className="mt-1 type-body-sm text-farm-muted">
                Hover to see the border darken and shadow-card appear (200ms, ease-farm).
              </p>
            </div>
            <div className="rounded-card border border-farm-border p-6">
              <ButtonLink href="#shape" variant="text">
                Hover for the arrow nudge
              </ButtonLink>
            </div>
          </div>
        </Block>

        <Block
          id="buttons"
          title="Buttons"
          description="ButtonLink for links, Button for actions; both read components/ui/button-classes.ts. The primary action comes first and a group has at most two. Pressed (active) repeats hover for touch devices."
        >
          <DemoLabel>ButtonLink on light surfaces</DemoLabel>
          <div className="flex flex-wrap items-center gap-3">
            <ButtonLink href="#buttons" size="lg">Primary lg</ButtonLink>
            <ButtonLink href="#buttons">Primary md</ButtonLink>
            <ButtonLink href="#buttons" variant="secondary" size="lg">Secondary lg</ButtonLink>
            <ButtonLink href="#buttons" variant="secondary">Secondary md</ButtonLink>
            <ButtonLink href="#buttons" variant="text">Text link</ButtonLink>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <ButtonLink href="#buttons" icon="play">Play icon</ButtonLink>
            <ButtonLink href="#buttons" variant="secondary" icon="none">No icon</ButtonLink>
          </div>
          <DemoLabel className="mt-8">ButtonLink on deep green</DemoLabel>
          <div className="flex flex-wrap items-center gap-3 rounded-card bg-farm-green-950 p-5">
            <ButtonLink href="#buttons" variant="gold" size="lg">Gold</ButtonLink>
            <ButtonLink href="#buttons" variant="outline-light" size="lg">Outline light</ButtonLink>
            <ButtonLink href="#buttons" variant="text-gold">Text gold</ButtonLink>
          </div>
          <DemoLabel className="mt-8">ButtonLink over photography</DemoLabel>
          <div className="flex flex-wrap items-center gap-3 rounded-card bg-farm-green-900 p-5">
            <ButtonLink href="#buttons" size="lg">Primary</ButtonLink>
            <ButtonLink href="#buttons" variant="outline-gold" size="lg">Outline gold</ButtonLink>
          </div>
          <DemoLabel className="mt-8">Button (actions)</DemoLabel>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button disabled>Disabled</Button>
            <Button busy>Checking…</Button>
          </div>
          <p className="mt-3 max-w-2xl type-caption text-farm-muted">
            Busy keeps the button focusable but ignores activation (aria-disabled, aria-busy, wait cursor); pair it with a role=&quot;status&quot; region that stays mounted. Never disable a submit just because fields are invalid.
          </p>
        </Block>

        <Block
          id="badges"
          title="Badges"
          description="Badge: a short, static label for a category, topic, step or simple availability. The words carry the meaning; colour and the optional dot only support them. Never a link or button, and never a claim such as Verified or Premium."
        >
          <DemoLabel>Categories (sm, the default)</DemoLabel>
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="green">Learning</Badge>
            <Badge tone="neutral">Enterprise</Badge>
            <Badge tone="gold">New</Badge>
            <Badge tone="green" dot>Markets</Badge>
          </div>
          <DemoLabel className="mt-6">Availability, with dot</DemoLabel>
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge tone="success" dot>Available</Badge>
            <Badge tone="warning" dot>Coming soon</Badge>
            <Badge tone="danger" dot>Closed</Badge>
            <Badge tone="info" dot>Update</Badge>
          </div>
          <DemoLabel className="mt-6">md on deep green, as list items</DemoLabel>
          <ul className="flex flex-wrap gap-2.5 rounded-card bg-farm-green-950 p-5">
            {["Learn", "Practise", "Build", "Connect"].map((item) => (
              <Badge key={item} as="li" size="md" tone="dark">
                {item}
              </Badge>
            ))}
          </ul>
        </Block>

        <Block
          id="icons"
          title="Icons and discs"
          description="Icon.tsx only: 24px grid, 1.6 stroke, currentColor. IconDisc tones by surface; avoid the gold tone in new work (contrast)."
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {discTones.map((tone) => (
              <div key={tone} className="rounded-card border border-farm-border p-5">
                <p className="type-overline text-farm-muted">tone=&quot;{tone}&quot;</p>
                <div className="mt-4 flex items-end gap-3">
                  {discSizes.map((size) => (
                    <IconDisc key={size} name="learn" tone={tone} size={size} />
                  ))}
                </div>
              </div>
            ))}
            <div className="rounded-card bg-farm-green-950 p-5">
              <p className="type-overline text-white/62">tone=&quot;dark&quot;</p>
              <div className="mt-4 flex items-end gap-3">
                {discSizes.map((size) => (
                  <IconDisc key={size} name="impact" tone="dark" size={size} />
                ))}
              </div>
            </div>
            <div className="rounded-card border border-farm-border bg-farm-cream-50 p-5">
              <p className="type-overline text-farm-muted">halo</p>
              <div className="mt-4 flex items-end gap-3">
                <IconDisc name="connect" tone="green" halo />
                <IconDisc name="market" tone="gold" halo />
              </div>
            </div>
          </div>

          <DemoLabel className="mt-10">{`Icons (${iconNames.length}), from iconNames in Icon.tsx`}</DemoLabel>
          <ul className="grid grid-cols-3 gap-4 sm:grid-cols-6 lg:grid-cols-8">
            {iconNames.map((name) => (
              <li
                key={name}
                className="flex flex-col items-center gap-2 rounded-card border border-farm-border p-3 text-center"
              >
                <Icon name={name} size={30} className="text-farm-green-800" />
                <span className="type-caption text-farm-muted">{name}</span>
              </li>
            ))}
          </ul>
        </Block>

        <Block id="intros" title="Section intros and labels" description="SectionIntro opens a section; SectionLabel is the only eyebrow.">
          <div className="grid gap-10 lg:grid-cols-2">
            <SectionIntro
              eyebrow="Left aligned"
              heading="Section heading on light"
              description="Use above content that reads left to right, such as split bands."
            />
            <SectionIntro
              eyebrow="Centred"
              heading="Centred above a grid"
              description="Use above card grids and icon rows."
              align="center"
            />
          </div>
          <div className="mt-8 rounded-band bg-farm-green-950 px-6 py-11 sm:px-10">
            <SectionIntro
              tone="dark"
              eyebrow="Dark tone"
              heading="Section heading on deep green"
              description="Eyebrow switches to gold-400 and the lead to white/72."
            />
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <SectionLabel>tone gold (default)</SectionLabel>
            <SectionLabel tone="light">tone light</SectionLabel>
            <span className="rounded-button bg-farm-green-950 px-4 py-2">
              <SectionLabel tone="dark">tone dark</SectionLabel>
            </span>
          </div>
        </Block>

        <Block
          id="cards"
          title="Cards and lists"
          description="FeatureCard for grids; BulletList for short checked benefits. Card links pin to the bottom so they line up across a row: give every card in a grid a link, or none."
        >
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon="learn"
              title="Linked card"
              description="Short copy."
              href="#cards"
            />
            <FeatureCard
              icon="grow"
              tone="pale"
              title="Linked card, longer copy"
              description="Longer copy wraps onto more lines, and the link still lines up with its neighbour."
              href="#cards"
            />
            <FeatureCard
              icon="community"
              tone="outline"
              title="Centred card"
              description="For icon grids such as Our Commitment to Change."
              align="center"
              href="#cards"
            />
            <FeatureCard
              icon="report"
              tone="outline"
              label="Overline label"
              title="Labelled card"
              description="A green-700 type-overline label sits above the title."
              href="#cards"
            />
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {photoCard ? (
              <FeatureCard
                image={photoCard.image}
                title={photoCard.title}
                description="Photo cards lead with the subject at 3:2."
                imageSizes="(min-width: 1024px) 18rem, (min-width: 640px) 45vw, 100vw"
              />
            ) : null}
            <div className="surface-card p-7">
              <BulletList
                items={[
                  "Learn the right skills",
                  "Start and grow your enterprise",
                  "Access tools, finance and experts",
                ]}
              />
            </div>
            <div className="surface-card p-7">
              <BulletList
                columns={2}
                items={["Training", "Mentoring", "Demonstration", "Enterprise support", "Market links", "Research"]}
              />
            </div>
            <div className="rounded-card bg-farm-green-950 p-7">
              <BulletList
                tone="dark"
                items={["Dark tone ticks", "Gold-400 markers", "White/82 text"]}
              />
            </div>
          </div>
        </Block>

        <Block id="journey" title="Step journey" description="StepJourney: lg for full-width bands, sm beside an intro column.">
          <StepJourney steps={homePageContent.journey.steps} />
          <div className="mt-10 rounded-band border border-farm-border bg-farm-cream-50 px-6 py-11 sm:px-9">
            <StepJourney steps={homePageContent.journey.steps} size="sm" />
          </div>
        </Block>

        <Block id="faq" title="FAQ" description="FaqList uses native details elements, so it needs no client JavaScript.">
          <div className="max-w-3xl">
            <FaqList items={contactPageContent.faqs.slice(0, 3)} />
          </div>
        </Block>

        <Block
          id="forms"
          title="Forms and states"
          description="Field renders the label, hint, control and error, and hands the control its ids so no call site wires aria-describedby by hand. Controls use fieldClass, which builds in the focus, invalid and disabled states. Static specimens on the left; the live contact form on the right (submit it empty to see the invalid state)."
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="grid gap-5">
              <Field label="Default, required" name="ds-name" required>
                {({ id }) => (
                  <input className={fieldClass} id={id} placeholder="Full Name" required type="text" />
                )}
              </Field>

              <Field label="Focused (border shown statically; Tab for the ring)" name="ds-focus">
                {({ id }) => (
                  <input
                    className={fieldClass.replace("border-farm-border-strong", "border-farm-green-700")}
                    defaultValue="Example Organisation"
                    id={id}
                    type="text"
                  />
                )}
              </Field>

              <Field label="Password, with a hint (PasswordInput)" name="ds-password" hint="At least 10 characters.">
                {({ id, describedBy }) => (
                  <PasswordInput
                    aria-describedby={describedBy}
                    hideLabel="Hide password"
                    id={id}
                    showLabel="Show password"
                  />
                )}
              </Field>

              <Field label="Invalid" name="ds-email" error="Enter a valid email address.">
                {({ id, describedBy, invalid }) => (
                  <input
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    className={fieldClass}
                    defaultValue="name@example"
                    id={id}
                    type="email"
                  />
                )}
              </Field>

              <Field label="Disabled" name="ds-disabled">
                {({ id }) => (
                  <input className={fieldClass} defaultValue="Not editable" disabled id={id} type="text" />
                )}
              </Field>

              <Field label="Select" name="ds-subject">
                {({ id }) => (
                  <select className={fieldClass} defaultValue="" id={id}>
                    <option value="" disabled>
                      Select a subject
                    </option>
                    {contactPageContent.enquiryTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              {/* A checkbox keeps its own markup: its label wraps its control. */}
              <div className="grid gap-2">
                <label className="flex items-start gap-3 text-sm leading-6 text-farm-muted">
                  <input className="mt-1 h-4.5 w-4.5 shrink-0 accent-farm-green-800" type="checkbox" />
                  <span>Checkbox, unchecked</span>
                </label>
                <label className="flex items-start gap-3 text-sm leading-6 text-farm-muted">
                  <input className="mt-1 h-4.5 w-4.5 shrink-0 accent-farm-green-800" type="checkbox" defaultChecked />
                  <span>Checkbox, checked</span>
                </label>
                <label className="flex items-start gap-3 text-sm leading-6 text-farm-muted">
                  <input className="mt-1 h-4.5 w-4.5 shrink-0 accent-farm-green-800" type="checkbox" required />
                  <span>
                    Checkbox, required
                    <span aria-hidden="true" className="text-farm-green-700"> *</span>
                  </span>
                </label>
              </div>

              <DemoLabel className="mt-3">Notices</DemoLabel>
              <Notice tone="info">Neutral notice: online delivery is not connected yet.</Notice>
              <Notice tone="busy">Busy: checking your message locally…</Notice>
              <Notice tone="error">Error: review the highlighted fields. Nothing has been sent.</Notice>
              <Notice tone="success" title="Success: your enquiry is complete.">
                Nothing was sent or stored.
              </Notice>
            </div>

            <ContactFormShell
              enquiryTypes={contactPageContent.enquiryTypes}
              integrationNote={contactPageContent.form.integrationNote}
              requiredNote={contactPageContent.form.requiredNote}
            />
          </div>
        </Block>

        <Block
          id="states"
          title="Loading, progress and empty states"
          description="What a screen shows while it waits, how far through something a learner is, and what a list with nothing in it says. Skeleton is aria-hidden, so the region around it announces loading once."
        >
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="grid gap-6">
              <div>
                <DemoLabel>Skeleton: text</DemoLabel>
                <div className="mt-3 rounded-card border border-farm-border p-5">
                  <Skeleton variant="text" />
                </div>
              </div>
              <div>
                <DemoLabel>Skeleton: block</DemoLabel>
                <div className="mt-3 rounded-card border border-farm-border p-5">
                  <Skeleton className="h-32" />
                </div>
              </div>
              <div>
                <DemoLabel>Progress</DemoLabel>
                <div className="mt-3 grid gap-3 rounded-card border border-farm-border p-5">
                  <ProgressBar label="Agricultural Entrepreneurship Foundation" value={0} />
                  <ProgressBar label="Greenhouse Enterprise" value={45} />
                  <ProgressBar label="Agribusiness Enterprise Accelerator" value={100} />
                </div>
                <p className="mt-2 type-caption text-farm-muted">
                  The figure is printed beside the bar, not carried by width alone. Only ever fed
                  real platform data.
                </p>
              </div>
            </div>

            <div className="grid gap-6">
              <div>
                <DemoLabel>Empty state, with an action</DemoLabel>
                <div className="mt-3">
                  <EmptyState
                    action={<ButtonLink href="/contact">Talk to us</ButtonLink>}
                    description="Once your institution enrols you in a cohort, the pathways you can take appear here."
                    icon="learn"
                    title="No pathways yet"
                  />
                </div>
              </div>
              <div>
                <DemoLabel>Empty state, no action</DemoLabel>
                <div className="mt-3">
                  <EmptyState
                    description="Nothing has been recorded against this cohort yet."
                    title="No activity"
                  />
                </div>
              </div>
            </div>
          </div>
        </Block>

        <Block id="logo" title="Logo" description="Logo.tsx only. Primary on light, reversed on deep green; symbols for compact marks.">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="flex items-center gap-8 rounded-card border border-farm-border p-8">
              <Logo variant="primary" className="w-48" />
              <Logo variant="symbol" className="w-12" />
            </div>
            <div className="flex items-center gap-8 rounded-card bg-farm-green-950 p-8">
              <Logo variant="reversed" className="w-48" />
              <Logo variant="symbolReversed" className="w-12" />
            </div>
          </div>
        </Block>

        <Block
          id="heroes"
          title="Page heroes"
          description="PageHero overlay (story pages) and split (utility pages). Each renders an h1, so a real page has exactly one."
        />
      </div>

      <PageHero
        eyebrow={aboutPageContent.hero.eyebrow}
        heading={aboutPageContent.hero.heading}
        description={aboutPageContent.hero.description}
        image={aboutPageContent.hero.image}
        imagePosition="object-[62%_center]"
        primaryAction={aboutPageContent.hero.primaryAction}
        secondaryAction={aboutPageContent.hero.secondaryAction}
      />
      <div className="border-t border-farm-border">
        <PageHero
          eyebrow={hubsPageContent.hero.eyebrow}
          heading={hubsPageContent.hero.heading}
          description={hubsPageContent.hero.description}
          image={hubsPageContent.hero.image}
          variant="split"
          imagePosition="object-[45%_center]"
          primaryAction={hubsPageContent.hero.primaryAction}
          secondaryAction={hubsPageContent.hero.secondaryAction}
        />
      </div>

      <div className="site-container">
        <Block id="cta" title="CTA band" description="CtaBand closes every page: gold primary, outline-light secondary, optional note." />
      </div>
      <CtaBand
        eyebrow="Closing band"
        heading="Every page ends with one CtaBand"
        description="Keep the heading short and the description to one or two sentences."
        primaryAction={{ label: "Contact the Team", href: "/contact" }}
        secondaryAction={{ label: "Explore the Platform", href: "/platform" }}
        note="Optional note for an access caveat."
        icon="handshake"
      />
    </div>
  );
}

function Block({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="mt-14 border-t border-farm-border pt-8">
      <h2 className="type-title text-farm-green-950">{title}</h2>
      {description ? (
        <p className="mt-1 max-w-3xl type-body-sm text-farm-muted">{description}</p>
      ) : null}
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}

function DemoLabel({ children, className }: { children: string; className?: string }) {
  return (
    <p className={["mb-3 type-overline text-farm-muted", className].filter(Boolean).join(" ")}>
      {children}
    </p>
  );
}

function SwatchGrid({ swatches }: { swatches: Swatch[] }) {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
      {swatches.map((swatch) => (
        <li key={swatch.name}>
          <div className={`h-16 rounded-card border border-farm-border ${swatch.className}`} />
          <p className="mt-2 text-xs font-semibold text-farm-green-950">{swatch.name}</p>
          <p className="type-caption text-farm-muted">{swatch.value}</p>
          <p className="type-caption text-farm-muted">{swatch.use}</p>
        </li>
      ))}
    </ul>
  );
}
