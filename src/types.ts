export enum CaseCategory {
  PERSONAL_INJURY = "Personal Injury",
  CONTRACT_DISPUTE = "Contract Dispute",
  EMPLOYMENT_LAW = "Employment Law (SG Employment Act)",
  REAL_ESTATE = "Real Estate / Property",
  INTELLECTUAL_PROPERTY = "Intellectual Property",
  FAMILY_LAW = "Family Law (Women's Charter)",
  CRIMINAL_DEFENSE = "Criminal Defense (Penal Code)",
  CORPORATE_LAW = "Corporate / Commercial",
  SMALL_CLAIMS = "Small Claims Tribunal",
  OTHER = "Other"
}

export enum UrgencyLevel {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  CRITICAL = "Critical (Immediate Action Required)"
}

export enum WorkflowStatus {
  TRIAGE = "Triage & Analysis",
  READINESS = "Consultation Readiness",
  MATCHING = "Lawyer Matching",
  COMPLETED = "Ready for Consultation"
}

export interface ActionItem {
  id: string;
  type: 'question' | 'document' | 'action';
  label: string;
  description: string;
  completed: boolean;
}

export interface TimelineEvent {
  date: string;
  description: string;
  significance: string;
}

export interface Fact {
  statement: string;
  source: string;
  status: 'verified' | 'alleged' | 'disputed';
  timestamp?: string;
}

export interface LegalAssessment {
  strengths: string[];
  weaknesses: string[];
  estimatedTimeline: string;
  potentialRemedies: string[];
  lawyerConsultationGuide: string;
}

export interface FactPackage {
  caseTitle: string;
  category: CaseCategory;
  urgency: UrgencyLevel;
  urgencyReason: string;
  summary: string;
  facts: Fact[];
  timeline: TimelineEvent[];
  actionList: ActionItem[];
  keyQuestionsForLawyer: string[];
  recommendedNextStep: string;
  workflowStatus: WorkflowStatus;
  legalAssessment?: LegalAssessment;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  factPackage: FactPackage | null;
  error: string | null;
}
