import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const REQUIRED = [
  "startupName",
  "contactName",
  "email",
  "startupDescription",
  "primaryProblem",
  "solution",
  "currentStage",
  "targetCustomers",
  "businessModel",
  "team",
  "milestoneAchievements",
  "twelveMonthGoals",
  "mentorWhy",
  "mentorQualities",
  "studentDevelopment",
  "fellowCount",
  "exampleProjects",
  "involvementLevel",
  "deckPath",
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
    if (!Array.isArray(b.skillSets) || b.skillSets.length === 0) {
      return NextResponse.json({ error: "Select at least one skill set" }, { status: 400 });
    }

    const row = {
      startup_name: str(b.startupName),
      contact_name: str(b.contactName),
      email: str(b.email).toLowerCase(),
      website: str(b.website) || null,
      linkedin: str(b.linkedin) || null,
      startup_description: str(b.startupDescription),
      primary_problem: str(b.primaryProblem),
      solution: str(b.solution),
      current_stage: str(b.currentStage),
      target_customers: str(b.targetCustomers),
      business_model: str(b.businessModel),
      team: str(b.team),
      milestone_achievements: str(b.milestoneAchievements),
      twelve_month_goals: str(b.twelveMonthGoals),
      other_accelerators: str(b.otherAccelerators) || null,
      additional_info: str(b.additionalInfo) || null,
      mentor_why: str(b.mentorWhy),
      mentor_qualities: str(b.mentorQualities),
      student_development: str(b.studentDevelopment),
      fellow_count: str(b.fellowCount),
      skill_sets: b.skillSets as string[],
      skill_sets_other: str(b.skillSetsOther) || null,
      example_projects: str(b.exampleProjects),
      desired_skills: str(b.desiredSkills) || null,
      involvement_level: str(b.involvementLevel),
      deck_path: str(b.deckPath),
      deck_filename: str(b.deckFilename) || null,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("startup_applications")
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
