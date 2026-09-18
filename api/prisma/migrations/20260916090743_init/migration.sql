-- CreateEnum
CREATE TYPE "PlatformRole" AS ENUM ('PLATFORM_ADMIN', 'CONTENT_MANAGER', 'NONE');

-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('SCHOOL', 'TECHNICAL_COLLEGE', 'UNIVERSITY', 'YOUTH_PROGRAMME', 'GOVERNMENT_AGENCY', 'DEVELOPMENT_PARTNER', 'ENTERPRISE', 'OTHER');

-- CreateEnum
CREATE TYPE "InstitutionStatus" AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "InstitutionRole" AS ENUM ('INSTITUTION_ADMIN', 'FACILITATOR', 'MENTOR', 'LEARNER');

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('INVITED', 'ACTIVE', 'SUSPENDED', 'LEFT');

-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UserState" AS ENUM ('EXPLORER', 'EMERGING_ENTREPRENEUR', 'EXISTING_ENTERPRISE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "EducationLevel" AS ENUM ('PRIMARY', 'SECONDARY', 'TECHNICAL', 'UNDERGRADUATE', 'POSTGRADUATE', 'OTHER');

-- CreateEnum
CREATE TYPE "EmploymentStatus" AS ENUM ('STUDENT', 'EMPLOYED', 'SELF_EMPLOYED', 'UNEMPLOYED', 'OTHER');

-- CreateEnum
CREATE TYPE "PublishStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'RETIRED');

-- CreateEnum
CREATE TYPE "AuthoringStatus" AS ENUM ('PLACEHOLDER', 'IN_REVIEW', 'AUTHORED');

-- CreateEnum
CREATE TYPE "PathwayLevel" AS ENUM ('FOUNDATION', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "LessonKind" AS ENUM ('TEXT', 'VIDEO', 'DOWNLOAD', 'PRACTICAL');

-- CreateEnum
CREATE TYPE "AssessmentKind" AS ENUM ('QUIZ', 'SUBMISSION', 'PRACTICAL');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('ONLINE', 'BLENDED', 'IN_PERSON');

-- CreateEnum
CREATE TYPE "CohortStatus" AS ENUM ('PLANNED', 'OPEN', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FacilitatorRole" AS ENUM ('LEAD', 'ASSISTANT');

-- CreateEnum
CREATE TYPE "EnrolmentStatus" AS ENUM ('INVITED', 'ACTIVE', 'COMPLETED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ProgressStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "ExperienceFunction" AS ENUM ('LEARN', 'PRACTISE', 'BUILD');

-- CreateEnum
CREATE TYPE "SiteKind" AS ENUM ('OWNED_HUB', 'UNIVERSITY_FACILITY', 'PARTNER_FARM', 'TRAINING_CENTRE', 'EMPLOYER', 'CERTIFIED_PARTNER_HUB');

-- CreateEnum
CREATE TYPE "AccreditationStatus" AS ENUM ('PROSPECTIVE', 'IN_REVIEW', 'ACCREDITED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "SiteRole" AS ENUM ('SITE_MANAGER', 'SITE_FACILITATOR', 'VERIFIER');

-- CreateEnum
CREATE TYPE "ActivityKind" AS ENUM ('DEMONSTRATION', 'PRACTICAL', 'WORKSHOP', 'ASSESSMENT', 'MENTORING');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('SCHEDULED', 'OPEN', 'FULL', 'RUNNING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'CONFIRMED', 'WAITLISTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('PRESENT', 'PARTIAL', 'ABSENT', 'EXCUSED');

-- CreateEnum
CREATE TYPE "AttendanceMethod" AS ENUM ('FACILITATOR', 'QR_CODE', 'SELF_REPORTED');

-- CreateEnum
CREATE TYPE "CompetencyLevel" AS ENUM ('FOUNDATION', 'INTERMEDIATE', 'ADVANCED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_STARTED', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "VerificationMethod" AS ENUM ('OBSERVATION', 'EVIDENCE_REVIEW', 'ASSESSMENT');

-- CreateEnum
CREATE TYPE "EvidenceKind" AS ENUM ('PHOTO', 'DOCUMENT', 'VIDEO', 'NOTE');

-- CreateEnum
CREATE TYPE "CredentialKind" AS ENUM ('CERTIFICATE', 'COMPETENCY_BADGE');

-- CreateEnum
CREATE TYPE "EngagementStatus" AS ENUM ('REQUESTED', 'ACTIVE', 'ENDED', 'DECLINED');

-- CreateEnum
CREATE TYPE "ThreadStatus" AS ENUM ('OPEN', 'RESOLVED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EnterpriseStage" AS ENUM ('IDEA', 'PROTOTYPE', 'EARLY_REVENUE', 'ESTABLISHED');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('UNREGISTERED', 'IN_PROGRESS', 'REGISTERED');

-- CreateEnum
CREATE TYPE "ProjectStage" AS ENUM ('PLANNING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "SnapshotKind" AS ENUM ('INSTITUTION_OVERVIEW', 'COHORT_PROGRESS', 'EXPERIENCE_DELIVERY', 'COMPETENCY_ATTAINMENT');

-- CreateEnum
CREATE TYPE "EmailStatus" AS ENUM ('QUEUED', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "Institution" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "status" "InstitutionStatus" NOT NULL DEFAULT 'PENDING',
    "contactEmail" TEXT NOT NULL,
    "contactPhone" TEXT,
    "website" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "country" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Institution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "platformRole" "PlatformRole" NOT NULL DEFAULT 'NONE',
    "emailVerifiedAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "deactivatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "role" "InstitutionRole" NOT NULL,
    "status" "MembershipStatus" NOT NULL DEFAULT 'INVITED',
    "externalReference" TEXT,
    "department" TEXT,
    "programme" TEXT,
    "joinedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invite" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "role" "InstitutionRole" NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "status" "InviteStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "invitedById" UUID NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "acceptedById" UUID,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthSession" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "familyId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "replacedById" UUID,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "institutionId" UUID,
    "actorUserId" UUID,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "state" "UserState" NOT NULL DEFAULT 'EXPLORER',
    "phone" TEXT,
    "dateOfBirth" DATE,
    "gender" "Gender",
    "educationLevel" "EducationLevel",
    "employmentStatus" "EmploymentStatus",
    "location" TEXT,
    "bio" TEXT,
    "goals" TEXT,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearnerStateChange" (
    "id" UUID NOT NULL,
    "learnerProfileId" UUID NOT NULL,
    "fromState" "UserState",
    "toState" "UserState" NOT NULL,
    "reason" TEXT,
    "changedById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearnerStateChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pathway" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "level" "PathwayLevel" NOT NULL DEFAULT 'FOUNDATION',
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "estimatedHours" INTEGER,
    "sequence" INTEGER NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pathway_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PathwayModule" (
    "id" UUID NOT NULL,
    "pathwayId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "sequence" INTEGER NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PathwayModule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" UUID NOT NULL,
    "moduleId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "body" TEXT,
    "kind" "LessonKind" NOT NULL DEFAULT 'TEXT',
    "authoringStatus" "AuthoringStatus" NOT NULL DEFAULT 'PLACEHOLDER',
    "durationMinutes" INTEGER,
    "sequence" INTEGER NOT NULL,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assessment" (
    "id" UUID NOT NULL,
    "moduleId" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT,
    "kind" "AssessmentKind" NOT NULL DEFAULT 'QUIZ',
    "authoringStatus" "AuthoringStatus" NOT NULL DEFAULT 'PLACEHOLDER',
    "passMarkPercent" INTEGER NOT NULL DEFAULT 70,
    "maxAttempts" INTEGER,
    "timeLimitMinutes" INTEGER,
    "sequence" INTEGER NOT NULL DEFAULT 1,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Assessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "prompt" TEXT NOT NULL,
    "helpText" TEXT,
    "type" "QuestionType" NOT NULL DEFAULT 'SINGLE_CHOICE',
    "points" INTEGER NOT NULL DEFAULT 1,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentOption" (
    "id" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "label" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cohort" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "pathwayId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" "CohortStatus" NOT NULL DEFAULT 'PLANNED',
    "deliveryMode" "DeliveryMode" NOT NULL DEFAULT 'BLENDED',
    "startsOn" DATE,
    "endsOn" DATE,
    "capacity" INTEGER,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cohort_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CohortFacilitator" (
    "id" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "FacilitatorRole" NOT NULL DEFAULT 'LEAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CohortFacilitator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrolment" (
    "id" UUID NOT NULL,
    "cohortId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "status" "EnrolmentStatus" NOT NULL DEFAULT 'INVITED',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Enrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonProgress" (
    "id" UUID NOT NULL,
    "enrolmentId" UUID NOT NULL,
    "lessonId" UUID NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "timeSpentSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleProgress" (
    "id" UUID NOT NULL,
    "enrolmentId" UUID NOT NULL,
    "moduleId" UUID NOT NULL,
    "status" "ProgressStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ModuleProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentAttempt" (
    "id" UUID NOT NULL,
    "enrolmentId" UUID NOT NULL,
    "assessmentId" UUID NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "gradedAt" TIMESTAMP(3),
    "scorePercent" INTEGER,
    "passed" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResponse" (
    "id" UUID NOT NULL,
    "attemptId" UUID NOT NULL,
    "questionId" UUID NOT NULL,
    "textAnswer" TEXT,
    "isCorrect" BOOLEAN,
    "pointsAwarded" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResponseOption" (
    "id" UUID NOT NULL,
    "responseId" UUID NOT NULL,
    "optionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssessmentResponseOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExperienceSite" (
    "id" UUID NOT NULL,
    "institutionId" UUID,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "SiteKind" NOT NULL,
    "accreditationStatus" "AccreditationStatus" NOT NULL DEFAULT 'PROSPECTIVE',
    "isReferenceHub" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "addressLine" TEXT,
    "city" TEXT,
    "country" TEXT,
    "capacity" INTEGER,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExperienceSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteFunction" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "function" "ExperienceFunction" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteFunction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SiteStaff" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "role" "SiteRole" NOT NULL DEFAULT 'SITE_FACILITATOR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SiteStaff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "pathwayId" UUID,
    "moduleId" UUID,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "kind" "ActivityKind" NOT NULL DEFAULT 'PRACTICAL',
    "function" "ExperienceFunction" NOT NULL DEFAULT 'PRACTISE',
    "durationMinutes" INTEGER,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivitySession" (
    "id" UUID NOT NULL,
    "activityId" UUID NOT NULL,
    "siteId" UUID NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "capacity" INTEGER,
    "status" "SessionStatus" NOT NULL DEFAULT 'SCHEDULED',
    "facilitatorId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ActivitySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "enrolmentId" UUID,
    "status" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AttendanceRecord" (
    "id" UUID NOT NULL,
    "bookingId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "status" "AttendanceStatus" NOT NULL,
    "method" "AttendanceMethod" NOT NULL DEFAULT 'FACILITATOR',
    "recordedById" UUID NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AttendanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competency" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "level" "CompetencyLevel" NOT NULL DEFAULT 'FOUNDATION',
    "pathwayId" UUID,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyCriterion" (
    "id" UUID NOT NULL,
    "competencyId" UUID NOT NULL,
    "description" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyCriterion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetencyVerification" (
    "id" UUID NOT NULL,
    "competencyId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "enrolmentId" UUID,
    "siteId" UUID,
    "status" "VerificationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "method" "VerificationMethod" NOT NULL DEFAULT 'OBSERVATION',
    "verifiedById" UUID,
    "verifiedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompetencyVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationEvidence" (
    "id" UUID NOT NULL,
    "verificationId" UUID NOT NULL,
    "kind" "EvidenceKind" NOT NULL DEFAULT 'NOTE',
    "fileUrl" TEXT,
    "note" TEXT,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CredentialTemplate" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "kind" "CredentialKind" NOT NULL DEFAULT 'CERTIFICATE',
    "pathwayId" UUID,
    "competencyId" UUID,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CredentialTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "enrolmentId" UUID,
    "serial" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "headline" TEXT,
    "bio" TEXT,
    "expertise" TEXT[],
    "availability" TEXT,
    "status" "PublishStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipEngagement" (
    "id" UUID NOT NULL,
    "mentorId" UUID NOT NULL,
    "learnerId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "status" "EngagementStatus" NOT NULL DEFAULT 'REQUESTED',
    "focus" TEXT,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipThread" (
    "id" UUID NOT NULL,
    "engagementId" UUID NOT NULL,
    "subject" TEXT NOT NULL,
    "status" "ThreadStatus" NOT NULL DEFAULT 'OPEN',
    "lastMessageAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipThread_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipMessage" (
    "id" UUID NOT NULL,
    "threadId" UUID NOT NULL,
    "authorId" UUID NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MentorshipMessageRead" (
    "id" UUID NOT NULL,
    "messageId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentorshipMessageRead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "stage" "EnterpriseStage" NOT NULL DEFAULT 'IDEA',
    "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'UNREGISTERED',
    "sector" TEXT,
    "description" TEXT,
    "location" TEXT,
    "foundedOn" DATE,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseProject" (
    "id" UUID NOT NULL,
    "enterpriseProfileId" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "stage" "ProjectStage" NOT NULL DEFAULT 'PLANNING',
    "startedOn" DATE,
    "targetOn" DATE,
    "completedOn" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseProjectMilestone" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "dueOn" DATE,
    "completedOn" DATE,
    "sequence" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnterpriseProjectDocument" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnterpriseProjectDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSnapshot" (
    "id" UUID NOT NULL,
    "institutionId" UUID NOT NULL,
    "kind" "SnapshotKind" NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "payload" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReportSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" UUID NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "template" TEXT NOT NULL,
    "status" "EmailStatus" NOT NULL DEFAULT 'QUEUED',
    "providerMessageId" TEXT,
    "error" TEXT,
    "sentAt" TIMESTAMP(3),
    "institutionId" UUID,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Institution_slug_key" ON "Institution"("slug");

-- CreateIndex
CREATE INDEX "Institution_status_idx" ON "Institution"("status");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_deactivatedAt_idx" ON "User"("deactivatedAt");

-- CreateIndex
CREATE INDEX "Membership_institutionId_role_idx" ON "Membership"("institutionId", "role");

-- CreateIndex
CREATE INDEX "Membership_institutionId_status_idx" ON "Membership"("institutionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_userId_institutionId_key" ON "Membership"("userId", "institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "Invite_tokenHash_key" ON "Invite"("tokenHash");

-- CreateIndex
CREATE INDEX "Invite_institutionId_email_idx" ON "Invite"("institutionId", "email");

-- CreateIndex
CREATE INDEX "Invite_status_expiresAt_idx" ON "Invite"("status", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_tokenHash_key" ON "AuthSession"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "AuthSession_replacedById_key" ON "AuthSession"("replacedById");

-- CreateIndex
CREATE INDEX "AuthSession_userId_revokedAt_idx" ON "AuthSession"("userId", "revokedAt");

-- CreateIndex
CREATE INDEX "AuthSession_familyId_idx" ON "AuthSession"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_institutionId_createdAt_idx" ON "AuditEvent"("institutionId", "createdAt");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "LearnerProfile_userId_key" ON "LearnerProfile"("userId");

-- CreateIndex
CREATE INDEX "LearnerProfile_state_idx" ON "LearnerProfile"("state");

-- CreateIndex
CREATE INDEX "LearnerStateChange_learnerProfileId_createdAt_idx" ON "LearnerStateChange"("learnerProfileId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Pathway_slug_key" ON "Pathway"("slug");

-- CreateIndex
CREATE INDEX "Pathway_status_sequence_idx" ON "Pathway"("status", "sequence");

-- CreateIndex
CREATE INDEX "PathwayModule_pathwayId_sequence_idx" ON "PathwayModule"("pathwayId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "PathwayModule_pathwayId_slug_key" ON "PathwayModule"("pathwayId", "slug");

-- CreateIndex
CREATE INDEX "Lesson_moduleId_sequence_idx" ON "Lesson"("moduleId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_moduleId_slug_key" ON "Lesson"("moduleId", "slug");

-- CreateIndex
CREATE INDEX "Assessment_moduleId_sequence_idx" ON "Assessment"("moduleId", "sequence");

-- CreateIndex
CREATE UNIQUE INDEX "Assessment_moduleId_slug_key" ON "Assessment"("moduleId", "slug");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_sequence_idx" ON "AssessmentQuestion"("assessmentId", "sequence");

-- CreateIndex
CREATE INDEX "AssessmentOption_questionId_sequence_idx" ON "AssessmentOption"("questionId", "sequence");

-- CreateIndex
CREATE INDEX "Cohort_institutionId_status_idx" ON "Cohort"("institutionId", "status");

-- CreateIndex
CREATE INDEX "Cohort_pathwayId_idx" ON "Cohort"("pathwayId");

-- CreateIndex
CREATE UNIQUE INDEX "Cohort_institutionId_code_key" ON "Cohort"("institutionId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "CohortFacilitator_cohortId_userId_key" ON "CohortFacilitator"("cohortId", "userId");

-- CreateIndex
CREATE INDEX "Enrolment_institutionId_status_idx" ON "Enrolment"("institutionId", "status");

-- CreateIndex
CREATE INDEX "Enrolment_userId_idx" ON "Enrolment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Enrolment_cohortId_userId_key" ON "Enrolment"("cohortId", "userId");

-- CreateIndex
CREATE INDEX "LessonProgress_enrolmentId_status_idx" ON "LessonProgress"("enrolmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "LessonProgress_enrolmentId_lessonId_key" ON "LessonProgress"("enrolmentId", "lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleProgress_enrolmentId_moduleId_key" ON "ModuleProgress"("enrolmentId", "moduleId");

-- CreateIndex
CREATE INDEX "AssessmentAttempt_assessmentId_status_idx" ON "AssessmentAttempt"("assessmentId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentAttempt_enrolmentId_assessmentId_attemptNumber_key" ON "AssessmentAttempt"("enrolmentId", "assessmentId", "attemptNumber");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResponse_attemptId_questionId_key" ON "AssessmentResponse"("attemptId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResponseOption_responseId_optionId_key" ON "AssessmentResponseOption"("responseId", "optionId");

-- CreateIndex
CREATE UNIQUE INDEX "ExperienceSite_slug_key" ON "ExperienceSite"("slug");

-- CreateIndex
CREATE INDEX "ExperienceSite_kind_accreditationStatus_idx" ON "ExperienceSite"("kind", "accreditationStatus");

-- CreateIndex
CREATE INDEX "ExperienceSite_institutionId_idx" ON "ExperienceSite"("institutionId");

-- CreateIndex
CREATE UNIQUE INDEX "SiteFunction_siteId_function_key" ON "SiteFunction"("siteId", "function");

-- CreateIndex
CREATE UNIQUE INDEX "SiteStaff_siteId_userId_key" ON "SiteStaff"("siteId", "userId");

-- CreateIndex
CREATE INDEX "Activity_pathwayId_idx" ON "Activity"("pathwayId");

-- CreateIndex
CREATE UNIQUE INDEX "Activity_siteId_slug_key" ON "Activity"("siteId", "slug");

-- CreateIndex
CREATE INDEX "ActivitySession_siteId_startsAt_idx" ON "ActivitySession"("siteId", "startsAt");

-- CreateIndex
CREATE INDEX "ActivitySession_activityId_status_idx" ON "ActivitySession"("activityId", "status");

-- CreateIndex
CREATE INDEX "Booking_institutionId_status_idx" ON "Booking"("institutionId", "status");

-- CreateIndex
CREATE INDEX "Booking_userId_idx" ON "Booking"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Booking_sessionId_userId_key" ON "Booking"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "AttendanceRecord_bookingId_key" ON "AttendanceRecord"("bookingId");

-- CreateIndex
CREATE INDEX "AttendanceRecord_institutionId_recordedAt_idx" ON "AttendanceRecord"("institutionId", "recordedAt");

-- CreateIndex
CREATE INDEX "AttendanceRecord_userId_idx" ON "AttendanceRecord"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Competency_slug_key" ON "Competency"("slug");

-- CreateIndex
CREATE INDEX "Competency_pathwayId_status_idx" ON "Competency"("pathwayId", "status");

-- CreateIndex
CREATE INDEX "CompetencyCriterion_competencyId_sequence_idx" ON "CompetencyCriterion"("competencyId", "sequence");

-- CreateIndex
CREATE INDEX "CompetencyVerification_institutionId_status_idx" ON "CompetencyVerification"("institutionId", "status");

-- CreateIndex
CREATE INDEX "CompetencyVerification_userId_idx" ON "CompetencyVerification"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CompetencyVerification_competencyId_userId_institutionId_key" ON "CompetencyVerification"("competencyId", "userId", "institutionId");

-- CreateIndex
CREATE INDEX "VerificationEvidence_verificationId_idx" ON "VerificationEvidence"("verificationId");

-- CreateIndex
CREATE UNIQUE INDEX "CredentialTemplate_slug_key" ON "CredentialTemplate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_serial_key" ON "Credential"("serial");

-- CreateIndex
CREATE INDEX "Credential_userId_issuedAt_idx" ON "Credential"("userId", "issuedAt");

-- CreateIndex
CREATE INDEX "Credential_institutionId_issuedAt_idx" ON "Credential"("institutionId", "issuedAt");

-- CreateIndex
CREATE UNIQUE INDEX "MentorProfile_userId_key" ON "MentorProfile"("userId");

-- CreateIndex
CREATE INDEX "MentorshipEngagement_institutionId_status_idx" ON "MentorshipEngagement"("institutionId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipEngagement_mentorId_learnerId_institutionId_key" ON "MentorshipEngagement"("mentorId", "learnerId", "institutionId");

-- CreateIndex
CREATE INDEX "MentorshipThread_engagementId_lastMessageAt_idx" ON "MentorshipThread"("engagementId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "MentorshipMessage_threadId_createdAt_idx" ON "MentorshipMessage"("threadId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "MentorshipMessageRead_messageId_userId_key" ON "MentorshipMessageRead"("messageId", "userId");

-- CreateIndex
CREATE INDEX "EnterpriseProfile_institutionId_stage_idx" ON "EnterpriseProfile"("institutionId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "EnterpriseProfile_userId_institutionId_name_key" ON "EnterpriseProfile"("userId", "institutionId", "name");

-- CreateIndex
CREATE INDEX "EnterpriseProject_institutionId_stage_idx" ON "EnterpriseProject"("institutionId", "stage");

-- CreateIndex
CREATE INDEX "EnterpriseProjectMilestone_projectId_sequence_idx" ON "EnterpriseProjectMilestone"("projectId", "sequence");

-- CreateIndex
CREATE INDEX "EnterpriseProjectDocument_projectId_idx" ON "EnterpriseProjectDocument"("projectId");

-- CreateIndex
CREATE INDEX "ReportSnapshot_institutionId_generatedAt_idx" ON "ReportSnapshot"("institutionId", "generatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSnapshot_institutionId_kind_periodStart_periodEnd_key" ON "ReportSnapshot"("institutionId", "kind", "periodStart", "periodEnd");

-- CreateIndex
CREATE INDEX "EmailMessage_status_createdAt_idx" ON "EmailMessage"("status", "createdAt");

-- CreateIndex
CREATE INDEX "EmailMessage_to_idx" ON "EmailMessage"("to");

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invite" ADD CONSTRAINT "Invite_acceptedById_fkey" FOREIGN KEY ("acceptedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthSession" ADD CONSTRAINT "AuthSession_replacedById_fkey" FOREIGN KEY ("replacedById") REFERENCES "AuthSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerProfile" ADD CONSTRAINT "LearnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerStateChange" ADD CONSTRAINT "LearnerStateChange_learnerProfileId_fkey" FOREIGN KEY ("learnerProfileId") REFERENCES "LearnerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearnerStateChange" ADD CONSTRAINT "LearnerStateChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PathwayModule" ADD CONSTRAINT "PathwayModule_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "PathwayModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "PathwayModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentOption" ADD CONSTRAINT "AssessmentOption_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cohort" ADD CONSTRAINT "Cohort_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortFacilitator" ADD CONSTRAINT "CohortFacilitator_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CohortFacilitator" ADD CONSTRAINT "CohortFacilitator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "Cohort"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrolment" ADD CONSTRAINT "Enrolment_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonProgress" ADD CONSTRAINT "LessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleProgress" ADD CONSTRAINT "ModuleProgress_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleProgress" ADD CONSTRAINT "ModuleProgress_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "PathwayModule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentAttempt" ADD CONSTRAINT "AssessmentAttempt_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "Assessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "AssessmentAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponse" ADD CONSTRAINT "AssessmentResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "AssessmentQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponseOption" ADD CONSTRAINT "AssessmentResponseOption_responseId_fkey" FOREIGN KEY ("responseId") REFERENCES "AssessmentResponse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResponseOption" ADD CONSTRAINT "AssessmentResponseOption_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "AssessmentOption"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExperienceSite" ADD CONSTRAINT "ExperienceSite_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteFunction" ADD CONSTRAINT "SiteFunction_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ExperienceSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteStaff" ADD CONSTRAINT "SiteStaff_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ExperienceSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SiteStaff" ADD CONSTRAINT "SiteStaff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ExperienceSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "PathwayModule"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "Activity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ExperienceSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivitySession" ADD CONSTRAINT "ActivitySession_facilitatorId_fkey" FOREIGN KEY ("facilitatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ActivitySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ActivitySession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Competency" ADD CONSTRAINT "Competency_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyCriterion" ADD CONSTRAINT "CompetencyCriterion_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyVerification" ADD CONSTRAINT "CompetencyVerification_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyVerification" ADD CONSTRAINT "CompetencyVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyVerification" ADD CONSTRAINT "CompetencyVerification_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyVerification" ADD CONSTRAINT "CompetencyVerification_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyVerification" ADD CONSTRAINT "CompetencyVerification_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "ExperienceSite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetencyVerification" ADD CONSTRAINT "CompetencyVerification_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvidence" ADD CONSTRAINT "VerificationEvidence_verificationId_fkey" FOREIGN KEY ("verificationId") REFERENCES "CompetencyVerification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationEvidence" ADD CONSTRAINT "VerificationEvidence_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialTemplate" ADD CONSTRAINT "CredentialTemplate_pathwayId_fkey" FOREIGN KEY ("pathwayId") REFERENCES "Pathway"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CredentialTemplate" ADD CONSTRAINT "CredentialTemplate_competencyId_fkey" FOREIGN KEY ("competencyId") REFERENCES "Competency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "CredentialTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_enrolmentId_fkey" FOREIGN KEY ("enrolmentId") REFERENCES "Enrolment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorProfile" ADD CONSTRAINT "MentorProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipEngagement" ADD CONSTRAINT "MentorshipEngagement_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipEngagement" ADD CONSTRAINT "MentorshipEngagement_learnerId_fkey" FOREIGN KEY ("learnerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipEngagement" ADD CONSTRAINT "MentorshipEngagement_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipThread" ADD CONSTRAINT "MentorshipThread_engagementId_fkey" FOREIGN KEY ("engagementId") REFERENCES "MentorshipEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipMessage" ADD CONSTRAINT "MentorshipMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "MentorshipThread"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipMessage" ADD CONSTRAINT "MentorshipMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipMessageRead" ADD CONSTRAINT "MentorshipMessageRead_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "MentorshipMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MentorshipMessageRead" ADD CONSTRAINT "MentorshipMessageRead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProfile" ADD CONSTRAINT "EnterpriseProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProfile" ADD CONSTRAINT "EnterpriseProfile_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProject" ADD CONSTRAINT "EnterpriseProject_enterpriseProfileId_fkey" FOREIGN KEY ("enterpriseProfileId") REFERENCES "EnterpriseProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProject" ADD CONSTRAINT "EnterpriseProject_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProjectMilestone" ADD CONSTRAINT "EnterpriseProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "EnterpriseProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProjectDocument" ADD CONSTRAINT "EnterpriseProjectDocument_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "EnterpriseProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnterpriseProjectDocument" ADD CONSTRAINT "EnterpriseProjectDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSnapshot" ADD CONSTRAINT "ReportSnapshot_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailMessage" ADD CONSTRAINT "EmailMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
