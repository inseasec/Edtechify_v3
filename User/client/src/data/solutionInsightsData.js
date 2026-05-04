/** Long-form copy for /solution/:slug detail pages (also used to build tables). */

export const learningCatalogTypes = [
  {
    type: "Comprehensive courses",
    positioning:
      "Deep structured learning—chapters, topics, media, notes, engagement (e.g. comments, reviews)—suitable for flagship programs beyond a minimal video-only catalog.",
  },
  {
    type: "Notes-style courses",
    positioning:
      "Structured notes-first learning, similar in spirit to reference-style educational sites.",
  },
  {
    type: "Video courses",
    positioning: "Video-centric offerings for institutes that lead with recorded teaching.",
  },
];

export const rbacConcepts = [
  {
    concept: "Departments",
    offering:
      "For example Programming, Design—departments own groupings of courses and mirror how the organization works.",
  },
  {
    concept: "Instructor (teacher)",
    offering: "Manages their own courses within the rules of the system.",
  },
  {
    concept: "HOD / head of department",
    offering:
      "Visibility and control across all courses in assigned department(s), distinct from a single teacher’s scope.",
  },
  {
    concept: "Super user (top tier)",
    offering: "Highest authority for sensitive decisions (publishing, freezing, and approval flows).",
  },
];

export const courseGovernanceRows = [
  {
    offering: "Course grid (privileged roles)",
    description:
      "Super user and HOD-level roles work from a course grid with operational controls (e.g. Publish, Freeze, and related actions).",
  },
  {
    offering: "Controlled publishing",
    description:
      "When an instructor completes work, they do not self-publish to production; only the super-level role may publish a course, keeping go-live under central control.",
  },
  {
    offering: "Auto-freeze after publish",
    description:
      "Once a course is published, it enters a frozen state by default so lower roles cannot edit or delete live content accidentally.",
  },
  {
    offering: "Coordinated unfreeze for edits",
    description:
      "To change live material: super user unfreezes → HOD can unfreeze on their side → HOD or instructor may edit → when finished, super user freezes again, restoring protection for subscribers.",
  },
];

export const homepageMerchandisingRows = [
  {
    offering: "Default layout",
    description:
      "The homepage opens with default rows aligned to each enabled course type—so new institutes get a sensible starting layout immediately.",
  },
  {
    offering: "Hide unused types",
    description:
      "Hide any course-type row you are not launching, so learners never scroll past empty or irrelevant sections.",
  },
  {
    offering: "Custom rows",
    description:
      "Add multiple merchandising rows, each with a chosen course type and department (or equivalent filter)—for example several “comprehensive” strips for different departments.",
  },
];

/** `hubCategory` groups topics on `/solution` (tabs). slug matches `/solution/:slug`. */
export const solutionInsightTiles = [
  {
    slug: "learning-catalog",
    hubCategory: "governance",
    title: "Learning catalog",
    teaser: "Three course types—comprehensive, notes-first, or video-led. Mix them to fit how you teach and sell.",
    hubPoints: [
      "Three types: comprehensive (full structure + media), notes-style, and video-led—use one, two, or all three.",
      "Match how you teach: deep programs, reference-style paths, or video-first offerings in the same catalog.",
      "Mix lightweight and flagship listings without running separate websites or one-off builds.",
    ],
  },
  {
    slug: "organization-rbac",
    hubCategory: "governance",
    title: "Organization & access (RBAC)",
    teaser:
      "Departments, instructors, HODs, and super users—scoped permissions that mirror a real institute, not one flat admin.",
    hubPoints: [
      "Departments mirror how your institute is organized—not a single admin who sees everything.",
      "Instructors manage their own courses within rules; HODs cover assigned departments.",
      "Super users own publish, freeze, and other sensitive actions.",
    ],
  },
  {
    slug: "course-governance",
    hubCategory: "governance",
    title: "Course governance",
    teaser: "Publish, freeze, and coordinated edits so live catalogs stay controlled, safe, and auditable.",
    hubPoints: [
      "Privileged roles use a course grid with Publish, Freeze, and related controls.",
      "Instructors do not self-publish to production; a super-level role releases changes.",
      "After publish, courses freeze by default—protects live learners from accidental edits.",
    ],
  },
  {
    slug: "live-course-staging",
    hubCategory: "governance",
    title: "Live courses & staging",
    teaser:
      "Long-running improvements on working copies while learners stay on the stable live version—then publish through approval.",
    hubPoints: [
      "Work on a staging copy; subscribers stay on the stable live course.",
      "Submit changes when ready; super user accepts, rejects, or merges per your rules.",
      "Supports long-running updates across many courses without taking the portal offline.",
    ],
  },
  {
    slug: "branding-content-surfaces",
    hubCategory: "presence",
    title: "Branding & content surfaces",
    teaser:
      "Logo, About and institutional pages, and homepage banners—your portal reads as your institute within a governed design system.",
    hubPoints: [
      "Logo and colour treatment so the portal reads as your institute.",
      "About and institutional pages for mission, trust, and story.",
      "Homepage and hero banners set the tone when someone lands on your site.",
    ],
  },
  {
    slug: "homepage-merchandising",
    hubCategory: "presence",
    title: "Homepage & merchandising control",
    teaser:
      "Default layouts by course type, hide rows you do not need, add custom strips by department—all without bespoke front-end deploys for every tweak.",
    hubPoints: [
      "Default rows by course type so new tenants get a sensible first screen.",
      "Hide whole course-type strips you are not using—no empty scroll zones.",
      "Add custom merchandising rows filtered by department or course type.",
    ],
  },
];

/** Tab definitions for `/solution` hub (id must match `hubCategory`). */
export const solutionHubTabs = [
  {
    id: "governance",
    label: "Content & governance",
    hint: "Catalog models, roles, publishing safety, and staging.",
  },
  {
    id: "presence",
    label: "Brand & storefront",
    hint: "How your institute shows up online and how the homepage promotes your programs.",
  },
];

export const solutionInsightSlugSet = new Set(solutionInsightTiles.map((t) => t.slug));
