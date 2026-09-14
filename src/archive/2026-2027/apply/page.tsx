"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ui } from "@/app/components/ui";
import FileUpload from "@/app/components/FileUpload";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const PROJECT_DESCRIPTION_WORD_LIMIT = 100;

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  classYear: string;
  major: string;
  areasOfInterest: string[];
  linkedin: string;
  portfolioLink: string;
  projectDescription: string;
  whyHelix: string;
  skillsExperience: string;
  proudProject: string;
  nomaChallenge: string;
  solutionLink: string;
  solutionDescription: string;
  additionalInfo: string;
  commitmentLevel: string;
  retreatCommitment: string;
  retreatCommitmentOther: string;
};

const countWords = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

type Field = {
  key: keyof FormData;
  label: string;
  required?: boolean;
  kind?: "text" | "url" | "email" | "textarea" | "select" | "checkboxes" | "radio";
  rows?: number;
  placeholder?: string;
  options?: string[];
  help?: string;
  maxSelections?: number;
  wordLimit?: number;
};

const CLASS_YEARS = ["2027", "2028", "2029", "2030"];

const AREAS_OF_INTEREST = [
  "Business Development",
  "Marketing & Communications",
  "Finance",
  "Operations",
  "Product Management",
  "Software Engineering / Computer Science",
  "Artificial Intelligence / Machine Learning",
  "Data Science / Statistics",
  "Computational Biology / Bioinformatics",
  "Biology / Biomedical Sciences",
  "Biotechnology / Life Sciences",
  "Wet Lab Research",
  "Clinical / Healthcare",
  "Public Health",
  "Policy & Regulatory Affairs",
  "Hardware Engineering",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Robotics",
  "CAD / 3D Modeling & Printing",
  "Design / UI/UX",
];

type Section = { number: number; title: string; note?: string; fields: Field[] };

const SECTION_BASIC_INFO: Section = {
  number: 1,
  title: "Basic information",
  fields: [
    { key: "firstName", label: "First name", required: true },
    { key: "lastName", label: "Last name", required: true },
    { key: "email", label: "Yale email address", required: true, kind: "email" },
    { key: "classYear", label: "Class year", required: true, kind: "select", placeholder: "Select class year", options: CLASS_YEARS },
    { key: "major", label: "Major / intended major", required: true },
    {
      key: "areasOfInterest",
      label: "Which areas are you most interested in contributing to?",
      help: "Select up to five.",
      required: true,
      kind: "checkboxes",
      options: AREAS_OF_INTEREST,
      maxSelections: 5,
    },
    { key: "linkedin", label: "LinkedIn profile", kind: "url", placeholder: "https://linkedin.com/in/" },
  ],
};

const SECTION_GETTING_TO_KNOW_YOU: Section = {
  number: 3,
  title: "Getting to know you",
  fields: [
    {
      key: "whyHelix",
      label:
        "Why are you interested in joining Yale Helix, and what do you hope to get out of working with an early-stage startup?",
      required: true,
      kind: "textarea",
      rows: 4,
      wordLimit: 100,
    },
    {
      key: "skillsExperience",
      label: "What skills, experiences, or perspectives would you bring to a Helix startup team?",
      help: "You may draw from coursework, research, previous jobs or internships, student organizations, independent projects, or experiences outside of Yale.",
      required: true,
      kind: "textarea",
      rows: 4,
      wordLimit: 100,
    },
    {
      key: "proudProject",
      label:
        "Tell us about something you've built, improved, researched, organized, or helped solve that you're proud of. What was your specific contribution?",
      help: "This does not need to be related to startups or entrepreneurship.",
      required: true,
      kind: "textarea",
      rows: 5,
      wordLimit: 150,
    },
  ],
};

const RETREAT_COMMITMENT_OPTIONS = ["Yes", "No", "Other"];

const COMMITMENT_LEVEL_FIELD: Field = {
  key: "commitmentLevel",
  label:
    "If selected, are you able to commit to actively participating in Helix and working with your assigned startup throughout the program?",
  help: "This typically involves a commitment of 4-8 hours of work per week.",
  required: true,
  kind: "radio",
  options: ["Yes", "No", "Unsure / I would like to discuss potential conflicts"],
};

const RETREAT_COMMITMENT_FIELD: Field = {
  key: "retreatCommitment",
  label: "Are you able to commit to attending the retreat from October 2-4?",
  help: "One day only, more specifics are TBD. We highly encourage attending.",
  required: true,
  kind: "radio",
  options: RETREAT_COMMITMENT_OPTIONS,
};

const SECTION_FINAL_INFO: Section = {
  number: 6,
  title: "Final information",
  fields: [
    {
      key: "additionalInfo",
      label: "Is there anything else you would like us to know?",
      kind: "textarea",
      rows: 4,
      wordLimit: 100,
    },
    COMMITMENT_LEVEL_FIELD,
    RETREAT_COMMITMENT_FIELD,
  ],
};

const FIELD_SECTIONS: Section[] = [SECTION_BASIC_INFO, SECTION_GETTING_TO_KNOW_YOU, SECTION_FINAL_INFO];

const PROJECT_FILE_TYPES = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".zip"];
const SOLUTION_FILE_TYPES = [".pdf", ".doc", ".docx", ".png", ".jpg", ".jpeg", ".zip", ".ppt", ".pptx"];
const NOMA_CHALLENGE_WORD_LIMIT = 300;
const SOLUTION_DESCRIPTION_WORD_LIMIT = 75;

export default function StudentApplicationPage() {
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    classYear: "",
    major: "",
    areasOfInterest: [],
    linkedin: "",
    portfolioLink: "",
    projectDescription: "",
    whyHelix: "",
    skillsExperience: "",
    proudProject: "",
    nomaChallenge: "",
    solutionLink: "",
    solutionDescription: "",
    additionalInfo: "",
    commitmentLevel: "",
    retreatCommitment: "",
    retreatCommitmentOther: "",
  });
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [projectFile, setProjectFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCheckbox = (field: Field, option: string) => {
    setFormData((prev) => {
      const selected = prev[field.key] as string[];
      if (selected.includes(option)) {
        return { ...prev, [field.key]: selected.filter((s) => s !== option) };
      }
      if (field.maxSelections && selected.length >= field.maxSelections) {
        return prev;
      }
      return { ...prev, [field.key]: [...selected, option] };
    });
  };

  const isProjectDescriptionRequired =
    formData.portfolioLink.trim() !== "" || projectFile !== null;
  const projectDescriptionWordCount = countWords(formData.projectDescription);
  const nomaChallengeWordCount = countWords(formData.nomaChallenge);
  const solutionDescriptionWordCount = countWords(formData.solutionDescription);
  const isSolutionDescriptionRequired = formData.solutionLink.trim() !== "" || solutionFile !== null;
  const isRetreatCommitmentOtherRequired = formData.retreatCommitment === "Other";

  const areSectionFieldsValid = () => {
    for (const section of FIELD_SECTIONS) {
      for (const field of section.fields) {
        const value = formData[field.key];
        if (field.kind === "checkboxes") {
          if (field.required && (value as string[]).length === 0) return false;
        } else {
          if (field.required && (value as string).trim() === "") return false;
          if (field.wordLimit && countWords(value as string) > field.wordLimit) return false;
        }
      }
    }
    return true;
  };

  const isFormValid = () => {
    return (
      areSectionFieldsValid() &&
      resumeFile !== null &&
      (!isProjectDescriptionRequired || formData.projectDescription.trim() !== "") &&
      projectDescriptionWordCount <= PROJECT_DESCRIPTION_WORD_LIMIT &&
      formData.nomaChallenge.trim() !== "" &&
      nomaChallengeWordCount <= NOMA_CHALLENGE_WORD_LIMIT &&
      solutionDescriptionWordCount <= SOLUTION_DESCRIPTION_WORD_LIMIT &&
      (!isSolutionDescriptionRequired || formData.solutionDescription.trim() !== "") &&
      (!isRetreatCommitmentOtherRequired || formData.retreatCommitmentOther.trim() !== "")
    );
  };

  const uploadFile = async (
    file: File,
    endpoint: string,
  ): Promise<{ path: string; filename: string }> => {
    const urlRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name }),
    });
    if (!urlRes.ok) throw new Error("Could not start the upload");
    const { bucket, path, token } = await urlRes.json();

    const { error: uploadError } = await supabaseBrowser.storage
      .from(bucket)
      .uploadToSignedUrl(path, token, file);
    if (uploadError) throw uploadError;

    return { path, filename: file.name };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resumeFile) {
      alert("Please upload your resume.");
      return;
    }
    setIsSubmitting(true);

    try {
      const resume = await uploadFile(resumeFile, "/api/apply-student/upload-resume");
      const project = projectFile
        ? await uploadFile(projectFile, "/api/apply-student/upload-project")
        : null;
      const solution = solutionFile
        ? await uploadFile(solutionFile, "/api/apply-student/upload-solution")
        : null;

      const submitRes = await fetch("/api/apply-student/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          resumePath: resume.path,
          resumeFilename: resume.filename,
          projectPath: project?.path ?? "",
          projectFilename: project?.filename ?? "",
          solutionPath: solution?.path ?? "",
          solutionFilename: solution?.filename ?? "",
        }),
      });
      if (!submitRes.ok) {
        const data = await submitRes.json().catch(() => ({}));
        throw new Error(data.error || "Submission failed");
      }

      setIsSubmitting(false);
      router.push("/apply/success");
    } catch (err) {
      console.error("Submission error:", err);
      setIsSubmitting(false);
      alert("There was an error submitting your application. Please try again.");
    }
  };

  const renderRadioOptions = (field: Field) => {
    const value = formData[field.key] as string;
    return (
      <div className="grid gap-2">
        {field.options?.map((opt) => {
          const checked = value === opt;
          return (
            <button
              type="button"
              key={opt}
              onClick={() => setFormData((prev) => ({ ...prev, [field.key]: opt }))}
              className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                checked
                  ? "border-accent bg-accent-soft text-text"
                  : "border-hairline bg-surface text-text-muted hover:border-accent/40"
              }`}
            >
              <span
                className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                  checked ? "border-accent" : "border-hairline"
                }`}
              >
                {checked && <span className="h-2 w-2 rounded-full bg-accent" />}
              </span>
              {opt}
            </button>
          );
        })}
      </div>
    );
  };

  const renderSection = (section: Section, excludeKeys: (keyof FormData)[] = []) => (
    <section key={section.title}>
      <div className="mb-6">
        <h2 className={ui.sectionTitle}>
          Section {section.number} &mdash; {section.title}
        </h2>
        <div className={ui.sectionRule} />
        {section.note && <p className="mt-3 text-sm leading-relaxed text-text-muted">{section.note}</p>}
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        {section.fields.filter((f) => !excludeKeys.includes(f.key)).map(renderField)}
      </div>
    </section>
  );

  const renderField = (field: Field) => {
    if (field.kind === "checkboxes") {
      const selected = (formData[field.key] as string[]) ?? [];
      return (
        <div key={field.key} className="sm:col-span-2">
          <label className={ui.label}>
            {field.label} {field.required && <span className={ui.required}>*</span>}
          </label>
          {field.help && <p className="mb-3 text-xs text-text-muted">{field.help}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            {field.options?.map((opt) => {
              const checked = selected.includes(opt);
              const disabled = !checked && !!field.maxSelections && selected.length >= field.maxSelections;
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleCheckbox(field, opt)}
                  disabled={disabled}
                  className={`flex items-center gap-2.5 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                    checked
                      ? "border-accent bg-accent-soft text-text"
                      : disabled
                        ? "cursor-not-allowed border-hairline bg-surface text-text-muted/50"
                        : "border-hairline bg-surface text-text-muted hover:border-accent/40"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border ${
                      checked ? "border-accent bg-accent text-accent-fg" : "border-hairline"
                    }`}
                  >
                    {checked && <span className="text-[10px] leading-none">✓</span>}
                  </span>
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (field.kind === "radio") {
      return (
        <div key={field.key}>
          <label className={ui.label}>
            {field.label} {field.required && <span className={ui.required}>*</span>}
          </label>
          {field.help && <p className="mb-3 text-xs text-text-muted">{field.help}</p>}
          {renderRadioOptions(field)}
        </div>
      );
    }

    const value = formData[field.key] as string;
    const common = {
      id: field.key,
      name: field.key,
      value,
      onChange: handleChange,
      required: field.required,
    };
    const spanFull = field.kind === "textarea" || field.kind === "select";

    return (
      <div key={field.key} className={spanFull ? "sm:col-span-2" : ""}>
        <label htmlFor={field.key} className={ui.label}>
          {field.label} {field.required && <span className={ui.required}>*</span>}
        </label>
        {field.help && <p className="mb-3 text-xs text-text-muted">{field.help}</p>}
        {field.kind === "textarea" ? (
          <>
            <textarea {...common} rows={field.rows ?? 3} className={ui.textarea} />
            {field.wordLimit && (
              <p
                className={`mt-1.5 text-xs ${
                  countWords(value) > field.wordLimit ? "text-error" : "text-text-muted"
                }`}
              >
                {countWords(value)} / {field.wordLimit} words
              </p>
            )}
          </>
        ) : field.kind === "select" ? (
          <select {...common} className={ui.select}>
            <option value="">{field.placeholder ?? "Select"}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            {...common}
            type={field.kind === "email" ? "email" : field.kind === "url" ? "url" : "text"}
            placeholder={field.placeholder}
            className={ui.input}
          />
        )}
      </div>
    );
  };

  return (
    <div className={ui.page}>
      <div className={ui.container}>
        <Link href="/" className={ui.returnButton}>
          &larr; Return to homepage
        </Link>

        <div className="mt-12">
          <p className={ui.eyebrow}>Join the future of healthcare innovation</p>
          <h1 className={ui.title}>Yale Helix 2026-2027 fellow application</h1>
          <p className={ui.subtitle}>
            Helix connects Yale students with early-stage startups where they can contribute to real
            projects across biotechnology, healthcare, engineering, software, AI, business, design, and
            more. Our application is designed to learn about both what you can contribute and how you
            approach unfamiliar problems. We care much more about curiosity, initiative, creativity, and
            thoughtful problem-solving than having previous startup experience. Please answer each
            question authentically and pay close attention to the word limits provided.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 space-y-10">
          {renderSection(SECTION_BASIC_INFO)}

          <section>
            <div className="mb-6">
              <h2 className={ui.sectionTitle}>Section 2 &mdash; Resume &amp; previous work</h2>
              <div className={ui.sectionRule} />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FileUpload
                  onUploadComplete={() => {}}
                  onFileSelect={setResumeFile}
                  acceptedFileTypes={[".pdf", ".doc", ".docx"]}
                  maxFileSize={20}
                  label="Resume"
                  required={true}
                  placeholder="Drag and drop your resume here, or click to browse (PDF preferred)"
                  uploadEndpoint="/api/apply-student/upload-resume"
                  autoUpload={false}
                />
              </div>

              <div className="sm:col-span-2 mt-4">
                <h3 className={ui.sectionTitle}>Previous work &amp; projects</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  If applicable, you may share examples of previous work that demonstrate skills you
                  could bring to a Helix startup. This section is completely optional. Helix does not
                  expect applicants to have prior startup, research, technical, or professional
                  experience, and you should not feel pressured to submit anything here. Not submitting
                  previous work will not count against your application.
                </p>
                <p className="mt-3 text-sm leading-relaxed text-text-muted">
                  We recognize that certain skills, particularly coding, engineering, design, research,
                  AI/ML, data analysis, CAD/3D modeling, and other technical work, can be difficult to
                  demonstrate through a written application alone. This section is simply an opportunity
                  for applicants who already have relevant projects to show us what they have worked on.
                  Examples may include GitHub repositories, coding or AI/ML projects, CAD/3D models,
                  engineering projects, research posters, data analyses or visualizations, UI/UX
                  portfolios, websites or apps, marketing materials, pitch decks, or other work you are
                  proud of.
                </p>
              </div>

              <div>
                <label htmlFor="portfolioLink" className={ui.label}>
                  Portfolio / GitHub / website link
                </label>
                <input
                  id="portfolioLink"
                  name="portfolioLink"
                  type="url"
                  value={formData.portfolioLink}
                  onChange={handleChange}
                  placeholder="https://"
                  className={ui.input}
                />
              </div>

              <div>
                <FileUpload
                  onUploadComplete={() => {}}
                  onFileSelect={setProjectFile}
                  acceptedFileTypes={PROJECT_FILE_TYPES}
                  maxFileSize={50}
                  label="Project file(s)"
                  placeholder="Drag and drop a project file here, or click to browse"
                  uploadEndpoint="/api/apply-student/upload-project"
                  autoUpload={false}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="projectDescription" className={ui.label}>
                  Briefly describe anything you have shared and your individual contribution.{" "}
                  {isProjectDescriptionRequired && <span className={ui.required}>*</span>}
                </label>
                <p className="mb-3 text-xs text-text-muted">
                  {isProjectDescriptionRequired
                    ? "Required since you added a link or file above."
                    : "Optional."}{" "}
                  {PROJECT_DESCRIPTION_WORD_LIMIT} words maximum.
                </p>
                <textarea
                  id="projectDescription"
                  name="projectDescription"
                  rows={4}
                  value={formData.projectDescription}
                  onChange={handleChange}
                  required={isProjectDescriptionRequired}
                  className={ui.textarea}
                />
                <p
                  className={`mt-1.5 text-xs ${
                    projectDescriptionWordCount > PROJECT_DESCRIPTION_WORD_LIMIT
                      ? "text-error"
                      : "text-text-muted"
                  }`}
                >
                  {projectDescriptionWordCount} / {PROJECT_DESCRIPTION_WORD_LIMIT} words
                </p>
              </div>
            </div>
          </section>

          {renderSection(SECTION_GETTING_TO_KNOW_YOU)}

          <section>
            <div className="mb-6">
              <h2 className={ui.sectionTitle}>Section 4 &mdash; Helix startup challenge</h2>
              <div className={ui.sectionRule} />
            </div>

            <div className="space-y-6 text-sm leading-relaxed text-text-muted">
              <div>
                <h3 className="text-sm font-semibold text-text">Before you begin</h3>
                <p className="mt-2">We want to hear how you think.</p>
                <p className="mt-2">
                  Generative AI tools may be used to help edit, organize, or clarify your writing.
                  However, the ideas, reasoning, and proposed solutions in your application should be
                  your own. Please do not use AI to generate a solution and submit it as your own
                  thinking. Applications may be reviewed for signs of AI-generated content, and
                  applicants may be asked to explain or expand upon their proposed solution during the
                  selection process. We will be running application prompts through AI, we are looking
                  for your original ideas.
                </p>
                <p className="mt-2">
                  There is no correct answer. We are not looking for the most polished or technically
                  sophisticated response. We are looking for agency, originality, curiosity,
                  resourcefulness, and thoughtful problem-solving. Creative and unconventional approaches
                  are encouraged.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text">Meet Noma</h3>
                <p className="mt-2">
                  Noma is an early-stage healthcare startup developing a wearable patch that continuously
                  monitors patients after they leave the hospital. The patch collects heart rate,
                  temperature, respiratory rate, and movement data and alerts patients and their care
                  teams when patterns suggest that a patient may be deteriorating.
                </p>
                <p className="mt-2">
                  Noma recently completed a small pilot with one hospital. Patients generally liked the
                  device, but the company has encountered several challenges:
                </p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  <li>Clinicians are receiving too many alerts and have started ignoring some of them.</li>
                  <li>Some older patients stop wearing the patch after a few days.</li>
                  <li>The company has limited funding and a team of only six people.</li>
                </ul>
                <p className="mt-2">
                  The founders aren&apos;t sure whether they should prioritize improving the technology,
                  conducting more clinical validation, improving the patient experience, or finding
                  additional hospital partners.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text">Your challenge</h3>
              </div>
            </div>

            <div className="mt-6 grid gap-6">
              <div>
                <label htmlFor="nomaChallenge" className={ui.label}>
                  Imagine Noma has brought you onto its team for the next month. What would you do?{" "}
                  <span className={ui.required}>*</span>
                </label>
                <p className="mb-3 text-sm leading-relaxed text-text-muted">
                  Earlier in this application, you selected the skill sets and areas in which you&apos;re
                  most interested in contributing to a startup. Now we want to see how you would actually
                  apply them. Approach Noma&apos;s challenges from whatever perspective best reflects your
                  interests, skills, and way of thinking. You are not expected to solve every problem the
                  company is facing. Instead, identify ONE problem you would prioritize and propose a
                  solution.
                </p>
                <p className="mb-3 text-sm leading-relaxed text-text-muted">
                  For example, someone interested in software engineering might approach the problem very
                  differently from someone interested in biology, marketing, product design, data
                  science, finance, or public health. That&apos;s intentional. There is no preferred
                  discipline or type of solution.
                </p>
                <p className="mb-3 text-sm leading-relaxed text-text-muted">Briefly address:</p>
                <ol className="mb-3 list-decimal space-y-1 pl-5 text-sm leading-relaxed text-text-muted">
                  <li>What problem would you prioritize, and why?</li>
                  <li>What would you actually do to address it?</li>
                  <li>How would you determine whether your solution worked?</li>
                </ol>
                <p className="mb-3 text-xs text-text-muted">
                  We encourage you to be specific and creative. We&apos;re interested in how you approach
                  the problem, not in finding a single correct answer. {NOMA_CHALLENGE_WORD_LIMIT} words
                  maximum.
                </p>
                <textarea
                  id="nomaChallenge"
                  name="nomaChallenge"
                  rows={8}
                  value={formData.nomaChallenge}
                  onChange={handleChange}
                  required
                  className={ui.textarea}
                />
                <p
                  className={`mt-1.5 text-xs ${
                    nomaChallengeWordCount > NOMA_CHALLENGE_WORD_LIMIT ? "text-error" : "text-text-muted"
                  }`}
                >
                  {nomaChallengeWordCount} / {NOMA_CHALLENGE_WORD_LIMIT} words
                </p>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-6">
              <h2 className={ui.sectionTitle}>Section 5 &mdash; Optional: bring your solution to life</h2>
              <div className={ui.sectionRule} />
            </div>

            <div className="space-y-3 text-sm leading-relaxed text-text-muted">
              <p>
                Want to show us rather than just tell us? If helpful, you may submit something that
                demonstrates or expands upon your proposed solution. This could be something you create
                specifically for this challenge, a rough prototype or sketch, a small analysis, or another
                format that helps communicate your idea.
              </p>
              <p>
                This is completely optional. You are NOT expected to submit an additional file, and
                choosing not to do so will not negatively affect your application. We recognize that some
                proposed solutions lend themselves much more naturally to tangible deliverables than
                others.
              </p>
              <p>Depending on your approach, you might choose to submit:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>
                  <strong className="text-text">Marketing &amp; Communications:</strong> A mock
                  advertisement, social media campaign, brochure, outreach email, landing page, or
                  messaging strategy
                </li>
                <li>
                  <strong className="text-text">Software / AI:</strong> Code, model architecture,
                  agentic workflow
                </li>
                <li>
                  <strong className="text-text">Data Science:</strong> An analysis, visualization,
                  dashboard, or example of how you would evaluate available data
                </li>
                <li>
                  <strong className="text-text">Design / UI/UX:</strong> A wireframe, interface mockup,
                  patient journey, or product redesign
                </li>
                <li>
                  <strong className="text-text">Engineering:</strong> A sketch, CAD model, schematic,
                  prototype, or proposed hardware modification
                </li>
                <li>
                  <strong className="text-text">Biology / Clinical Research:</strong> An experimental
                  design, study protocol, clinical workflow, figure, or proposed validation approach
                </li>
                <li>
                  <strong className="text-text">Business / Finance:</strong> A market analysis, financial
                  model, competitor analysis, customer acquisition strategy, or pitch deck
                </li>
                <li>
                  <strong className="text-text">Product:</strong> A product roadmap, feature
                  prioritization framework, user research plan, or prototype
                </li>
                <li>
                  <strong className="text-text">Policy / Public Health:</strong> A regulatory strategy,
                  reimbursement analysis, implementation plan, or stakeholder analysis
                </li>
              </ul>
              <p>These are only examples, feel free to get creative.</p>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <FileUpload
                  onUploadComplete={() => {}}
                  onFileSelect={setSolutionFile}
                  acceptedFileTypes={SOLUTION_FILE_TYPES}
                  maxFileSize={50}
                  label="Upload supporting file(s)"
                  placeholder="Drag and drop a file here, or click to browse"
                  uploadEndpoint="/api/apply-student/upload-solution"
                  autoUpload={false}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="solutionLink" className={ui.label}>
                  Link to GitHub, website, prototype, or other supporting material
                </label>
                <input
                  id="solutionLink"
                  name="solutionLink"
                  type="url"
                  value={formData.solutionLink}
                  onChange={handleChange}
                  placeholder="https://"
                  className={ui.input}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="solutionDescription" className={ui.label}>
                  Briefly tell us what we&apos;re looking at and how it relates to your proposed solution.{" "}
                  {isSolutionDescriptionRequired && <span className={ui.required}>*</span>}
                </label>
                <p className="mb-3 text-xs text-text-muted">
                  {isSolutionDescriptionRequired
                    ? "Required since you added a link or file above."
                    : "Optional."}{" "}
                  {SOLUTION_DESCRIPTION_WORD_LIMIT} words maximum.
                </p>
                <textarea
                  id="solutionDescription"
                  name="solutionDescription"
                  rows={3}
                  value={formData.solutionDescription}
                  onChange={handleChange}
                  required={isSolutionDescriptionRequired}
                  className={ui.textarea}
                />
                <p
                  className={`mt-1.5 text-xs ${
                    solutionDescriptionWordCount > SOLUTION_DESCRIPTION_WORD_LIMIT
                      ? "text-error"
                      : "text-text-muted"
                  }`}
                >
                  {solutionDescriptionWordCount} / {SOLUTION_DESCRIPTION_WORD_LIMIT} words
                </p>
              </div>
            </div>
          </section>

          {renderSection(SECTION_FINAL_INFO, ["commitmentLevel", "retreatCommitment"])}

          <div className="-mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <label className={ui.label}>
                {COMMITMENT_LEVEL_FIELD.label} {COMMITMENT_LEVEL_FIELD.required && <span className={ui.required}>*</span>}
              </label>
              {COMMITMENT_LEVEL_FIELD.help && (
                <p className="mb-3 text-xs text-text-muted">{COMMITMENT_LEVEL_FIELD.help}</p>
              )}
            </div>
            <div>
              <label className={ui.label}>
                {RETREAT_COMMITMENT_FIELD.label} {RETREAT_COMMITMENT_FIELD.required && <span className={ui.required}>*</span>}
              </label>
              {RETREAT_COMMITMENT_FIELD.help && (
                <p className="mb-3 text-xs text-text-muted">{RETREAT_COMMITMENT_FIELD.help}</p>
              )}
            </div>
            <div>{renderRadioOptions(COMMITMENT_LEVEL_FIELD)}</div>
            <div>
              {renderRadioOptions(RETREAT_COMMITMENT_FIELD)}
              {isRetreatCommitmentOtherRequired && (
                <div className="mt-3">
                  <label htmlFor="retreatCommitmentOther" className={ui.label}>
                    Please specify <span className={ui.required}>*</span>
                  </label>
                  <input
                    id="retreatCommitmentOther"
                    name="retreatCommitmentOther"
                    type="text"
                    value={formData.retreatCommitmentOther}
                    onChange={handleChange}
                    required
                    className={ui.input}
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <button type="submit" className={ui.primaryButton} disabled={!isFormValid() || isSubmitting}>
              {isSubmitting ? (
                <>
                  <span className={ui.spinner} />
                  Submitting application
                </>
              ) : (
                "Submit application"
              )}
            </button>
            <p className={ui.note}>
              {isSubmitting
                ? "Please wait while we save your application and upload your files."
                : !isFormValid()
                  ? "Please fill in all required fields and upload your resume to submit your application."
                  : "Your files upload directly and securely to our storage."}
              <br />
              Questions? Contact us at{" "}
              <a href="mailto:admin@yalehelix.org" className={ui.link}>
                admin@yalehelix.org
              </a>
              .
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
