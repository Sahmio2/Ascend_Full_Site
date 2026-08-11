import { parseProgrammeDocx } from "../portal/data/programmeParser";

export type CoachBridgeResult = Record<string, unknown>;

export interface CoachPortalBridge {
  loadPeople(): Promise<CoachBridgeResult>;
  loadDocuments(): Promise<CoachBridgeResult>;
  loadOperations(): Promise<CoachBridgeResult>;
  updatePerson(id: string, input: Record<string, unknown>): Promise<CoachBridgeResult>;
  createPerson(input: Record<string, FormDataEntryValue>): Promise<CoachBridgeResult>;
  createProgramme(input: Record<string, FormDataEntryValue>): Promise<CoachBridgeResult>;
  uploadDocument(input: FormData): Promise<CoachBridgeResult>;
}

let activeBridge: CoachPortalBridge | null = null;

export function registerAscendCoachBridge(bridge: CoachPortalBridge) {
  activeBridge = bridge;
  return () => {
    if (activeBridge === bridge) activeBridge = null;
  };
}

function developmentId(prefix: string) {
  const id = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return `${prefix}-${id}`;
}

/**
 * Browser-safe boundary for the coach workspace. The in-memory fallbacks are
 * deliberately non-persistent and exist only so the supplied merge source can
 * be reviewed before the target dataStore bridge is connected.
 */
export const coachPortalAdapter = {
  async loadPeople() {
    return activeBridge?.loadPeople() ?? { people: [], activities: [], checkIns: [] };
  },

  async loadDocuments() {
    return activeBridge?.loadDocuments() ?? { documents: [] };
  },

  async loadOperations() {
    return activeBridge?.loadOperations() ?? { assignments: [], workouts: [] };
  },

  async updatePerson(id: string, input: Record<string, unknown>) {
    if (activeBridge) return activeBridge.updatePerson(id, input);
    return { error: "Connect the target dataStore before editing live athlete records." };
  },

  async createPerson(input: Record<string, FormDataEntryValue>) {
    if (activeBridge) return activeBridge.createPerson(input);
    const now = new Date().toISOString();
    return {
      person: {
        id: developmentId("review-athlete"),
        kind: "client",
        status: "active",
        full_name: String(input.fullName || "Review athlete"),
        email: String(input.email || ""),
        whatsapp: String(input.whatsapp || ""),
        city_country: "",
        age: "",
        primary_goal: String(input.primaryGoal || ""),
        goal_detail: "",
        goal_urgency: 5,
        training_age: "",
        preferred_frequency: "",
        session_length: "",
        access_type: "",
        days_available: "[]",
        equipment: "[]",
        pain_context: "",
        consistency_barrier: "",
        tracking_readiness: "[]",
        phase: String(input.phase || "Unassigned"),
        training_level: String(input.trainingLevel || "To assess"),
        next_check_in: String(input.nextCheckIn || ""),
        coach_note: String(input.coachNote || ""),
        created_at: now,
        updated_at: now,
        sample: true,
      },
    };
  },

  async createProgramme(input: Record<string, FormDataEntryValue>) {
    if (activeBridge) return activeBridge.createProgramme(input);
    return {
      assignment: {
        id: developmentId("review-programme"),
        person_id: String(input.personId || ""),
        title: String(input.title || "ASCEND Programme"),
        phase: String(input.phase || "Taming the Flesh"),
        days_per_week: Number(input.daysPerWeek || 4),
        status: String(input.status || "draft"),
        starts_on: String(input.startsOn || ""),
        ends_on: String(input.endsOn || ""),
        athlete_instructions: String(input.athleteInstructions || ""),
        primary_workouts: String(input.primaryWorkouts || ""),
        optional_workouts: String(input.optionalWorkouts || ""),
        workout_plan: "[]",
        updated_at: new Date().toISOString(),
      },
    };
  },

  async uploadDocument(input: FormData) {
    if (activeBridge) return activeBridge.uploadDocument(input);
    const file = input.get("file");
    const documentType = String(input.get("documentType") || "training");
    if (!(file instanceof File)) return { error: "Choose a programme file." };

    const document = {
      id: developmentId("review-document"),
      person_id: String(input.get("personId") || "review-athlete"),
      title: String(input.get("title") || file.name),
      document_type: documentType,
      file_name: file.name,
      file_size: file.size,
      status: "review-only",
      updated_at: new Date().toISOString(),
    };

    if (documentType !== "training" || !file.name.toLowerCase().endsWith(".docx")) {
      return { document, autoLoadSupported: false };
    }

    try {
      const programmeImport = parseProgrammeDocx(new Uint8Array(await file.arrayBuffer()));
      return {
        document,
        programmeImport,
        autoLoadSupported: true,
        assignment: programmeImport.workouts.length ? {
          id: developmentId("review-programme"),
          person_id: document.person_id,
          title: document.title,
          phase: "Forging the Form",
          days_per_week: programmeImport.workouts.filter((workout) => !workout.optional).length,
          status: "review-only",
          starts_on: "",
          ends_on: "",
          athlete_instructions: "Imported from DOCX for browser review. Connect the target store to persist it.",
          primary_workouts: programmeImport.workouts.filter((workout) => !workout.optional).map((workout) => workout.name).join("\n"),
          optional_workouts: programmeImport.workouts.filter((workout) => workout.optional).map((workout) => workout.name).join("\n"),
          workout_plan: JSON.stringify(programmeImport.workouts),
          updated_at: new Date().toISOString(),
        } : undefined,
      };
    } catch (error) {
      return { document, error: error instanceof Error ? error.message : "The DOCX could not be read." };
    }
  },
};
