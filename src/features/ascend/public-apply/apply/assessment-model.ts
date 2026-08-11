import type { AscendIconName } from "../components/AscendIcon";

export const ASSESSMENT_SCHEMA_VERSION = 2;
export const ASSESSMENT_SOURCE_VERSION = "ASCEND Self-Assessment Form v2.0";
export const SAFE_DRAFT_KEY = "ascend_assessment_safe_draft_v2";

export const movementNames = [
  "Squat pattern",
  "Hip hinge / RDL",
  "Lunge / split squat",
  "Horizontal press",
  "Overhead press",
  "Rows / pulldowns",
  "Core / abs",
] as const;
export type MovementName = (typeof movementNames)[number];

export const painAreas = ["Neck", "Shoulder", "Elbow", "Wrist / hand", "Lower back", "Hip", "Knee", "Ankle / foot"] as const;
export type PainArea = (typeof painAreas)[number];

export const kneeQuestions = [
  "Can you walk backward slowly for 2–5 minutes?",
  "Can you walk down stairs without pain or fear?",
  "Can you do a supported deep knee bend?",
  "Do your knees swell, lock, or give way after activity?",
] as const;
export type KneeQuestion = (typeof kneeQuestions)[number];

export const shoulderQuestions = [
  "Bench press discomfort?",
  "Overhead press discomfort?",
  "Pinching, instability, or clicking with pain?",
  "Rows and pulldowns feel okay?",
] as const;
export type ShoulderQuestion = (typeof shoulderQuestions)[number];

export type MovementValue = { rating: string; notes: string };
export type PainValue = { severity: string; trigger: string };
export type CheckValue = { answer: string; notes: string };

export type FormState = {
  fullName: string;
  preferredContactMethod: string;
  email: string;
  whatsapp: string;
  country: string;
  city: string;
  age: string;
  occupationSchedule: string;
  height: string;
  currentBodyweight: string;
  genderContext: string;
  genderOther: string;
  selectedGoals: string[];
  primaryGoal: string;
  primaryGoalOther: string;
  goalDetail: string;
  goalUrgency: number;
  startingStatus: string[];
  measurementsOptIn: string;
  bodyweightAverage: string;
  waistAtNavel: string;
  hipsGlutes: string;
  chestBust: string;
  upperArmLeft: string;
  upperArmRight: string;
  thighLeft: string;
  thighRight: string;
  progressPhotos: string;
  structureNotes: string[];
  trainingAge: string;
  currentWeeklyTraining: string;
  currentSplit: string;
  favoriteExercises: string;
  dislikedExercises: string;
  discomfortExercises: string;
  bestLifts: Record<"Squat" | "Bench" | "Deadlift / RDL" | "Row" | "Other", string>;
  gymConfidence: number;
  formConfidence: number;
  consistencyConfidence: number;
  consistencyBarrier: string;
  daysAvailable: string[];
  bestTrainingTime: string;
  sessionLength: string;
  preferredFrequency: string;
  travelScheduleIssues: string;
  accessTypes: string[];
  equipment: string[];
  equipmentOther: string;
  missingEquipment: string;
  trainingStyle: string[];
  movementComfort: Record<MovementName, MovementValue>;
  exercisesWanted: string;
  exercisesAvoided: string;
  anyCurrentPain: string;
  painMap: Record<PainArea, PainValue>;
  painDuration: string;
  painDurationOther: string;
  painNextDay: string;
  redFlags: string[];
  kneeChecks: Record<KneeQuestion, CheckValue>;
  shoulderChecks: Record<ShoulderQuestion, CheckValue>;
  mealsPerDay: string;
  proteinEachMeal: string;
  appetite: string;
  cookingAccess: string[];
  foodBudget: string;
  foodBudgetNotes: string;
  culturalFoods: string;
  allergiesStatus: string;
  allergiesRestrictions: string;
  supplementsUsed: string;
  nutritionGoalDirection: string[];
  menstruationRelevant: string;
  regularCycle: string;
  cycleEnergy: string;
  cycleEnergyNotes: string;
  pregnancyStatus: string;
  averageSleep: string;
  sleepQuality: string;
  stressLevel: string;
  dailyActivity: string;
  stepsEstimate: string;
  sorenessRecovery: string;
  workoutEnergy: string;
  cardioOptions: string[];
  cardioOther: string;
  cardioPreference: string;
  cardioPainIssues: string[];
  cardioPainOther: string;
  conditioningGoal: string;
  trackingReadiness: string[];
  understandsKgReps: string;
  canFillTracker: string;
  preferredTrackingMethod: string;
  checkinPreference: string;
  nonNegotiables: string[];
  honestConfirmation: boolean;
  coachingScopeConfirmation: boolean;
  symptomsConfirmation: boolean;
  trackingAgreement: boolean;
  website: string;
};

const blankMovement = Object.fromEntries(movementNames.map((name) => [name, { rating: "", notes: "" }])) as Record<MovementName, MovementValue>;
const blankPainMap = Object.fromEntries(painAreas.map((area) => [area, { severity: "", trigger: "" }])) as Record<PainArea, PainValue>;
const blankKneeChecks = Object.fromEntries(kneeQuestions.map((question) => [question, { answer: "", notes: "" }])) as Record<KneeQuestion, CheckValue>;
const blankShoulderChecks = Object.fromEntries(shoulderQuestions.map((question) => [question, { answer: "", notes: "" }])) as Record<ShoulderQuestion, CheckValue>;

export function createInitialState(): FormState {
  return {
    fullName: "", preferredContactMethod: "", email: "", whatsapp: "", country: "", city: "", age: "", occupationSchedule: "", height: "", currentBodyweight: "", genderContext: "", genderOther: "",
    selectedGoals: [], primaryGoal: "", primaryGoalOther: "", goalDetail: "", goalUrgency: 7,
    startingStatus: [], measurementsOptIn: "", bodyweightAverage: "", waistAtNavel: "", hipsGlutes: "", chestBust: "", upperArmLeft: "", upperArmRight: "", thighLeft: "", thighRight: "", progressPhotos: "", structureNotes: [],
    trainingAge: "", currentWeeklyTraining: "", currentSplit: "", favoriteExercises: "", dislikedExercises: "", discomfortExercises: "",
    bestLifts: { Squat: "", Bench: "", "Deadlift / RDL": "", Row: "", Other: "" }, gymConfidence: 5, formConfidence: 5, consistencyConfidence: 5, consistencyBarrier: "",
    daysAvailable: [], bestTrainingTime: "", sessionLength: "", preferredFrequency: "", travelScheduleIssues: "", accessTypes: [], equipment: [], equipmentOther: "", missingEquipment: "",
    trainingStyle: [], movementComfort: structuredClone(blankMovement), exercisesWanted: "", exercisesAvoided: "", anyCurrentPain: "", painMap: structuredClone(blankPainMap), painDuration: "", painDurationOther: "", painNextDay: "", redFlags: [], kneeChecks: structuredClone(blankKneeChecks), shoulderChecks: structuredClone(blankShoulderChecks),
    mealsPerDay: "", proteinEachMeal: "", appetite: "", cookingAccess: [], foodBudget: "", foodBudgetNotes: "", culturalFoods: "", allergiesStatus: "", allergiesRestrictions: "", supplementsUsed: "", nutritionGoalDirection: [],
    menstruationRelevant: "", regularCycle: "", cycleEnergy: "", cycleEnergyNotes: "", pregnancyStatus: "", averageSleep: "", sleepQuality: "", stressLevel: "", dailyActivity: "", stepsEstimate: "", sorenessRecovery: "", workoutEnergy: "",
    cardioOptions: [], cardioOther: "", cardioPreference: "", cardioPainIssues: [], cardioPainOther: "", conditioningGoal: "", trackingReadiness: [], understandsKgReps: "", canFillTracker: "", preferredTrackingMethod: "", checkinPreference: "", nonNegotiables: [],
    honestConfirmation: false, coachingScopeConfirmation: false, symptomsConfirmation: false, trackingAgreement: false, website: "",
  };
}

export const steps: { label: string; shortLabel: string; icon: AscendIconName }[] = [
  { label: "About you", shortLabel: "About", icon: "applications" },
  { label: "Goals", shortLabel: "Goals", icon: "progress" },
  { label: "Training background", shortLabel: "Training", icon: "workout" },
  { label: "Schedule and equipment", shortLabel: "Schedule", icon: "applications" },
  { label: "Training preferences", shortLabel: "Preferences", icon: "workout" },
  { label: "Pain and safety", shortLabel: "Safety", icon: "checkins" },
  { label: "Nutrition", shortLabel: "Nutrition", icon: "progress" },
  { label: "Recovery and cardio", shortLabel: "Recovery", icon: "checkins" },
  { label: "Tracking and confirmation", shortLabel: "Confirm", icon: "applications" },
];

export const goals = ["Fat loss", "Body recomposition", "Lean muscle gain", "Glute / lower-body growth", "Strength", "General fitness", "Beginner confidence", "Aesthetic physique development", "Knee ability / movement rebuild", "Shoulder-safe pressing rebuild", "Post-break comeback", "Other"];
export const startingStatuses = ["Very lean / low muscle", "Moderate body fat", "Carrying extra body fat", "Strong but wants better shape", "Returning after a long break", "Beginner with low confidence", "Experienced but inconsistent", "Not sure"];
export const structureOptions = ["Long arms", "Short arms", "Long legs", "Short legs", "Short torso", "Long torso", "Pressing feels hard", "Squatting feels hard", "Deadlifting feels natural", "Machines feel better than free weights", "Not sure yet", "Coach should assess in session"];
export const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
export const accessOptions = ["Commercial gym", "Home gym", "School gym", "Hotel / travel gym", "Outdoor only", "Mixed access"];
export const equipmentOptions = ["Barbell", "Dumbbells", "Smith machine", "Cable machine", "Leg press", "Hack squat / pendulum", "Leg extension", "Seated / lying leg curl", "Chest press machine", "Chest-supported row", "Pull-up bar", "Lat pulldown", "Pec deck / rear delt machine", "Hip thrust setup", "Hip abduction machine", "Treadmill / bike / stairmaster", "Bands", "Kettlebells", "Back extension", "Not sure", "Other"];
export const trainingStyles = ["Simple and repeatable", "Variety", "Machines", "Free weights", "Bodybuilding pump work", "Strength focus", "Glute / lower-body bias", "Upper-body aesthetic bias", "Athletic / movement focus", "Coach decides"];
export const redFlagOptions = ["Major swelling", "Joint locks or cannot straighten", "Repeated giving way", "Numbness or tingling", "Sharp pain that worsens", "Pain worse the next day after light work", "Recent trauma", "Cannot bear weight normally", "Hot / red swelling with fever", "None of these"];
export const nutritionDirections = ["Protein-first lean gain", "Body recomposition", "Controlled fat loss", "Maintenance / consistency first", "I need simple meal structure", "I struggle to eat enough", "I snack too much", "I do not know yet"];
export const cardioChoices = ["Walking", "Incline walking", "Bike", "Stairmaster", "Swimming", "Running", "Skipping", "Sports", "Backward walking", "Sled push / drag", "None right now", "Other"];
export const trackingOptions = ["Workout completed", "Exercise load in kg", "Reps", "Sets", "How hard a set felt", "Pain notes", "Average bodyweight", "Waist or clothing fit", "Protein consistency", "Sleep", "Steps", "Energy"];
export const nonNegotiableOptions = ["No very long sessions", "No painful exercises", "No unavailable machines", "No extreme dieting", "Simple meals", "Budget-friendly food", "Beginner-friendly explanations", "Glute focus", "Upper-body focus", "Strength focus", "Low cardio", "Coach decides"];

export type ErrorMap = Record<string, string>;

function hasContact(form: FormState) {
  return Boolean(form.whatsapp.trim() || form.email.trim());
}

export function validateStep(step: number, form: FormState): ErrorMap {
  const errors: ErrorMap = {};
  const required = (key: string, value: string | string[], message: string) => {
    if (Array.isArray(value) ? value.length === 0 : !value.trim()) errors[key] = message;
  };
  if (step === 1) {
    required("full-name", form.fullName, "Enter your full name.");
    required("age", form.age, "Enter your age in years.");
    const age = Number(form.age);
    if (form.age && (!Number.isInteger(age) || age < 13 || age > 100)) errors.age = "Enter a valid age between 13 and 100.";
    required("preferred-contact", form.preferredContactMethod, "Choose how you would like ASCEND to contact you.");
    if (form.preferredContactMethod === "Phone / WhatsApp") required("whatsapp", form.whatsapp, "Enter your phone or WhatsApp number.");
    if (form.preferredContactMethod === "Email") required("email", form.email, "Enter your email address.");
    if (form.preferredContactMethod && !hasContact(form)) errors[form.preferredContactMethod === "Email" ? "email" : "whatsapp"] = "Enter the contact detail you selected.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Enter a valid email address.";
    required("country", form.country, "Enter your country.");
  }
  if (step === 2) {
    required("selected-goals", form.selectedGoals, "Choose at least one fitness goal to continue.");
    if (form.selectedGoals.includes("Other") && !form.primaryGoalOther.trim()) errors["goal-other"] = "Describe the other goal in a few words.";
    if (form.selectedGoals.length > 1 && !form.primaryGoal) errors["primary-goal"] = "Choose which selected goal should guide your first coaching priorities.";
  }
  if (step === 3) {
    required("training-age", form.trainingAge, "Choose the option closest to your training experience.");
    required("current-training", form.currentWeeklyTraining, "Choose your current weekly training frequency.");
    required("discomfort-exercises", form.discomfortExercises, "Enter an exercise or short description, or write None.");
  }
  if (step === 4) {
    required("days-available", form.daysAvailable, "Choose at least one day you can usually protect for training.");
    required("session-length", form.sessionLength, "Choose the longest session you can usually repeat.");
    required("access-types", form.accessTypes, "Choose every place you expect to train.");
    if (form.accessTypes.length) required("equipment", form.equipment, "Choose the equipment you can access reliably, or choose Not sure.");
    if (form.equipment.includes("Other") && !form.equipmentOther.trim()) errors["equipment-other"] = "Name the other equipment you can use.";
  }
  if (step === 5) {
    movementNames.forEach((name) => {
      if (!form.movementComfort[name].rating) errors[`movement-${slug(name)}`] = `Choose the option that best describes your ${name.toLowerCase()}.`;
    });
  }
  if (step === 6) {
    required("pain-gateway", form.anyCurrentPain, "Choose Yes, No, or Not sure.");
    const activePain = painAreas.filter((area) => form.painMap[area].severity && form.painMap[area].severity !== "None");
    if ((form.anyCurrentPain === "Yes" || form.anyCurrentPain === "Not sure") && activePain.length === 0) errors["pain-areas"] = "Choose at least one pain area and severity, or return to the pain question and choose No.";
    activePain.forEach((area) => {
      if (!form.painMap[area].trigger.trim()) errors[`pain-${slug(area)}-trigger`] = `Describe what triggers the ${area.toLowerCase()} discomfort.`;
    });
    if (activePain.length && !form.painDuration) errors["pain-duration"] = "Choose how long the discomfort has been present.";
    if (form.painDuration === "Other" && !form.painDurationOther.trim()) errors["pain-duration-other"] = "Describe the duration in a few words.";
    if (activePain.length && !form.painNextDay) errors["pain-next-day"] = "Choose the closest next-day response.";
    required("red-flags", form.redFlags, "Choose every statement that applies, or choose None of these.");
  }
  if (step === 7) {
    required("meals-per-day", form.mealsPerDay, "Choose your usual meal pattern.");
    required("cooking-access", form.cookingAccess, "Choose every cooking or meal situation that regularly applies.");
    required("allergies-status", form.allergiesStatus, "Choose None, Not sure, or tell us that you have allergies or restrictions.");
    if (form.allergiesStatus === "I have allergies or restrictions" && !form.allergiesRestrictions.trim()) errors["allergies-detail"] = "Describe the allergy or restriction without adding medical records.";
  }
  if (step === 8) {
    const fields: Array<[string, string, string]> = [
      ["average-sleep", form.averageSleep, "Choose your average sleep."], ["sleep-quality", form.sleepQuality, "Choose your usual sleep quality."], ["stress-level", form.stressLevel, "Choose your usual stress level."], ["daily-activity", form.dailyActivity, "Choose your usual daily activity."], ["steps-estimate", form.stepsEstimate, "Choose your best estimate, including Not sure."], ["soreness-recovery", form.sorenessRecovery, "Choose your usual recovery pattern."], ["workout-energy", form.workoutEnergy, "Choose your usual workout energy, including Not training yet."],
    ];
    fields.forEach(([key, value, message]) => required(key, value, message));
    required("cardio-options", form.cardioOptions, "Choose at least one cardio option, including None right now.");
    if (form.cardioOptions.includes("Other") && !form.cardioOther.trim()) errors["cardio-other"] = "Name the other cardio option.";
    required("cardio-pain", form.cardioPainIssues, "Choose any cardio pain areas, or choose None.");
    if (form.cardioPainIssues.includes("Other") && !form.cardioPainOther.trim()) errors["cardio-pain-other"] = "Describe the other cardio pain area.";
  }
  if (step === 9) {
    required("tracking-readiness", form.trackingReadiness, "Choose at least one item you are willing to track.");
    required("understands-tracking", form.understandsKgReps, "Tell us whether you can record weight and reps.");
    required("non-negotiables", form.nonNegotiables, "Choose every condition the plan should respect.");
    if (!form.honestConfirmation) errors["honest-confirmation"] = "Confirm that your answers are honest to the best of your ability.";
    if (!form.coachingScopeConfirmation) errors["scope-confirmation"] = "Confirm that this is coaching intake, not medical diagnosis.";
    if (!form.symptomsConfirmation) errors["symptoms-confirmation"] = "Confirm that you will report unusual symptoms.";
    if (!form.trackingAgreement) errors["tracking-agreement"] = "Confirm that you agree to track enough for the plan to be adjusted.";
  }
  return errors;
}

export function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function safetyStatus(form: FormState) {
  const hasRedFlag = form.redFlags.some((item) => item !== "None of these");
  const pregnancyReview = form.pregnancyStatus === "Yes";
  const nutritionReview = form.allergiesStatus === "I have allergies or restrictions";
  const guardianReview = Boolean(form.age && Number(form.age) < 14);
  return hasRedFlag || pregnancyReview || nutritionReview || guardianReview ? "review_required" : "none";
}

function activePainMap(form: FormState) {
  if (form.anyCurrentPain === "No") return {};
  return Object.fromEntries(Object.entries(form.painMap).filter(([, value]) => value.severity && value.severity !== "None"));
}

export function buildSubmissionPayload(form: FormState, idempotencyKey: string) {
  const activePain = activePainMap(form);
  const noCurrentTraining = form.currentWeeklyTraining === "None" || form.trainingAge === "Never trained properly";
  const measurements = form.measurementsOptIn === "Yes" ? {
    weeklyWeightAverage: form.bodyweightAverage, waist: form.waistAtNavel, hipsGlutes: form.hipsGlutes, chestBust: form.chestBust, upperArmLeft: form.upperArmLeft, upperArmRight: form.upperArmRight, thighLeft: form.thighLeft, thighRight: form.thighRight,
  } : { declined: form.measurementsOptIn || "Not answered" };
  const mainGoal = form.selectedGoals.length === 1 ? form.selectedGoals[0] : form.primaryGoal;
  const resolvedMainGoal = mainGoal === "Other" ? form.primaryGoalOther : mainGoal;
  const assessment = {
    meta: { schemaVersion: ASSESSMENT_SCHEMA_VERSION, sourceFormVersion: ASSESSMENT_SOURCE_VERSION, coachProgram: "ASCEND BY SAHMI EL", guardianReviewRequired: Boolean(form.age && Number(form.age) < 14) },
    identity: { fullName: form.fullName, age: form.age, preferredContactMethod: form.preferredContactMethod, phone: form.whatsapp, email: form.email, country: form.country, city: form.city, scheduleContext: form.occupationSchedule, height: form.height ? `${form.height} cm` : "", currentBodyweight: form.currentBodyweight ? `${form.currentBodyweight} kg` : "", sexGenderContext: form.genderContext, sexGenderOther: form.genderContext === "Other" ? form.genderOther : "" },
    goals: { selected: form.selectedGoals, other: form.selectedGoals.includes("Other") ? form.primaryGoalOther : "", primary: resolvedMainGoal, resultDescription: form.goalDetail, priority: form.goalUrgency },
    starting: { status: form.startingStatus, measurements, progressPhotos: form.progressPhotos, structureNotes: form.structureNotes },
    training: { experience: form.trainingAge, currentWeekly: form.currentWeeklyTraining, currentSplit: noCurrentTraining ? "" : form.currentSplit, favouriteExercises: form.favoriteExercises, preferNotToDo: form.dislikedExercises, discomfortExercises: form.discomfortExercises, bestLifts: noCurrentTraining ? {} : form.bestLifts, confidence: { gym: form.gymConfidence, form: form.formConfidence, consistency: form.consistencyConfidence }, consistencyBarriers: form.consistencyBarrier },
    schedule: { days: form.daysAvailable, bestTime: form.bestTrainingTime, maxSession: form.sessionLength, preferredFrequency: form.preferredFrequency, travelIssues: form.travelScheduleIssues },
    equipment: { accessTypes: form.accessTypes, available: form.equipment, other: form.equipment.includes("Other") ? form.equipmentOther : "", missing: form.missingEquipment },
    preferences: { style: form.trainingStyle, wantIncluded: form.exercisesWanted, exclude: form.exercisesAvoided },
    movement: form.movementComfort,
    pain: { anyCurrent: form.anyCurrentPain, areas: activePain, duration: Object.keys(activePain).length ? form.painDuration : "", durationOther: form.painDuration === "Other" ? form.painDurationOther : "", nextDayResponse: Object.keys(activePain).length ? form.painNextDay : "", redFlags: form.redFlags, knee: form.kneeChecks, shoulder: form.shoulderChecks, safetyStatus: safetyStatus(form) },
    nutrition: { mealsPerDay: form.mealsPerDay, proteinEachMeal: form.proteinEachMeal, appetite: form.appetite, cookingAccess: form.cookingAccess, foodBudget: form.foodBudget, foodBudgetNotes: form.foodBudgetNotes, culturalFoods: form.culturalFoods, allergiesStatus: form.allergiesStatus, allergiesRestrictions: form.allergiesStatus === "I have allergies or restrictions" ? form.allergiesRestrictions : "", supplements: form.supplementsUsed, goalDirection: form.nutritionGoalDirection },
    health: { menstruationRelevant: form.menstruationRelevant, cycleRegular: form.menstruationRelevant === "Yes" ? form.regularCycle : "", cycleEnergy: form.menstruationRelevant === "Yes" ? form.cycleEnergy : "", cycleEnergyNotes: form.menstruationRelevant === "Yes" ? form.cycleEnergyNotes : "", pregnancyContext: form.pregnancyStatus },
    recovery: { sleepHours: form.averageSleep, sleepQuality: form.sleepQuality, stress: form.stressLevel, dailyActivity: form.dailyActivity, steps: form.stepsEstimate, sorenessRecovery: form.sorenessRecovery, workoutEnergy: form.workoutEnergy },
    cardio: { options: form.cardioOptions, other: form.cardioOptions.includes("Other") ? form.cardioOther : "", preference: form.cardioPreference, pain: form.cardioPainIssues, painOther: form.cardioPainIssues.includes("Other") ? form.cardioPainOther : "", conditioningGoal: form.conditioningGoal },
    tracking: { willing: form.trackingReadiness, understanding: form.understandsKgReps, weeklyTracker: form.canFillTracker, method: form.preferredTrackingMethod, checkinPreference: form.checkinPreference, nonnegotiables: form.nonNegotiables },
    consent: { accuracy: form.honestConfirmation, scope: form.coachingScopeConfirmation, symptomNotice: form.symptomsConfirmation, trackingCommitment: form.trackingAgreement },
  };
  const painContext = Object.entries(activePain).map(([area, value]) => `${area}: ${(value as PainValue).severity} — ${(value as PainValue).trigger}`).join("; ");
  return {
    fullName: form.fullName, email: form.email, whatsapp: form.whatsapp, cityCountry: [form.city, form.country].filter(Boolean).join(", "), age: form.age, height: form.height ? `${form.height} cm` : "", bodyweight: form.currentBodyweight ? `${form.currentBodyweight} kg` : "",
    primaryGoal: resolvedMainGoal, selectedGoals: form.selectedGoals, goalDetail: form.goalDetail, goalUrgency: form.goalUrgency, trainingAge: form.trainingAge, preferredFrequency: form.preferredFrequency, sessionLength: form.sessionLength, accessType: form.accessTypes.join(", "), daysAvailable: form.daysAvailable, equipment: form.equipment,
    painContext: painContext || (form.anyCurrentPain === "No" ? "None reported." : form.discomfortExercises), safetyStatus: safetyStatus(form), consistencyBarrier: form.consistencyBarrier, trackingReadiness: form.trackingReadiness,
    assessment, idempotencyKey, consent: true, website: form.website,
  };
}

export type SafeDraft = {
  schemaVersion: number;
  updatedAt: string;
  currentStep: number;
  answers: Partial<Pick<FormState, "selectedGoals" | "primaryGoal" | "primaryGoalOther" | "goalUrgency" | "trainingAge" | "currentWeeklyTraining" | "daysAvailable" | "bestTrainingTime" | "sessionLength" | "preferredFrequency" | "accessTypes" | "equipment" | "equipmentOther" | "trainingStyle" | "trackingReadiness" | "understandsKgReps" | "canFillTracker" | "preferredTrackingMethod" | "checkinPreference" | "nonNegotiables">>;
};

export function makeSafeDraft(form: FormState, currentStep: number): SafeDraft {
  const answers: SafeDraft["answers"] = {
    selectedGoals: form.selectedGoals, primaryGoal: form.primaryGoal, primaryGoalOther: form.primaryGoalOther, goalUrgency: form.goalUrgency,
    trainingAge: form.trainingAge, currentWeeklyTraining: form.currentWeeklyTraining, daysAvailable: form.daysAvailable, bestTrainingTime: form.bestTrainingTime, sessionLength: form.sessionLength, preferredFrequency: form.preferredFrequency,
    accessTypes: form.accessTypes, equipment: form.equipment, equipmentOther: form.equipmentOther, trainingStyle: form.trainingStyle, trackingReadiness: form.trackingReadiness, understandsKgReps: form.understandsKgReps, canFillTracker: form.canFillTracker, preferredTrackingMethod: form.preferredTrackingMethod, checkinPreference: form.checkinPreference, nonNegotiables: form.nonNegotiables,
  };
  return { schemaVersion: ASSESSMENT_SCHEMA_VERSION, updatedAt: new Date().toISOString(), currentStep: Math.max(2, Math.min(currentStep, 5)), answers };
}

export function parseSafeDraft(raw: string | null): SafeDraft | null {
  if (!raw) return null;
  try {
    const draft = JSON.parse(raw) as SafeDraft;
    if (draft.schemaVersion !== ASSESSMENT_SCHEMA_VERSION || !draft.answers || !draft.updatedAt) return null;
    return draft;
  } catch {
    return null;
  }
}

export function restoreSafeDraft(draft: SafeDraft) {
  return { ...createInitialState(), ...draft.answers } as FormState;
}

export type ReviewSection = { title: string; step: number; entries: Array<[string, unknown]> };

export function reviewSections(form: FormState): ReviewSection[] {
  const display = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.length ? value.join(", ") : "Not provided";
    if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>).filter(([, item]) => Boolean(item)).map(([key, item]) => `${key}: ${typeof item === "object" ? JSON.stringify(item) : String(item)}`).join("; ") || "Not provided";
    return value || "Not provided";
  };
  const movement = movementNames.map((name) => [name, [form.movementComfort[name].rating, form.movementComfort[name].notes].filter(Boolean).join(" — ")] as [string, unknown]);
  const activePain = Object.entries(activePainMap(form)).map(([area, value]) => [area, `${(value as PainValue).severity} — ${(value as PainValue).trigger}`] as [string, unknown]);
  const kneeActive = form.selectedGoals.includes("Knee ability / movement rebuild") || form.painMap.Knee.severity && form.painMap.Knee.severity !== "None";
  const shoulderActive = form.selectedGoals.includes("Shoulder-safe pressing rebuild") || form.painMap.Shoulder.severity && form.painMap.Shoulder.severity !== "None";
  return [
    { title: "About you", step: 1, entries: [["Full name", form.fullName], ["Age", form.age], ["Preferred contact", form.preferredContactMethod], ["Phone / WhatsApp", form.whatsapp], ["Email", form.email], ["Location", [form.city, form.country].filter(Boolean).join(", ")], ["Schedule context", form.occupationSchedule], ["Height", form.height ? `${form.height} cm` : ""], ["Current bodyweight", form.currentBodyweight ? `${form.currentBodyweight} kg` : ""], ["Sex / gender context", form.genderContext === "Other" ? form.genderOther : form.genderContext]].map(([a,b]) => [a,display(b)] as [string,unknown]) },
    { title: "Goals", step: 2, entries: [["Selected goals", form.selectedGoals], ["Main priority", form.selectedGoals.length === 1 ? form.selectedGoals[0] : form.primaryGoal], ["Other goal", form.selectedGoals.includes("Other") ? form.primaryGoalOther : ""], ["Desired result", form.goalDetail], ["Priority", `${form.goalUrgency}/10`]].map(([a,b]) => [a,display(b)] as [string,unknown]) },
    { title: "Starting point and history", step: 3, entries: [["Starting status", form.startingStatus], ["Measurements", form.measurementsOptIn === "Yes" ? { weeklyWeight: form.bodyweightAverage, waist: form.waistAtNavel, hips: form.hipsGlutes, chest: form.chestBust, leftArm: form.upperArmLeft, rightArm: form.upperArmRight, leftThigh: form.thighLeft, rightThigh: form.thighRight } : "Declined / not provided"], ["Progress photos", form.progressPhotos], ["Structure notes", form.structureNotes], ["Training experience", form.trainingAge], ["Current weekly training", form.currentWeeklyTraining], ["Current routine", form.currentSplit], ["Favourite exercises", form.favoriteExercises], ["Prefer not to do", form.dislikedExercises], ["Discomfort exercises", form.discomfortExercises], ["Known lifts", form.bestLifts], ["Confidence", `Gym ${form.gymConfidence}/10; Form ${form.formConfidence}/10; Consistency ${form.consistencyConfidence}/10`], ["Consistency barriers", form.consistencyBarrier]].map(([a,b]) => [a,display(b)] as [string,unknown]) },
    { title: "Schedule and equipment", step: 4, entries: [["Available days", form.daysAvailable], ["Best time", form.bestTrainingTime], ["Maximum session", form.sessionLength], ["Preferred frequency", form.preferredFrequency], ["Travel / schedule issues", form.travelScheduleIssues], ["Training locations", form.accessTypes], ["Equipment", form.equipment], ["Other equipment", form.equipmentOther], ["Missing / unreliable equipment", form.missingEquipment]].map(([a,b]) => [a,display(b)] as [string,unknown]) },
    { title: "Movement fit", step: 5, entries: [["Training style", display(form.trainingStyle)], ...movement, ["Want included", form.exercisesWanted], ["Exclude", form.exercisesAvoided]].map(([a,b]) => [a,display(b)] as [string,unknown]) },
    { title: "Pain and safety", step: 6, entries: [["Current pain", form.anyCurrentPain], ...activePain, ["Duration", form.painDuration === "Other" ? form.painDurationOther : form.painDuration], ["Next-day response", form.painNextDay], ["Red flags", form.redFlags], ...(kneeActive ? kneeQuestions.map((question) => [question, display(form.kneeChecks[question])]) : []), ...(shoulderActive ? shoulderQuestions.map((question) => [question, display(form.shoulderChecks[question])]) : [])].map(([a,b]) => [a,display(b)] as [string,unknown]) },
    { title: "Nutrition and health context", step: 7, entries: [["Meals per day", form.mealsPerDay], ["Protein each meal", form.proteinEachMeal], ["Appetite", form.appetite], ["Cooking access", form.cookingAccess], ["Food budget", [form.foodBudget, form.foodBudgetNotes].filter(Boolean).join(" — ")], ["Preferred foods", form.culturalFoods], ["Allergies / restrictions", form.allergiesStatus === "I have allergies or restrictions" ? form.allergiesRestrictions : form.allergiesStatus], ["Supplements", form.supplementsUsed], ["Realistic direction", form.nutritionGoalDirection], ["Menstruation questions relevant", form.menstruationRelevant], ["Cycle regularity", form.menstruationRelevant === "Yes" ? form.regularCycle : ""], ["Cycle energy", form.menstruationRelevant === "Yes" ? [form.cycleEnergy, form.cycleEnergyNotes].filter(Boolean).join(" — ") : ""], ["Pregnancy / postpartum / breastfeeding", form.pregnancyStatus]].map(([a,b]) => [a,display(b)] as [string,unknown]) },
    { title: "Recovery and cardio", step: 8, entries: [["Average sleep", form.averageSleep], ["Sleep quality", form.sleepQuality], ["Stress", form.stressLevel], ["Daily activity", form.dailyActivity], ["Steps", form.stepsEstimate], ["Soreness recovery", form.sorenessRecovery], ["Workout energy", form.workoutEnergy], ["Cardio options", form.cardioOptions], ["Cardio preference", form.cardioPreference], ["Cardio pain", form.cardioPainIssues], ["Conditioning goal", form.conditioningGoal]].map(([a,b]) => [a,display(b)] as [string,unknown]) },
    { title: "Tracking", step: 9, entries: [["Willing to track", form.trackingReadiness], ["Tracking understanding", form.understandsKgReps], ["Weekly tracker", form.canFillTracker], ["Tracking method", form.preferredTrackingMethod], ["Check-in preference", form.checkinPreference], ["Plan non-negotiables", form.nonNegotiables]].map(([a,b]) => [a,display(b)] as [string,unknown]) },
  ];
}
