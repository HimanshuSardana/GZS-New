/* eslint-disable react-refresh/only-export-components */
import { Navigate } from 'react-router-dom';

/**
 * Route Parameter Validators
 * Centralized validation for dynamic route parameters to prevent silent 404s
 */

// Valid community slugs
export const VALID_COMMUNITY_SLUGS = new Set([
  'dev', 'esports', 'content', 'business', 'art', 'writing', 'audio', 'general', 'newcomers'
]);

// Valid admin ID pattern (numeric or UUID)
const ID_PATTERN = /^[0-9a-f-]{1,36}$/i;

// Valid slug pattern (lowercase letters, numbers, hyphens)
const SLUG_PATTERN = /^[a-z0-9-]+$/;

/**
 * Validates community slug parameter
 * @param {string} slug - The community slug to validate
 * @returns {boolean} True if valid
 */
export const validateCommunitySlug = (slug) => {
  return VALID_COMMUNITY_SLUGS.has(slug?.toLowerCase());
};

/**
 * Validates a slug-type parameter (games, blogs, tournaments, etc.)
 * @param {string} slug - The slug to validate
 * @returns {boolean} True if valid (format check, not content)
 */
export const validateSlug = (slug) => {
  if (!slug) return false;
  // Allow lowercase letters, numbers, hyphens, underscores
  return /^[a-z0-9_-]+$/.test(slug.toLowerCase());
};

/**
 * Validates admin ID parameter
 * @param {string} id - The ID to validate
 * @returns {boolean} True if valid
 */
export const validateId = (id) => {
  if (!id) return false;
  return ID_PATTERN.test(id) || /^\d+$/.test(id);
};

/**
 * Validates username parameter
 * @param {string} username - The username to validate
 * @returns {boolean} True if valid
 */
export const validateUsername = (username) => {
  if (!username) return false;
  // Allow lowercase letters, numbers, underscores, hyphens; 3-30 chars
  return /^[a-z0-9_-]{3,30}$/.test(username.toLowerCase());
};

/**
 * Generic parameter validator wrapper
 * Returns Navigate to 404 if validation fails
 * @param {string} param - Parameter value to validate
 * @param {Function} validatorFn - Validation function
 * @returns {null|JSX.Element} null if valid, Navigate component if invalid
 */
export const getValidationResult = (param, validatorFn) => {
  if (!validatorFn(param)) {
    return <Navigate to="/404" replace />;
  }
  return null;
};

export default {
  validateCommunitySlug,
  validateSlug,
  validateId,
  validateUsername,
  getValidationResult,
  VALID_COMMUNITY_SLUGS,
};
