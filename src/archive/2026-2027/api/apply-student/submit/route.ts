import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const REQUIRED = [
  "firstName",
  "lastName",
  "email",
  "classYear",
  "major",
  "resumePath",
  "whyHelix",
  "skillsExperience",
  "proudProject",
  "nomaChallenge",
  "commitmentLevel",
  "retreatCommitment",
];

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export async function POST(request: NextRequest) {
  try {
    const b = await request.json();

    for (const field of REQUIRED) {
      if (!str(b[field])) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }
    if (!Array.isArray(b.areasOfInterest) || b.areasOfInterest.length === 0) {
      return NextResponse.json({ error: "Select at least one area of interest" }, { status: 400 });
    }
    if (b.retreatCommitment === "Other" && !str(b.retreatCommitmentOther)) {
      return NextResponse.json({ error: "Please specify your retreat availability" }, { status: 400 });
    }

    const row = {
      first_name: str(b.firstName),
      last_name: str(b.lastName),
      email: str(b.email).toLowerCase(),
      class_year: str(b.classYear),
      major: str(b.major),
      areas_of_interest: b.areasOfInterest as string[],
      linkedin: str(b.linkedin) || null,
      resume_path: str(b.resumePath),
      resume_filename: str(b.resumeFilename) || null,
      portfolio_link: str(b.portfolioLink) || null,
      project_path: str(b.projectPath) || null,
      project_filename: str(b.projectFilename) || null,
      project_description: str(b.projectDescription) || null,
      why_helix: str(b.whyHelix),
      skills_experience: str(b.skillsExperience),
      proud_project: str(b.proudProject),
      noma_challenge: str(b.nomaChallenge),
      solution_path: str(b.solutionPath) || null,
      solution_filename: str(b.solutionFilename) || null,
      solution_link: str(b.solutionLink) || null,
      solution_description: str(b.solutionDescription) || null,
      additional_info: str(b.additionalInfo) || null,
      commitment_level: str(b.commitmentLevel),
      retreat_commitment: str(b.retreatCommitment),
      retreat_commitment_other: str(b.retreatCommitmentOther) || null,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("student_applications")
      .insert(row)
      .select("id")
      .single();

    if (error) {
      console.error("insert error:", error);
      return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: data.id });
  } catch (err) {
    console.error("submit error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
