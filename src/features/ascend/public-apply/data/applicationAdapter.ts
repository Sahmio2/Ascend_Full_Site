import type {
  ApplicationRepository,
  ApplicationSubmissionResult,
} from "../../../../repositories/ApplicationRepository";

export type AscendApplicationResult = ApplicationSubmissionResult;

export type AscendApplicationSubmitter = (
  payload: unknown,
) => Promise<AscendApplicationResult>;

let activeSubmitter: AscendApplicationSubmitter | null = null;

/**
 * Register the target Antigravity dataStore implementation once at app startup.
 * This keeps the assessment UI independent from API routes and prevents direct
 * LocalStorage writes outside the existing store architecture.
 */
export function registerAscendApplicationSubmitter(
  submitter: AscendApplicationSubmitter,
) {
  activeSubmitter = submitter;
  return () => {
    if (activeSubmitter === submitter) activeSubmitter = null;
  };
}

export function registerAscendApplicationRepository(
  repository: ApplicationRepository,
) {
  return registerAscendApplicationSubmitter((payload) => repository.create(payload));
}

export async function submitAscendApplication(payload: unknown) {
  if (!activeSubmitter) {
    throw new Error(
      "Connect the existing dataStore.createApplication method before rendering /apply.",
    );
  }
  return activeSubmitter(payload);
}

export function connectAscendApplicationStore(dataStore: {
  createApplication(payload: unknown):
    | { id?: string; reference?: string }
    | Promise<{ id?: string; reference?: string }>;
}) {
  return registerAscendApplicationSubmitter(async (payload) => {
    const result = await dataStore.createApplication(payload);
    const reference = result.reference ?? result.id;
    if (!reference) {
      throw new Error("The application store did not return an id or reference.");
    }
    return { reference };
  });
}
