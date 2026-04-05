// server/utils/validation.js

const OPPORTUNITY_TYPES = ["Job", "Internship", "Hackathon", "Scholarship"];
const APPLICATION_STATUSES = [
  "Saved",
  "Applied",
  "Test",
  "Interview",
  "Selected",
  "Rejected",
  "Offer",
];

/**
 * Validate opportunity title and company
 */
const validateTitleCompany = (title, company) => {
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return {
      valid: false,
      error: "Title is required and must be a non-empty string",
    };
  }
  if (!company || typeof company !== "string" || company.trim().length === 0) {
    return {
      valid: false,
      error: "Company is required and must be a non-empty string",
    };
  }
  return { valid: true };
};

/**
 * Validate opportunity type enum
 */
const validateType = (type) => {
  if (!type || !OPPORTUNITY_TYPES.includes(type)) {
    return {
      valid: false,
      error: `Type must be one of: ${OPPORTUNITY_TYPES.join(", ")}`,
    };
  }
  return { valid: true };
};

/**
 * Validate opportunity deadline
 */
const validateDeadline = (deadline) => {
  if (!deadline) {
    return { valid: true }; // deadline is optional
  }

  try {
    const date = new Date(deadline);
    if (Number.isNaN(date.getTime())) {
      return { valid: false, error: "Deadline must be a valid date" };
    }
    // Optionally: check if date is in the future
    // if (date < new Date()) {
    //   return { valid: false, error: "Deadline must be in the future" };
    // }
    return { valid: true };
  } catch {
    return { valid: false, error: "Deadline must be a valid date" };
  }
};

/**
 * Validate URL format
 */
const validateUrl = (url) => {
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    return { valid: true }; // URL is optional
  }

  const urlString = url.trim();
  try {
    new URL(urlString);
    return { valid: true };
  } catch {
    return {
      valid: false,
      error: "Link must be a valid URL starting with http:// or https://",
    };
  }
};

/**
 * Validate LinkedIn profile URL
 */
const validateLinkedInUrl = (url) => {
  if (!url || typeof url !== "string" || url.trim().length === 0) {
    return { valid: false, error: "LinkedIn profile URL is required" };
  }

  const urlString = url.trim();
  try {
    const parsed = new URL(urlString);
    const hostname = parsed.hostname.toLowerCase();

    if (!hostname.includes("linkedin.com")) {
      return {
        valid: false,
        error: "LinkedIn profile URL must be a valid linkedin.com address",
      };
    }

    return { valid: true };
  } catch {
    return {
      valid: false,
      error:
        "LinkedIn profile URL must be a valid URL starting with http:// or https://",
    };
  }
};

/**
 * Validate notes/description
 */
const validateNotes = (notes) => {
  if (!notes || typeof notes !== "string") {
    return { valid: true }; // Notes are optional
  }

  if (notes.length > 5000) {
    return { valid: false, error: "Notes must be 5000 characters or less" };
  }

  return { valid: true };
};

/**
 * Validate application status
 */
const validateApplicationStatus = (status) => {
  if (!status || !APPLICATION_STATUSES.includes(status)) {
    return {
      valid: false,
      error: `Status must be one of: ${APPLICATION_STATUSES.join(", ")}`,
    };
  }
  return { valid: true };
};

/**
 * Validate external application fields
 */
const validateExternalApplication = (title, company, type, link) => {
  // title and company are required
  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return {
      valid: false,
      error: "Title is required for external applications",
    };
  }
  if (!company || typeof company !== "string" || company.trim().length === 0) {
    return {
      valid: false,
      error: "Company is required for external applications",
    };
  }

  // type is optional but must be valid if provided
  if (type && !OPPORTUNITY_TYPES.includes(type) && type !== "") {
    return {
      valid: false,
      error: `Type must be one of: ${OPPORTUNITY_TYPES.join(", ")}, or empty`,
    };
  }

  // link must be valid URL if provided
  const linkValidation = validateUrl(link);
  if (!linkValidation.valid) {
    return linkValidation;
  }

  return { valid: true };
};

module.exports = {
  OPPORTUNITY_TYPES,
  APPLICATION_STATUSES,
  validateTitleCompany,
  validateType,
  validateDeadline,
  validateUrl,
  validateLinkedInUrl,
  validateNotes,
  validateApplicationStatus,
  validateExternalApplication,
};
